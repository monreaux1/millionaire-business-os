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
  const { business_id, timeline_days, custom_context } = await req.json();
  if (!business_id) return Response.json({ error: "business_id is required" }, { status: 400 });
  const business = await base44Client.entities.Business.get(business_id);
  if (!business) return Response.json({ error: "Business not found" }, { status: 404 });
  if (business.created_by !== user.email) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const base44 = base44Client.asServiceRole;
  const days = timeline_days || 30;
  const prompt = `
You are an elite launch strategist focused on clear messaging, decisive execution, and measurable results.

Your job: build a COMPLETE, step-by-step launch sequence to scale this business to maximum revenue as fast as possible in ${days} days. Every single step must be specific, executable, and designed to generate cash.

---
BUSINESS PROFILE:
- Name: ${business.business_name}
- Industry: ${business.industry || "N/A"}
- Target Avatar: ${business.target_avatar}
- Core Service: ${business.core_service}
- Pricing Model: ${business.pricing_model || "N/A"}
- Current Revenue: $${business.current_revenue || 0}/mo
- Desired Revenue: $${business.desired_revenue || 0}/mo
- Biggest Challenge: ${business.biggest_challenge || "N/A"}
- Unique Advantage: ${business.unique_advantage || "N/A"}
- Dream Outcome: ${business.dream_outcome || "N/A"}
- Timeline: ${business.timeline || days + " days"}
- Launch Purpose: ${business.launch_purpose || "N/A"}
${custom_context ? `
ADDITIONAL CONTEXT: ${custom_context}` : ""}
---

BUILD THE FULL LAUNCH SEQUENCE:

1. PRE-LAUNCH PHASE (Days 1\u20137): Foundation, audience priming, asset creation
2. SOFT LAUNCH PHASE (Days 8\u201314): First sales, proof gathering, offer testing
3. SCALE PHASE (Days 15\u2013${Math.round(days * 0.7)}): Amplification, paid traffic, referrals
4. DOMINATION PHASE (Days ${Math.round(days * 0.7) + 1}\u2013${days}): Full throttle, systems, delegation

For each phase provide:
- Daily specific actions (not vague \u2014 real tasks with exact steps)
- Revenue targets per phase
- Key metrics to track
- Bottlenecks to watch for

Also provide:
- The single #1 fastest path to first $10k from this business
- Top 3 channels to dominate (specific, not generic)
- The exact sequence of offers (lead magnet \u2192 tripwire \u2192 core \u2192 upsell)
- A content calendar with actual post hooks for the first 7 days
- The weekly non-negotiables (the 5 things they must do every week no matter what)

Be SPECIFIC. No fluff. No "post valuable content." Give them exact actions like "DM 20 people using this exact script: [script]"
`;
  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "claude_sonnet_4_6",
    response_json_schema: {
      type: "object",
      properties: {
        launch_title: { type: "string", description: "Punchy name for this launch sequence" },
        revenue_target: { type: "number", description: "Realistic revenue target for the full period" },
        fastest_path_to_10k: { type: "string", description: "Single most direct path to first $10k \u2014 be specific" },
        top_channels: {
          type: "array",
          items: {
            type: "object",
            properties: {
              channel: { type: "string" },
              why: { type: "string" },
              daily_action: { type: "string", description: "Exact daily action to take on this channel" }
            }
          }
        },
        offer_sequence: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stage: { type: "string", description: "e.g. Lead Magnet, Tripwire, Core Offer, Upsell" },
              offer_name: { type: "string" },
              price: { type: "number" },
              conversion_goal: { type: "string" },
              description: { type: "string" }
            }
          }
        },
        phases: {
          type: "array",
          items: {
            type: "object",
            properties: {
              phase_name: { type: "string" },
              phase_number: { type: "number" },
              day_start: { type: "number" },
              day_end: { type: "number" },
              objective: { type: "string" },
              revenue_target: { type: "number" },
              daily_steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day_range: { type: "string", description: "e.g. Day 1-2 or Day 3" },
                    task: { type: "string" },
                    how_to: { type: "string", description: "Exact execution steps \u2014 no vague advice" },
                    time_required: { type: "string", description: "e.g. 2 hours" },
                    expected_output: { type: "string" }
                  }
                }
              },
              key_metrics: { type: "array", items: { type: "string" } },
              bottlenecks: { type: "array", items: { type: "string" } },
              phase_win: { type: "string", description: "The one result that means this phase succeeded" }
            }
          }
        },
        content_calendar: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "number" },
              platform: { type: "string" },
              hook: { type: "string", description: "Exact opening line of the post" },
              content_angle: { type: "string" },
              cta: { type: "string" }
            }
          }
        },
        weekly_non_negotiables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string" },
              why: { type: "string" },
              time_block: { type: "string" }
            }
          }
        },
        success_metrics: {
          type: "object",
          properties: {
            week_1: { type: "string" },
            week_2: { type: "string" },
            week_3: { type: "string" },
            week_4: { type: "string" }
          }
        },
        kill_switches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              warning_sign: { type: "string" },
              immediate_action: { type: "string" }
            }
          }
        },
        battle_cry: { type: "string", description: "One brutal, motivating sentence to keep them executing" }
      }
    }
  });
  return Response.json({ sequence: result });
}
async function main(req) {
  try {
    return await handle(req);
  } catch (error) {
    console.error("launchSequenceAgent error", error);
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
