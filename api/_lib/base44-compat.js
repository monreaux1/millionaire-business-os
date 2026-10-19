// Lets the app's original Base44 server functions run on Vercel unchanged:
// provides createClientFromRequest() with the same shape Base44's SDK had.
import { getAdmin, getUserClient, bearerToken, adminDb as makeAdminDb, HttpError } from "./server.js";
import { createEntityStore, EntityError } from "../../src/api/entity-store.js";
import { callClaude } from "./claude.js";
import { sendEmail } from "./email.js";

const adminEmails = () =>
  String(process.env.ADMIN_EMAILS || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);

const toAppUser = (raw) => ({
  id: raw.id,
  email: raw.email,
  full_name: raw.user_metadata?.full_name || raw.user_metadata?.name || "",
  role: adminEmails().includes(String(raw.email || "").toLowerCase()) ? "admin" : "user",
  created_date: raw.created_at,
});

const integrations = {
  Core: {
    InvokeLLM: ({ prompt, response_json_schema, system }) =>
      callClaude({ prompt, schema: response_json_schema, system }),
    SendEmail: ({ to, subject, body, from_name }) => sendEmail({ to, subject, text: body, fromName: from_name }),
  },
};

// A server-only table (no browser access), scoped to one user's own rows.
function scopedServerEntity(entity, user) {
  const ownRow = async (id) => {
    const row = await entity.get(id);
    if (row.created_by_id !== user.id) throw new EntityError("Record not found", 404);
    return row;
  };
  return {
    list: (sort, limit) => entity.filter({ created_by_id: user.id }, sort, limit),
    filter: (query, sort, limit) => entity.filter({ ...query, created_by_id: user.id }, sort, limit),
    get: ownRow,
    create: (record) => entity.create(record, { as: user }),
    update: async (id, patch) => { await ownRow(id); return entity.update(id, patch); },
    delete: async (id) => { await ownRow(id); return entity.delete(id); },
  };
}

// Service-role "User" entity (used by the daily briefing).
const adminUserEntity = {
  async list() {
    const users = [];
    for (let page = 1; page <= 50; page += 1) {
      const { data, error } = await getAdmin().auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new HttpError(500, error.message);
      users.push(...(data?.users || []).map(toAppUser));
      if (!data?.users?.length || data.users.length < 1000) break;
    }
    return users;
  },
  async get(id) {
    const { data, error } = await getAdmin().auth.admin.getUserById(id);
    if (error || !data?.user) throw new EntityError("User not found", 404);
    return toAppUser(data.user);
  },
  async delete(id) {
    const { error } = await getAdmin().auth.admin.deleteUser(id);
    if (error) throw new HttpError(500, error.message);
    return { success: true };
  },
};

export function createClientFromRequest(req) {
  const token = bearerToken(req);
  let cachedUser;

  const me = async () => {
    if (cachedUser !== undefined) return cachedUser;
    if (!token) { cachedUser = null; throw new HttpError(401, "Unauthorized"); }
    const { data, error } = await getAdmin().auth.getUser(token);
    if (error || !data?.user) { cachedUser = null; throw new HttpError(401, "Unauthorized"); }
    cachedUser = toAppUser(data.user);
    return cachedUser;
  };

  const adminEntities = { ...makeAdminDb(), User: adminUserEntity };

  // User-scoped entities obey Row Level Security. GhlConnection is server-only,
  // so it's served by the service role but limited to the caller's own rows.
  const userEntities = token ? createEntityStore(getUserClient(token)) : {};
  const entities = new Proxy(userEntities, {
    get(target, name) {
      if (name === "GhlConnection") {
        return {
          ...Object.fromEntries(["list", "filter", "get", "create", "update", "delete"].map((method) => [
            method,
            async (...args) => {
              const user = await me();
              return scopedServerEntity(adminEntities.GhlConnection, user)[method](...args);
            },
          ])),
        };
      }
      if (!token) throw new HttpError(401, "Unauthorized");
      return target[name];
    },
  });

  return {
    auth: { me },
    entities,
    integrations,
    asServiceRole: { entities: adminEntities, integrations },
  };
}

// Converts a Node/Vercel request into a Web Request so the original
// `Deno.serve(async (req) => …)` handlers can read headers and `await req.json()`.
export function toWebRequest(req, bodyObject) {
  const url = `https://${req.headers?.host || "localhost"}${req.url || "/"}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (typeof value === "string") headers.set(key, value);
  }
  return new Request(url, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : JSON.stringify(bodyObject ?? {}),
  });
}
