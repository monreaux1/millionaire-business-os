// Shared server helpers for Vercel functions: Supabase clients, auth, responses.
import { createClient } from "@supabase/supabase-js";
import { createEntityStore, EntityError } from "../../src/api/entity-store.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export { EntityError };

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requireEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    throw new HttpError(500, "Server is missing Supabase configuration (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).");
  }
}

let adminClient;
// Service-role client: bypasses Row Level Security. Server-only, never sent to browsers.
export function getAdmin() {
  requireEnv();
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

// Client acting AS the signed-in user, so Row Level Security still applies.
export function getUserClient(token) {
  requireEnv();
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

const adminEmails = () =>
  String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

export const bearerToken = (req) => {
  const header = typeof req.headers?.get === "function"
    ? req.headers.get("authorization") || ""
    : req.headers?.authorization || req.headers?.Authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
};

// Returns { user, token, db } for a signed-in request, or throws 401.
export async function requireUser(req) {
  const token = bearerToken(req);
  if (!token) throw new HttpError(401, "Unauthorized");
  const { data, error } = await getAdmin().auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, "Unauthorized");
  const raw = data.user;
  const user = {
    id: raw.id,
    email: raw.email,
    full_name: raw.user_metadata?.full_name || raw.user_metadata?.name || "",
    role: adminEmails().includes(String(raw.email || "").toLowerCase()) ? "admin" : "user",
  };
  return { user, token, db: createEntityStore(getUserClient(token)) };
}

export const adminDb = () => createEntityStore(getAdmin());

export function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

export function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

// Wraps a handler: POST only, JSON errors, no stack traces to the browser.
export function postHandler(fn, { name = "api" } = {}) {
  return async (req, res) => {
    if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
    try {
      const result = await fn(req, readBody(req));
      return sendJson(res, result?.status || 200, result?.body ?? result ?? {});
    } catch (error) {
      const status = Number(error?.status) || 500;
      if (status >= 500) console.error(`${name} error`, error);
      const message = status >= 500 && !(error instanceof HttpError)
        ? "Something went wrong. Please try again."
        : error?.message || "Request failed";
      return sendJson(res, status, { error: message });
    }
  };
}
