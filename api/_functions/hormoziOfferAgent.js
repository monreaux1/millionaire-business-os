import { createClientFromRequest } from "../_lib/base44-compat.js";
async function handle(req) {
  const base44Client = createClientFromRequest(req);
  try {
    const user2 = await base44Client.auth.me();
    if (!user2) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await base44Client.auth.me();
  const { business_id, custom_context } = await req.json();
  if (!business_id) {
    return Response.json({ error: "business_id is required" }, { status: 400 });
  }
  const business = await base44Client.entities.Business.get(business_id);
  if (!business) {
    return Response.json({ error: "Business not found" }, { status: 404 });
  }
  if (business.created_by !== user.email) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const base44 = base44Client.asServiceRole;
  const prompt = `
You are an elite offer architect. Your job is to craft an irresistible, ethical, high-conversion offer for this business using the VALUE EQUATION:

VALUE = (Dream Outcome \xD7 Perceived Likelihood of Achievement) / (Time Delay \xD7 Effort & Sacrifice)

To maximize value:
- MAXIMIZE: Dream Outcome + Perceived Likelihood
- MINIMIZE: Time Delay + Effort & Sacrifice

---
BUSINESS PROFILE:
- Business Name: ${business.business_name}
- Industry: ${business.industry || "Not specified"}
- Target Avatar: ${business.target_avatar}
- Core Service: ${business.core_service}
- Pricing Model: ${business.pricing_model || "Not specified"}
- Current Revenue: $${business.current_revenue || 0}/mo
- Desired Revenue: $${business.desired_revenue || 0}/mo
- Biggest Challenge: ${business.biggest_challenge || "Not specified"}
- Unique Advantage: ${business.unique_advantage || "Not specified"}
- Dream Outcome: ${business.dream_outcome || "Not specified"}
- Likelihood Proof: ${business.likelihood_of_achievement_proof || "Not specified"}
- Time to Result: ${business.time_delay_to_result || "Not specified"}
- Effort Reduced: ${business.effort_and_sacrifice_reduced || "Not specified"}
${custom_context ? `
Additional Context: ${custom_context}` : ""}
---

Apply proven offer-crafting principles and return a structured offer in JSON.

Rules:
- The grand slam offer must be so good that people feel stupid saying no
- Stack bonuses that each remove a specific objection
- Use a guarantee that reverses all risk
- Name it with a proprietary framework or result-driven title
- Pricing must justify value 10x-100x the price
`;
  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "claude_sonnet_4_6",
    response_json_schema: {
      type: "object",
      properties: {
        offer_name: { type: "string", description: "Proprietary, result-driven offer name" },
        one_liner: { type: "string", description: "One sentence that sells the offer" },
        dream_outcome: { type: "string", description: "The specific transformation the customer achieves" },
        likelihood_boosters: {
          type: "array",
          items: { type: "string" },
          description: "Proof elements that make success feel inevitable"
        },
        time_collapse: { type: "string", description: "How fast they get results and what accelerates it" },
        effort_eliminators: {
          type: "array",
          items: { type: "string" },
          description: "Things the customer does NOT have to do because of you"
        },
        core_deliverables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              perceived_value: { type: "number" }
            }
          }
        },
        bonuses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              objection_it_kills: { type: "string" },
              perceived_value: { type: "number" }
            }
          }
        },
        total_stack_value: { type: "number", description: "Total perceived value of everything included" },
        recommended_price: { type: "number", description: "Actual price to charge" },
        value_ratio: { type: "string", description: "e.g. $47,000 in value for $5,000" },
        guarantee: {
          type: "object",
          properties: {
            type: { type: "string", description: "e.g. money-back, performance, anti-guarantee" },
            description: { type: "string" },
            duration: { type: "string" }
          }
        },
        urgency_scarcity: { type: "string", description: "Real urgency/scarcity mechanism" },
        headline: { type: "string", description: "Direct response headline for the offer page" },
        sub_headline: { type: "string" },
        value_equation_score: {
          type: "object",
          properties: {
            dream_outcome_score: { type: "number", description: "1-10" },
            likelihood_score: { type: "number", description: "1-10" },
            time_delay_score: { type: "number", description: "1-10 (10 = fastest)" },
            effort_score: { type: "number", description: "1-10 (10 = least effort)" },
            overall_value_score: { type: "number", description: "1-100" }
          }
        },
        objection_crushers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              objection: { type: "string" },
              reframe: { type: "string" }
            }
          }
        },
        hormozi_verdict: { type: "string", description: "Direct strategic assessment and improvement tips" }
      }
    }
  });
  return Response.json({ offer: result });
}
async function main(req) {
  try {
    return await handle(req);
  } catch (error) {
    console.error("hormoziOfferAgent error", error);
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
