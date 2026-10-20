import { createClientFromRequest } from "../_lib/base44-compat.js";
async function handle(req) {
  const base44Client = createClientFromRequest(req);
  try {
    const user2 = await base44Client.auth.me();
    if (!user2) return Response.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await base44Client.auth.me();
  const { strategy_id, business_id, custom_context } = await req.json();
  if (!strategy_id && !business_id) {
    return Response.json({ error: "Choose a business or strategy first" }, { status: 400 });
  }
  let strategy = null;
  if (strategy_id) {
    strategy = await base44Client.entities.Strategy.get(strategy_id).catch(() => null);
    if (!strategy) return Response.json({ error: "Strategy not found" }, { status: 404 });
    if (strategy.created_by !== user.email) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  const base44 = base44Client.asServiceRole;
  const resolvedBusinessId = business_id || strategy?.business_id;
  const business = resolvedBusinessId ? await base44Client.entities.Business.get(resolvedBusinessId).catch(() => null) : null;
  if (business_id && !business) {
    return Response.json({ error: "Business not found" }, { status: 404 });
  }
  if (business && business.created_by !== user.email) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!strategy && business) {
    const latest = await base44Client.entities.Strategy.filter({ business_id: business.id, created_by: user.email }, "-created_date", 1).catch(() => []);
    strategy = latest?.[0] || null;
  }
  const launchSnapshot = business?.launch_system_snapshot?.result || null;
  const strategyData = strategy || launchSnapshot || {};
  const strategyText = JSON.stringify(strategyData, null, 2).slice(0, 2e4);
  strategy = strategy || {};
  const prompt = `
You are a world-class customer acquisition strategist focused on measurable, ethical growth.

Your sole mission: design the most aggressive, conversion-optimized customer acquisition funnel possible for this business. Every stage must be specific, measurable, and engineered to maximize lead flow and front-end revenue.

---
STRATEGY CONTEXT:
${launchSnapshot && !strategy.id ? `SAVED LAUNCH SYSTEM (from Idea Intake):
${strategyText}
` : ""}
${business ? `
BUSINESS PROFILE:
- Name: ${business.business_name}
- Industry: ${business.industry || "N/A"}
- Target Avatar: ${business.target_avatar}
- Core Service: ${business.core_service}
- Pricing Model: ${business.pricing_model || "N/A"}
- Current Revenue: $${business.current_revenue || 0}/mo
- Desired Revenue: $${business.desired_revenue || 0}/mo
- Unique Advantage: ${business.unique_advantage || "N/A"}
- Dream Outcome for Customer: ${business.dream_outcome || "N/A"}
` : ""}

EXISTING STRATEGY DATA:
- Lead Magnet: ${strategy.funnel_map?.lead_magnet || "Not defined"}
- Nurture Sequence: ${JSON.stringify(strategy.funnel_map?.nurture_sequence || [])}
- Close Mechanism: ${strategy.funnel_map?.close_mechanism || "Not defined"}
- Core Offer: ${JSON.stringify(strategy.offer_stack?.core_offer || strategy.offer_stack?.mid_ticket || strategy.offer_stack?.low_ticket || {})}
- Upsells: ${JSON.stringify(strategy.offer_stack?.upsells || [])}
- Pricing Anchor: $${strategy.pricing_strategy?.anchor_price || 0}
- Actual Price: $${strategy.pricing_strategy?.actual_price || 0}
- Urgency Mechanism: ${strategy.pricing_strategy?.urgency_mechanism || "None"}
${custom_context ? `
ADDITIONAL CONTEXT: ${custom_context}` : ""}
---

BUILD A COMPLETE CUSTOMER ACQUISITION FUNNEL MAP:

Design the entire funnel from cold traffic to closed client. Be brutally specific \u2014 name the exact tools, platforms, scripts, and metrics for every stage.

Include:
1. TRAFFIC SOURCES: Top 3\u20135 channels with exact strategy per channel
2. AWARENESS STAGE: Hook strategy, content angles, ad creative direction
3. LEAD MAGNET: Exact freebie offer with landing page headline and conversion target
4. LEAD CAPTURE: Opt-in page structure, form fields, confirmation sequence
5. NURTURE SEQUENCE: Day-by-day email/SMS sequence (7 days minimum)
6. CONVERSION EVENT: Webinar / VSL / Call / DM \u2014 the exact mechanism with script outline
7. SALES PAGE / CLOSE: Structure, objection handling, guarantee framing
8. UPSELL PATH: Immediate post-purchase upsell sequence
9. RE-ENGAGEMENT: Follow-up for non-buyers (30/60/90 day sequences)
10. RETENTION & REFERRAL: Keep clients and turn them into lead sources

For each stage provide conversion benchmarks, the #1 lever to optimize, and exact copy/script examples.
`;
  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "claude_sonnet_4_6",
    response_json_schema: {
      type: "object",
      properties: {
        funnel_name: { type: "string" },
        funnel_type: { type: "string", description: "e.g. Webinar Funnel, VSL Funnel, DM Funnel, Application Funnel" },
        estimated_monthly_leads: { type: "number" },
        estimated_conversion_rate: { type: "number", description: "Overall funnel conversion % cold-to-client" },
        funnel_summary: { type: "string", description: "One punchy paragraph describing the whole funnel strategy" },
        traffic_sources: {
          type: "array",
          items: {
            type: "object",
            properties: {
              channel: { type: "string" },
              strategy: { type: "string", description: "Exact approach for this channel" },
              daily_action: { type: "string" },
              estimated_leads_per_week: { type: "number" },
              cost_per_lead: { type: "string" },
              priority: { type: "string", enum: ["primary", "secondary", "testing"] }
            }
          }
        },
        funnel_stages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stage_number: { type: "number" },
              stage_name: { type: "string" },
              stage_type: { type: "string", description: "e.g. Awareness, Lead Capture, Nurture, Conversion, Close, Upsell, Retention" },
              objective: { type: "string" },
              tools_recommended: { type: "array", items: { type: "string" } },
              conversion_benchmark: { type: "string", description: "e.g. 40% opt-in rate" },
              key_lever: { type: "string", description: "The #1 thing to optimize at this stage" },
              copy_example: { type: "string", description: "Exact headline, subject line, hook, or script snippet" },
              actions: { type: "array", items: { type: "string" } },
              time_in_stage: { type: "string", description: "How long a lead spends here, e.g. Instant, 7 days" }
            }
          }
        },
        email_sequence: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "number" },
              subject_line: { type: "string" },
              email_type: { type: "string", description: "e.g. Welcome, Value, Story, Pitch, Urgency, Re-engage" },
              opening_line: { type: "string" },
              core_message: { type: "string" },
              cta: { type: "string" }
            }
          }
        },
        kpis: {
          type: "array",
          items: {
            type: "object",
            properties: {
              metric: { type: "string" },
              target: { type: "string" },
              how_to_measure: { type: "string" }
            }
          }
        },
        bottlenecks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stage: { type: "string" },
              risk: { type: "string" },
              fix: { type: "string" }
            }
          }
        },
        quick_wins: {
          type: "array",
          items: { type: "string", description: "Immediate actions to get leads flowing within 48 hours" }
        },
        funnel_verdict: { type: "string", description: "Brutal honest assessment of the biggest opportunity and threat in this funnel" }
      }
    }
  });
  return Response.json({ funnel: result });
}
async function main(req) {
  try {
    return await handle(req);
  } catch (error) {
    console.error("funnelAcquisitionAgent error", error);
    const message = String(error?.message || "");
    if (error?.status === 404 || /not found/i.test(message)) {
      return Response.json({ error: "That business profile could not be found. Refresh the page and pick it again." }, { status: 404 });
    }
    if (error?.status === 403) {
      return Response.json({ error: "That business profile belongs to another account." }, { status: 403 });
    }
    if (error?.status === 429 || /credit|quota|limit|rate/i.test(message)) {
      return Response.json({ error: "AI usage limit reached. Check your AI credits and try again in a few minutes." }, { status: 429 });
    }
    return Response.json({ error: "The AI could not finish this request. Please try again." }, { status: 500 });
  }
}
export {
  main as default
};
