import { createClientFromRequest } from "../_lib/base44-compat.js";
import { sanitizeFunnelCopy } from "../_lib/funnel-sanitize.js";
// Visitor-safe copy: strip designer notes and never send them to the public page.
const publicFunnelData = (data) => {
  const funnel = sanitizeFunnelCopy(structuredClone(data || {}));
  for (const key of ["landing_page", "order_page", "upsell_page", "thank_you_page"]) {
    if (funnel[key]) delete funnel[key].design_notes;
  }
  return funnel;
};
const json = (body, status = 200) => Response.json(body, { status });
const clean = (value, max = 180) => String(value || "").trim().slice(0, max);
const validSlug = (value) => /^[a-z0-9][a-z0-9-]{2,79}$/.test(value);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const safeUrl = (value) => {
  const text = clean(value, 1500);
  if (!text) return "";
  try {
    const parsed = new URL(text);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
};
async function main(req) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const client = createClientFromRequest(req);
    const base44 = client.asServiceRole;
    const body = await req.json();
    const action = clean(body?.action, 20);
    const slug = clean(body?.slug, 80).toLowerCase();
    if (!validSlug(slug)) return json({ error: "Invalid funnel link" }, 400);
    const projects = await base44.entities.FunnelProject.filter(
      { slug, status: "published" },
      "-published_at",
      1
    );
    const project = projects[0];
    if (!project) return json({ error: "This funnel is not available" }, 404);
    const paymentUrl = safeUrl(project.payment_settings?.checkout_url);
    const connections = structuredClone(project.page_connections || {});
    Object.keys(connections).forEach((key) => {
      const connection = connections[key] || {};
      connection.url = safeUrl(connection.url);
      if (connection.action === "fulfillment" && project.payment_settings?.type !== "none") {
        connection.url = "";
      }
      connections[key] = connection;
    });
    const publicProject = {
      id: project.id,
      name: clean(project.name, 160),
      funnel_data: publicFunnelData(project.funnel_data),
      page_connections: connections,
      payment: {
        type: clean(project.payment_settings?.type, 40),
        checkout_url: paymentUrl
      }
    };
    if (action === "get") return json({ project: publicProject });
    if (action === "lead") {
      const lead = body?.lead || {};
      if (clean(lead.website, 200)) return json({ success: true });
      const firstName = clean(lead.first_name, 80);
      const lastName = clean(lead.last_name, 80);
      const email = clean(lead.email, 180).toLowerCase();
      const phone = clean(lead.phone, 60);
      if (!firstName) return json({ error: "Please enter your first name" }, 400);
      if (!validEmail(email)) return json({ error: "Please enter a valid email address" }, 400);
      await base44.entities.FunnelLead.create({
        owner_email: project.created_by,
        business_id: clean(project.business_id, 120),
        funnel_project_id: project.id,
        funnel_name: clean(project.name, 160),
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        source: "published_funnel",
        status: "new",
        submitted_at: (/* @__PURE__ */ new Date()).toISOString(),
        metadata: {
          slug,
          page: clean(body?.page, 40),
          referrer: clean(body?.referrer, 500)
        }
      }, { as: { id: project.created_by_id, email: project.created_by } });
      return json({ success: true, project: publicProject });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("publicFunnel error", error);
    return json({ error: "The funnel could not be loaded. Please try again." }, 500);
  }
}
export {
  main as default
};
