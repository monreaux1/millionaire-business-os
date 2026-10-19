// Base44-compatible record API on top of Supabase.
// Shared by the browser (user session, Row Level Security) and the server
// (service role). Each entity is a table with standard columns + a JSON "data"
// column; records are returned flat, exactly like Base44 returned them.

export const ENTITY_TABLES = {
  Business: "business",
  Strategy: "strategy",
  MoneyModel: "money_model",
  BrandProfile: "brand_profile",
  AssetProject: "asset_project",
  FunnelProject: "funnel_project",
  CommerceSettings: "commerce_settings",
  FunnelLead: "funnel_lead",
  GhlConnection: "ghl_connection",
  Subscription: "subscription",
};

const BUILTIN = ["id", "created_by", "created_by_id", "created_date", "updated_date"];
const isBuiltin = (key) => BUILTIN.includes(key);

export class EntityError extends Error {
  constructor(message, status = 500, data = undefined) {
    super(message);
    this.status = status;
    this.data = data ?? { error: message };
  }
}

const fail = (error, fallback = "Database request failed") => {
  const status = error?.code === "PGRST116" ? 404 : Number(error?.status) || 500;
  throw new EntityError(error?.message || fallback, status);
};

export const flatten = (row) =>
  row
    ? {
        ...(row.data || {}),
        id: row.id,
        created_by: row.created_by,
        created_by_id: row.created_by_id,
        created_date: row.created_date,
        updated_date: row.updated_date,
      }
    : null;

const stripBuiltins = (obj = {}) =>
  Object.fromEntries(Object.entries(obj).filter(([key]) => !isBuiltin(key)));

// "-updated_date" → order by updated_date desc; "name" → order by data->>name asc.
function applySort(query, sort) {
  if (!sort || typeof sort !== "string") return query.order("created_date", { ascending: false });
  const descending = sort.startsWith("-");
  const field = sort.replace(/^[-+]/, "");
  if (!/^[A-Za-z0-9_]+$/.test(field)) return query.order("created_date", { ascending: false });
  const column = isBuiltin(field) ? field : `data->>${field}`;
  return query.order(column, { ascending: !descending, nullsFirst: false });
}

function applyFilter(query, filter = {}) {
  for (const [key, value] of Object.entries(filter || {})) {
    if (value === undefined) continue;
    if (!/^[A-Za-z0-9_]+$/.test(key)) throw new EntityError(`Invalid filter field: ${key}`, 400);
    const column = isBuiltin(key) ? key : `data->>${key}`;
    if (value === null) query = query.is(column, null);
    else if (Array.isArray(value)) query = query.in(column, value.map(String));
    else query = query.eq(column, String(value));
  }
  return query;
}

function makeEntity(supabase, table, { owner } = {}) {
  const base = () => supabase.from(table);

  return {
    async list(sort, limit) {
      let query = applySort(base().select("*"), sort);
      if (limit) query = query.limit(Number(limit));
      const { data, error } = await query;
      if (error) fail(error);
      return (data || []).map(flatten);
    },

    async filter(filter, sort, limit) {
      let query = applyFilter(base().select("*"), filter);
      query = applySort(query, sort);
      if (limit) query = query.limit(Number(limit));
      const { data, error } = await query;
      if (error) fail(error);
      return (data || []).map(flatten);
    },

    async get(id) {
      if (!id) throw new EntityError("Record not found", 404);
      const { data, error } = await base().select("*").eq("id", id).maybeSingle();
      if (error) fail(error);
      if (!data) throw new EntityError("Record not found", 404);
      return flatten(data);
    },

    // `as` lets server code create a record on behalf of a specific user.
    async create(record, { as } = {}) {
      const ownerInfo = as || owner;
      const row = { data: stripBuiltins(record) };
      if (ownerInfo?.id) row.created_by_id = ownerInfo.id;
      if (ownerInfo?.email) row.created_by = ownerInfo.email;
      const { data, error } = await base().insert(row).select("*").single();
      if (error) fail(error);
      return flatten(data);
    },

    async bulkCreate(records = [], options) {
      const out = [];
      for (const record of records) out.push(await this.create(record, options));
      return out;
    },

    // Base44 semantics: update merges the given fields into the record.
    async update(id, patch) {
      const { data: current, error: readError } = await base().select("data").eq("id", id).maybeSingle();
      if (readError) fail(readError);
      if (!current) throw new EntityError("Record not found", 404);
      const merged = { ...(current.data || {}), ...stripBuiltins(patch) };
      const { data, error } = await base().update({ data: merged }).eq("id", id).select("*").single();
      if (error) fail(error);
      return flatten(data);
    },

    async delete(id) {
      const { error } = await base().delete().eq("id", id);
      if (error) fail(error);
      return { success: true };
    },
  };
}

export function createEntityStore(supabase, options = {}) {
  const store = {};
  for (const [name, table] of Object.entries(ENTITY_TABLES)) {
    store[name] = makeEntity(supabase, table, options);
  }
  return store;
}
