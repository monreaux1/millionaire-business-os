import { createClientFromRequest } from "../_lib/base44-compat.js";
const GHL_BASE = "https://services.leadconnectorhq.com";
const validLocationId = (value) => /^[A-Za-z0-9_-]{8,64}$/.test(String(value || ""));
const cleanKey = (value) => String(value || "").trim();
const json = (body, status = 200) => Response.json(body, { status });
function makeGhl(apiKey) {
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Version": "2021-07-28"
  };
  return async function ghl(method, path, body) {
    const res = await fetch(`${GHL_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : void 0
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
      const error = new Error(message || `GHL error ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return data;
  };
}
const friendlyGhlError = (error) => {
  if (error?.status === 401 || error?.status === 403) {
    return "GoHighLevel rejected this key for that Location ID. Check that the Private Integration token belongs to this sub-account and has the tags, opportunities and email-template scopes.";
  }
  return error?.message || "Could not reach GoHighLevel. Please try again.";
};
async function getConnection(base44, user) {
  const rows = await base44.entities.GhlConnection.filter({ created_by: user.email }, "-updated_date", 1);
  return rows?.[0] || null;
}
async function main(req) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let base44;
  let user;
  try {
    base44 = createClientFromRequest(req);
    user = await base44.auth.me();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!user?.email) return json({ error: "Unauthorized" }, 401);
  try {
    const body = await req.json().catch(() => ({}));
    const { action, payload = {} } = body;
    if (action === "status") {
      const connection2 = await getConnection(base44, user);
      if (!connection2) return json({ success: true, connected: false });
      return json({
        success: true,
        connected: true,
        locationId: connection2.location_id,
        locationName: connection2.location_label || `Location ${connection2.location_id.slice(0, 6)}\u2026`,
        keyHint: `\u2022\u2022\u2022\u2022${String(connection2.api_key || "").slice(-4)}`
      });
    }
    if (action === "connect") {
      const apiKey2 = cleanKey(body.apiKey);
      const locationId2 = cleanKey(body.locationId);
      if (!apiKey2 || apiKey2.length < 20) return json({ error: "Paste your full GHL Private Integration token." }, 400);
      if (!validLocationId(locationId2)) return json({ error: "That Location ID does not look right. Copy it from GHL \u2192 Settings \u2192 Business Profile." }, 400);
      let tagCount = 0;
      try {
        const data = await makeGhl(apiKey2)("GET", `/locations/${locationId2}/tags`);
        tagCount = data?.tags?.length || 0;
      } catch (error) {
        return json({ error: friendlyGhlError(error) }, 400);
      }
      const locationLabel = `Location ${locationId2.slice(0, 6)}\u2026`;
      const record = {
        location_id: locationId2,
        api_key: apiKey2,
        location_label: locationLabel,
        verified_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const existing = await getConnection(base44, user);
      if (existing) await base44.entities.GhlConnection.update(existing.id, record);
      else await base44.entities.GhlConnection.create(record);
      return json({ success: true, connected: true, locationId: locationId2, locationName: locationLabel, keyHint: `\u2022\u2022\u2022\u2022${apiKey2.slice(-4)}`, tagCount });
    }
    if (action === "disconnect") {
      const existing = await getConnection(base44, user);
      if (existing) await base44.entities.GhlConnection.delete(existing.id);
      return json({ success: true, connected: false });
    }
    let apiKey = "";
    let locationId = "";
    const connection = await getConnection(base44, user);
    if (connection) {
      apiKey = connection.api_key;
      locationId = connection.location_id;
    } else if (user.role === "admin" && process.env.GHL_API_KEY && validLocationId(body.locationId)) {
      apiKey = process.env.GHL_API_KEY;
      locationId = body.locationId;
    } else {
      return json({ error: "Connect your GoHighLevel account first (Deployment Center \u2192 GHL API Credentials)." }, 400);
    }
    const ghl = makeGhl(apiKey);
    if (action === "verify") {
      const data = await ghl("GET", `/locations/${locationId}/tags`);
      return json({ success: true, locationName: `Location ${locationId.slice(0, 6)}\u2026`, tagCount: data?.tags?.length || 0 });
    }
    if (action === "create_tags") {
      const tags = Array.isArray(payload.tags) ? payload.tags.slice(0, 50) : [];
      const results = [];
      for (const tag of tags) {
        try {
          const res = await ghl("POST", `/locations/${locationId}/tags`, { name: String(tag).slice(0, 100) });
          results.push({ tag, id: res.tag?.id || res.id, status: "created" });
        } catch (e) {
          results.push({ tag, status: "exists_or_error", error: e.message });
        }
      }
      return json({ success: true, results });
    }
    if (action === "create_pipeline") {
      const pipelineName = String(payload.pipelineName || "Sales Pipeline").slice(0, 120);
      const stages = Array.isArray(payload.stages) ? payload.stages.slice(0, 20) : [];
      const pipeline = await ghl("POST", `/opportunities/pipelines`, {
        locationId,
        name: pipelineName,
        stages: stages.map((s, i) => ({ name: String(s).slice(0, 80), position: i }))
      });
      return json({ success: true, pipeline });
    }
    if (action === "create_emails") {
      const emails = Array.isArray(payload.emails) ? payload.emails.slice(0, 30) : [];
      const escapeHtml = (text) => String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const results = [];
      for (const email of emails) {
        const subject = String(email.subject || "Email").slice(0, 200);
        try {
          const res = await ghl("POST", `/locations/${locationId}/email-templates`, {
            name: subject,
            subject,
            body: `<p>${escapeHtml(email.body).replace(/\n/g, "</p><p>")}</p>`
          });
          results.push({ subject, id: res.id || res.template?.id, status: "created" });
        } catch (e) {
          results.push({ subject, status: "error", error: e.message });
        }
      }
      return json({ success: true, results });
    }
    if (action === "create_workflow_tags") {
      const workflowName = String(payload.workflowName || "").slice(0, 120);
      const triggerTag = String(payload.triggerTag || "opted-in").slice(0, 100);
      let tagId = null;
      try {
        const tagRes = await ghl("POST", `/locations/${locationId}/tags`, { name: triggerTag });
        tagId = tagRes.tag?.id || tagRes.id;
      } catch {
      }
      return json({ success: true, workflowName, triggerTag, tagId, note: "Tag created. Link this tag to your workflow trigger in GHL Automations." });
    }
    if (action === "create_funnel") {
      const funnelName = String(payload.funnelName || "My Funnel").slice(0, 120);
      const funnel = await ghl("POST", `/funnels/funnel`, {
        locationId,
        name: funnelName,
        url: funnelName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      });
      return json({ success: true, funnel });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("ghlDeploy error", error);
    return json({ error: friendlyGhlError(error) }, 500);
  }
}
export {
  main as default
};
