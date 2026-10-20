// Calls Claude through the Anthropic Messages API.
// With a JSON schema, Claude answers through a tool whose input matches the
// schema; answers that come back garbled are retried once as plain JSON text.
import { HttpError } from "./server.js";

const DEFAULT_MODEL = "claude-sonnet-5-5";
const API_URL = "https://api.anthropic.com/v1/messages";

function normalizeSchema(schema) {
  if (!schema || typeof schema !== "object") return null;
  return schema.type === "object" ? schema : { type: "object", properties: { result: schema }, required: ["result"] };
}

async function requestClaude(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      // Needed only for organization-level keys that aren't tied to a workspace.
      ...(process.env.ANTHROPIC_WORKSPACE_ID ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID.trim() } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("Anthropic API error", res.status, data?.error?.message);
    if (res.status === 401 || res.status === 403) throw new HttpError(500, "The AI key is invalid. Update ANTHROPIC_API_KEY in Vercel.");
    if (res.status === 429 || res.status === 529) throw new HttpError(429, "The AI is busy right now. Please try again in a minute.");
    if (res.status === 400 && /credit|billing/i.test(data?.error?.message || "")) {
      throw new HttpError(402, "AI credits are used up. Add credits in the Anthropic console.");
    }
    if (/workspace/i.test(data?.error?.message || "")) {
      throw new HttpError(500, "The AI key isn't tied to an Anthropic workspace. Create the key inside a workspace (console.anthropic.com → Workspaces) or set ANTHROPIC_WORKSPACE_ID in Vercel.");
    }
    const detail = String(data?.error?.message || `HTTP ${res.status}`).slice(0, 300);
    throw new HttpError(502, `The AI could not finish this request. Please try again. (${detail})`);
  }
  return data;
}

export async function callClaude({ prompt, schema, system, maxTokens } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new HttpError(500, "AI is not configured yet (missing ANTHROPIC_API_KEY).");
  if (!prompt || typeof prompt !== "string") throw new HttpError(400, "A prompt is required.");
  if (prompt.length > 120000) throw new HttpError(413, "That request is too long. Shorten it and try again.");

  const inputSchema = normalizeSchema(schema);
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const baseSystem = system ? String(system).slice(0, 8000) : "";

  if (!inputSchema) {
    const data = await requestClaude({
      model,
      max_tokens: maxTokens || 4000,
      messages: [{ role: "user", content: prompt }],
      ...(baseSystem ? { system: baseSystem } : {}),
    });
    return (data.content || []).filter((block) => block.type === "text").map((block) => block.text).join("\n").trim();
  }

  const unwrap = (value) => (schema.type === "object" ? value : value?.result);

  // 1st try: answer through a tool whose input matches the schema. Newer models
  // don't allow forcing a specific tool, so we use "auto" plus an instruction.
  const toolData = await requestClaude({
    model,
    max_tokens: maxTokens || 16000,
    messages: [{ role: "user", content: prompt }],
    tools: [{ name: "respond", description: "Return the complete answer in this exact structure.", input_schema: inputSchema }],
    tool_choice: { type: "auto" },
    system: [baseSystem, "Always answer by calling the `respond` tool exactly once with the complete answer. Do not reply with plain text."].filter(Boolean).join("\n\n"),
  });
  let structured = extractStructured(toolData);
  if (structured) {
    structured = coerceToSchema(structured, inputSchema);
    if (schemaProblems(structured, inputSchema).length === 0) return unwrap(structured);
    console.warn("Claude tool answer did not match the schema; retrying as JSON text", schemaProblems(structured, inputSchema).slice(0, 5));
  }

  // 2nd try: plain JSON text. Large nested schemas sometimes come back garbled
  // through tool calls; asking for JSON directly is the reliable fallback.
  const textData = await requestClaude({
    model,
    max_tokens: maxTokens || 16000,
    messages: [{ role: "user", content: prompt }],
    system: [
      baseSystem,
      "Reply with ONE JSON object and nothing else (no prose, no code fences). It must match this JSON Schema exactly: arrays must be JSON arrays, nested objects must stay nested, numbers must be numbers.",
      JSON.stringify(inputSchema),
    ].filter(Boolean).join("\n\n"),
  });
  const fromText = extractStructured(textData);
  if (fromText) {
    const coerced = coerceToSchema(fromText, inputSchema);
    if (schemaProblems(coerced, inputSchema).length === 0 || !structured) return unwrap(coerced);
    // Both answers are imperfect: keep the one with fewer problems.
    return unwrap(schemaProblems(coerced, inputSchema).length <= schemaProblems(structured, inputSchema).length ? coerced : structured);
  }
  if (structured) return unwrap(structured);
  throw new HttpError(502, "The AI returned an incomplete answer. Please try again.");
}

const TOOL_MARKUP = /<\/?(?:parameter|invoke|antml:|function_calls)\b|<parameter name=/i;
const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);
const isIndexObject = (v) => isPlainObject(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => /^\d+$/.test(k));

// Fixes common shape slips: {"0":…,"1":…} instead of an array, "12" instead of 12.
export function coerceToSchema(value, schema) {
  if (!schema || typeof schema !== "object") return value;
  if (schema.type === "array") {
    let arr = value;
    if (isIndexObject(value)) arr = Object.keys(value).sort((a, b) => a - b).map((k) => value[k]);
    else if (typeof value === "string" && /^\s*\[/.test(value)) { try { arr = JSON.parse(value); } catch { /* keep */ } }
    if (!Array.isArray(arr)) return value;
    return arr.map((item) => coerceToSchema(item, schema.items));
  }
  if (schema.type === "object") {
    let obj = value;
    if (typeof value === "string" && /^\s*\{/.test(value)) { try { obj = JSON.parse(value); } catch { /* keep */ } }
    if (!isPlainObject(obj) || !schema.properties) return obj;
    const out = { ...obj };
    for (const [key, sub] of Object.entries(schema.properties)) {
      if (key in out) out[key] = coerceToSchema(out[key], sub);
    }
    return out;
  }
  if (schema.type === "number" || schema.type === "integer") {
    if (typeof value === "string") {
      const n = Number(value.replace(/[$,\s]/g, ""));
      if (value.trim() && Number.isFinite(n)) return n;
    }
    return value;
  }
  return value;
}

// Lists ways `value` breaks the schema badly enough to show broken output.
export function schemaProblems(value, schema, path = "$", out = []) {
  if (!schema || typeof schema !== "object" || out.length > 20) return out;
  if (typeof value === "string") {
    if (TOOL_MARKUP.test(value)) out.push(`${path}: tool markup in text`);
    if (schema.type === "object" || schema.type === "array") out.push(`${path}: expected ${schema.type}`);
    return out;
  }
  if (value === null || value === undefined) return out;
  if (schema.type === "array") {
    if (!Array.isArray(value)) { out.push(`${path}: expected array`); return out; }
    value.slice(0, 30).forEach((item, i) => schemaProblems(item, schema.items, `${path}[${i}]`, out));
    return out;
  }
  if (schema.type === "object") {
    if (!isPlainObject(value)) { out.push(`${path}: expected object`); return out; }
    const keys = Object.keys(value);
    if (keys.some((k) => /^\d+$/.test(k))) out.push(`${path}: numbered keys`);
    if (schema.properties) {
      const defined = Object.keys(schema.properties);
      const present = defined.filter((k) => value[k] !== undefined && value[k] !== null && value[k] !== "");
      if (path === "$" && defined.length >= 4 && present.length < Math.ceil(defined.length / 2)) {
        out.push(`${path}: missing most fields`);
      }
      for (const key of defined) {
        if (key in value) schemaProblems(value[key], schema.properties[key], `${path}.${key}`, out);
      }
      // Fields of nested objects that leaked up to this level.
      const nestedNames = new Set();
      for (const sub of Object.values(schema.properties)) {
        if (sub?.type === "object" && sub.properties) Object.keys(sub.properties).forEach((k) => nestedNames.add(k));
      }
      const leaked = keys.filter((k) => !defined.includes(k) && nestedNames.has(k));
      if (leaked.length) out.push(`${path}: nested fields at wrong level (${leaked.slice(0, 3).join(", ")})`);
    }
    return out;
  }
  if ((schema.type === "number" || schema.type === "integer") && typeof value !== "number") out.push(`${path}: expected number`);
  return out;
}

// Tool call input, or JSON found in a text reply (with or without ``` fences).
export function extractStructured(data) {
  const blocks = data?.content || [];
  const toolUse = blocks.find((block) => block.type === "tool_use" && block.input && typeof block.input === "object");
  if (toolUse) return toolUse.input;
  const text = blocks.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const candidates = [];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1]);
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch { /* try next */ }
  }
  return null;
}
