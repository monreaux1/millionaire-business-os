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
You are an elite pricing strategist and market positioning expert combining practical offer design with rigorous business analysis.

Your job: perform a brutal, data-driven market positioning analysis and define the most AGGRESSIVE and PROFITABLE pricing architecture for this business.

---
STRATEGY DATA:
${strategyText}

${business ? `BUSINESS PROFILE:
- Name: ${business.business_name}
- Industry: ${business.industry || "N/A"}
- Target Avatar: ${business.target_avatar}
- Core Service: ${business.core_service}
- Current Revenue: $${business.current_revenue || 0}/mo
- Desired Revenue: $${business.desired_revenue || 0}/mo
- Unique Advantage: ${business.unique_advantage || "N/A"}
- Dream Outcome: ${business.dream_outcome || "N/A"}
- Time to Result: ${business.time_delay_to_result || "N/A"}
- Effort Reduced: ${business.effort_and_sacrifice_reduced || "N/A"}` : ""}
${custom_context ? `
ADDITIONAL CONTEXT: ${custom_context}` : ""}
---

ANALYSIS FRAMEWORK \u2014 execute all of the following:

1. MARKET POSITIONING TIER: Identify where they sit (commodity, competitive, premium, ultra-premium) and where they SHOULD sit to dominate.

2. COMPETITOR PRICING LANDSCAPE: Based on the industry and niche, map out what the low, mid, and high-end competitors typically charge. Be specific with ranges.

3. AGGRESSIVE PRICING ARCHITECTURE: Define 3 tiers:
   - Entry (volume play)
   - Core (profit sweet spot)
   - Premium (prestige positioning)
   Each tier must have a specific price, what's included, who it's for, and why the price is justified.

4. PRICE ANCHORING STRATEGY: Define the anchor price (the "insane" comparison value) and how to use it to make the actual price feel like a steal.

5. PSYCHOLOGICAL PRICING LEVERS: List specific psychological tactics to make prospects feel the price is a bargain (not just "it's worth more" \u2014 specific mechanics).

6. REVENUE PROJECTION: At each pricing tier, project monthly revenue at different conversion rates (conservative, realistic, aggressive).

7. POSITIONING STATEMENT: Write a market-dominating positioning statement that justifies the premium price without explanation or apology.

8. RED FLAGS: List any signals in the current strategy that are LEAVING MONEY ON THE TABLE. Be brutal.

Return as structured JSON.
`;
  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "claude_sonnet_4_6",
    response_json_schema: {
      type: "object",
      properties: {
        current_positioning_tier: { type: "string" },
        recommended_positioning_tier: { type: "string" },
        positioning_gap_analysis: { type: "string", description: "Why current positioning is suboptimal" },
        competitor_landscape: {
          type: "object",
          properties: {
            low_end: { type: "object", properties: { price_range: { type: "string" }, who_plays_here: { type: "string" }, weakness: { type: "string" } } },
            mid_market: { type: "object", properties: { price_range: { type: "string" }, who_plays_here: { type: "string" }, weakness: { type: "string" } } },
            premium: { type: "object", properties: { price_range: { type: "string" }, who_plays_here: { type: "string" }, how_to_win: { type: "string" } } }
          }
        },
        pricing_tiers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tier_name: { type: "string" },
              price: { type: "number" },
              billing_model: { type: "string", description: "e.g. one-time, monthly, annual" },
              who_its_for: { type: "string" },
              whats_included: { type: "array", items: { type: "string" } },
              price_justification: { type: "string" },
              profit_margin_estimate: { type: "string" },
              is_recommended: { type: "boolean" }
            }
          }
        },
        anchor_price: {
          type: "object",
          properties: {
            anchor_value: { type: "number" },
            anchor_rationale: { type: "string" },
            how_to_present_it: { type: "string" }
          }
        },
        psychological_pricing_levers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tactic: { type: "string" },
              how_to_apply: { type: "string" },
              expected_impact: { type: "string" }
            }
          }
        },
        revenue_projections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tier_name: { type: "string" },
              price: { type: "number" },
              conservative: { type: "object", properties: { clients_per_month: { type: "number" }, monthly_revenue: { type: "number" } } },
              realistic: { type: "object", properties: { clients_per_month: { type: "number" }, monthly_revenue: { type: "number" } } },
              aggressive: { type: "object", properties: { clients_per_month: { type: "number" }, monthly_revenue: { type: "number" } } }
            }
          }
        },
        positioning_statement: { type: "string" },
        money_left_on_table: {
          type: "array",
          items: {
            type: "object",
            properties: {
              issue: { type: "string" },
              fix: { type: "string" },
              estimated_revenue_impact: { type: "string" }
            }
          }
        },
        overall_verdict: { type: "string", description: "Blunt final assessment and #1 pricing action to take immediately" }
      }
    }
  });
  return Response.json({ analysis: result });
}
async function main(req) {
  try {
    return await handle(req);
  } catch (error) {
    console.error("pricingAgent error", error);
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
