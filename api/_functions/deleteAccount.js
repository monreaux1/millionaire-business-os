import { createClientFromRequest } from "../_lib/base44-compat.js";
const OWNED_ENTITIES = [
  "Business",
  "Strategy",
  "MoneyModel",
  "BrandProfile",
  "AssetProject",
  "FunnelProject",
  "CommerceSettings",
  "GhlConnection"
];
async function deleteAllMatching(entity, query) {
  let deleted = 0;
  for (let round = 0; round < 50; round += 1) {
    const rows = await entity.filter(query, "-created_date", 100);
    if (!rows?.length) break;
    for (const row of rows) {
      await entity.delete(row.id);
      deleted += 1;
    }
    if (rows.length < 100) break;
  }
  return deleted;
}
async function main(req) {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  let base44;
  let user;
  try {
    base44 = createClientFromRequest(req);
    user = await base44.auth.me();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user?.id || !user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const summary = {};
    for (const name of OWNED_ENTITIES) {
      try {
        summary[name] = await deleteAllMatching(base44.entities[name], { created_by: user.email });
      } catch (e) {
        summary[name] = `error: ${e.message}`;
      }
    }
    try {
      summary.FunnelLead = await deleteAllMatching(base44.entities.FunnelLead, { owner_email: user.email });
    } catch (e) {
      summary.FunnelLead = `error: ${e.message}`;
    }
    await base44.asServiceRole.entities.User.delete(user.id);
    let accountDeleted = false;
    try {
      const stillThere = await base44.asServiceRole.entities.User.get(user.id);
      accountDeleted = !stillThere;
    } catch {
      accountDeleted = true;
    }
    if (!accountDeleted) {
      return Response.json({ error: "User record could not be deleted", summary }, { status: 500 });
    }
    return Response.json({ success: true, accountDeleted: true, summary });
  } catch (error) {
    console.error("deleteAccount error", error);
    return Response.json({ error: error.message || "Account deletion failed" }, { status: 500 });
  }
}
export {
  main as default
};
