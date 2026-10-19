// Calls Claude through the Anthropic Messages API.
// With a JSON schema, Claude is forced to answer through a tool whose input
// matches the schema, so the result is always a parsed object.
import { HttpError } from "./server.js";

const DEFAULT_MODEL = "claude-sonnet-5-5";
const API_URL = "https://api.anthropic.com/v1/messages";

function normalizeSchema(schema) {
  if (!schema || typeof schema !== "object") return null;
  return schema.type === "object" ? schema : { type: "object", properties: { result: schema }, required: ["result"] };
}

export async function callClaude({ prompt, schema, system, maxTokens } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new HttpError(500, "AI is not configured yet (missing ANTHROPIC_API_KEY).");
  if (!prompt || typeof prompt !== "string") throw new HttpError(400, "A prompt is required.");
  if (prompt.length > 120000) throw new HttpError(413, "That request is too long. Shorten it and try again.");

  const inputSchema = normalizeSchema(schema);
  const body = {
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: maxTokens || (inputSchema ? 16000 : 4000),
    messages: [{ role: "user", content: prompt }],
  };
  if (system) body.system = String(system).slice(0, 8000);
  if (inputSchema) {
    body.tools = [{ name: "respond", description: "Return the complete answer in this exact structure.", input_schema: inputSchema }];
    body.tool_choice = { type: "tool", name: "respond" };
  }

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

  if (inputSchema) {
    const toolUse = (data.content || []).find((block) => block.type === "tool_use");
    if (!toolUse?.input) throw new HttpError(502, "The AI returned an incomplete answer. Please try again.");
    return schema.type === "object" ? toolUse.input : toolUse.input.result;
  }
  return (data.content || []).filter((block) => block.type === "text").map((block) => block.text).join("\n").trim();
}
