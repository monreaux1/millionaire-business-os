// Drop-in replacement for the Base44 SDK client, running on Supabase + our own
// /api server. Pages keep calling `base44.entities.X`, `base44.auth.me()`,
// `base44.integrations.Core.InvokeLLM()` and `base44.functions.invoke()`
// exactly as before.
import { createClient } from "@supabase/supabase-js";
import { createEntityStore, EntityError } from "@/api/entity-store";

// Accepts the project URL with or without a pasted API path (e.g. ".../rest/v1/").
const cleanSupabaseUrl = (value) =>
  String(value || "").trim().replace(/\/(rest|auth|storage)\/v1\/?.*$/, "").replace(/\/+$/, "");
const SUPABASE_URL = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY environment variables.");
}

export const supabase = createClient(SUPABASE_URL || "https://missing.supabase.co", SUPABASE_ANON_KEY || "missing", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const toAppUser = (user) =>
  user
    ? {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        role: user.app_metadata?.role || "user",
        created_date: user.created_at,
      }
    : null;

async function accessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || "";
}

// POST to our own server API with the user's session; throws errors shaped like
// Base44's ({ status, data: { error } }) so existing error handling keeps working.
export async function callApi(path, body) {
  const token = await accessToken();
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text || "Unexpected server response" }; }
  if (!res.ok) {
    throw new EntityError(data?.error || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

const auth = {
  async me() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) throw new EntityError("Authentication required", 401);
    return toAppUser(data.user);
  },
  async isAuthenticated() {
    const { data } = await supabase.auth.getSession();
    return Boolean(data?.session);
  },
  async updateMe(fields = {}) {
    const { data, error } = await supabase.auth.updateUser({ data: fields });
    if (error) throw new EntityError(error.message, 400);
    return toAppUser(data.user);
  },
  redirectToLogin(nextUrl) {
    const next = nextUrl ? new URL(nextUrl, window.location.origin) : window.location;
    const path = `${next.pathname}${next.search}${next.hash}`;
    window.location.assign(`/login?next=${encodeURIComponent(path)}`);
  },
  async logout(redirectUrl) {
    await supabase.auth.signOut().catch(() => null);
    if (redirectUrl !== undefined) window.location.assign("/login");
  },
};

const integrations = {
  Core: {
    // Same contract as Base44: returns the parsed JSON object when a schema is
    // given, otherwise the text answer.
    async InvokeLLM({ prompt, response_json_schema, system, business_id, use_brand } = {}) {
      const result = await callApi("/api/llm", { prompt, response_json_schema, system, business_id, use_brand });
      return result.result;
    },
    async SendEmail({ subject, body, to } = {}) {
      return callApi("/api/send-email", { subject, body, to });
    },
    async UploadFile({ file } = {}) {
      if (!file) throw new EntityError("No file selected", 400);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new EntityError("Authentication required", 401);
      const safeName = String(file.name || "upload").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80);
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (error) throw new EntityError(error.message || "Upload failed", 400);
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
    async GenerateVideo() {
      throw new EntityError("Video generation isn't available yet.", 501);
    },
  },
};

const functions = {
  // Base44 returned an axios-style response: { data }.
  async invoke(name, payload) {
    if (!/^[A-Za-z0-9_-]+$/.test(String(name))) throw new EntityError("Unknown function", 400);
    const data = await callApi(`/api/fn/${name}`, payload);
    return { data, status: 200 };
  },
};

export const base44 = {
  entities: createEntityStore(supabase),
  auth,
  integrations,
  functions,
};

export default base44;
