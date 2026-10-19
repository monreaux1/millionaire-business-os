import { createClientFromRequest } from "../_lib/base44-compat.js";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5-5";
const BASE44_MODEL = "claude_sonnet_4_6";
async function generateWithAnthropic(apiKey, prompt, schema) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
      max_tokens: 16e3,
      system: "You are a world-class direct-response funnel designer. Always answer by calling the save_funnel tool with the complete funnel.",
      tools: [{ name: "save_funnel", description: "Save the complete generated funnel.", input_schema: schema }],
      tool_choice: { type: "tool", name: "save_funnel" },
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Anthropic API error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const toolUse = (data.content || []).find((block) => block.type === "tool_use");
  if (!toolUse?.input) throw new Error("Claude did not return a funnel.");
  return toolUse.input;
}
async function generateFunnelJson(base44, prompt, schema) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) return { funnel: await generateWithAnthropic(anthropicKey, prompt, schema), engine: "anthropic" };
  const result = await base44.integrations.Core.InvokeLLM({ prompt, model: BASE44_MODEL, response_json_schema: schema });
  return { funnel: result?.response || result, engine: "base44" };
}
const hasCorePages = (funnel) => Boolean(funnel?.landing_page && funnel?.thank_you_page);
async function handle(req) {
  const base44Client = createClientFromRequest(req);
  try {
    const user = await base44Client.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const {
    business_name,
    industry,
    target_avatar,
    core_service,
    offer,
    offer_price,
    core_promise,
    audience_pain,
    audience_desire,
    visual_mode,
    brand_colors,
    brand_fonts,
    urgency_mechanism,
    cta_action,
    contact_info,
    platform,
    custom_context,
    logo_url,
    subject_photo_url,
    dream_outcome,
    unique_advantage,
    pricing_model,
    current_revenue,
    desired_revenue,
    biggest_challenge,
    offer_ladder,
    generated_funnel_map,
    freebie_strategy,
    funnel_goal,
    asset_title,
    asset_type,
    delivery_url,
    checkout_url,
    booking_url
  } = await req.json();
  if (!business_name || !target_avatar || !offer || !cta_action) {
    return Response.json({ error: "business_name, target_avatar, offer, and cta_action are required" }, { status: 400 });
  }
  const base44 = base44Client.asServiceRole;
  const VISUAL_MODE_DESC = {
    conversion: "BOLD/URGENT \u2014 high-contrast, big bold headlines, scarcity badges, red/orange accents, heavy CTA buttons, urgency-driven layout",
    brand: "BRIGHT/LIFESTYLE \u2014 polished, aspirational imagery, clean whitespace, brand-forward colors, modern sans-serif, lifestyle photography",
    emotional: "ELEGANT/SOFT \u2014 muted palette, serif headlines, generous whitespace, soft gradients, storytelling tone, premium feel"
  };
  const modeDesc = VISUAL_MODE_DESC[visual_mode] || VISUAL_MODE_DESC.conversion;
  const normalizedGoal = ["lead_generation", "paid_product", "booking", "webinar", "application"].includes(funnel_goal) ? funnel_goal : "lead_generation";
  const isPaid = normalizedGoal === "paid_product";
  const ladderCtx = offer_ladder ? `
OFFER LADDER (from Idea Intake \u2014 use these REAL offers for upsell/downsell path):
- Low Ticket: ${offer_ladder.low_ticket?.name || "N/A"} \u2014 ${offer_ladder.low_ticket?.price || ""} \u2014 Guarantee: ${offer_ladder.low_ticket?.guarantee || "N/A"}
- Mid Ticket: ${offer_ladder.mid_ticket?.name || "N/A"} \u2014 ${offer_ladder.mid_ticket?.price || ""} \u2014 Guarantee: ${offer_ladder.mid_ticket?.guarantee || "N/A"}
- High Ticket: ${offer_ladder.high_ticket?.name || "N/A"} \u2014 ${offer_ladder.high_ticket?.price || ""} \u2014 Guarantee: ${offer_ladder.high_ticket?.guarantee || "N/A"}
` : "";
  const freebieCtx = freebie_strategy ? `
LEAD MAGNET ALREADY PLANNED (align the funnel opt-in with this):
- Best pick: ${freebie_strategy.best_pick || "N/A"}
- Reason: ${freebie_strategy.best_pick_reason || "N/A"}
` : "";
  const funnelMapCtx = generated_funnel_map ? `
FUNNEL MAP ALREADY SUGGESTED (use as the structural blueprint):
- Funnel type: ${generated_funnel_map.funnel_type || "N/A"}
- Deployment notes: ${generated_funnel_map.deployment_notes || "N/A"}
` : "";
  const prompt = `
You are a world-class direct-response funnel designer, conversion copywriter, and digital design strategist.

Your mission: build the complete offer sales funnel \u2014 visual/conversion assets AND copy \u2014 for this business. Use the EXACT offer, audience, and details below. Do not invent a different offer.

---
BUSINESS PROFILE:
- Name: ${business_name}
- Industry: ${industry || "N/A"}
- Core Service: ${core_service || "N/A"}
- Pricing Model: ${pricing_model || "N/A"}
- Current Revenue: $${current_revenue || 0}/mo \u2192 Desired: $${desired_revenue || 0}/mo
- Unique Advantage: ${unique_advantage || "N/A"}
- Biggest Challenge: ${biggest_challenge || "N/A"}
${ladderCtx}${freebieCtx}${funnelMapCtx}
THE OFFER:
- What's sold: ${offer}
- Price: ${offer_price || "N/A"}
- Core Promise / Result: ${core_promise || dream_outcome || "N/A"}

AUDIENCE:
- Avatar: ${target_avatar}
- Pain Point: ${audience_pain || "N/A"}
- Desire / Aspiration: ${audience_desire || dream_outcome || "N/A"}

FUNNEL GOAL: ${normalizedGoal}
FUNNEL SCOPE: ${isPaid ? "PAID PRODUCT funnel: landing page \u2192 order page \u2192 optional upsell \u2192 thank-you/delivery page" : "LEAD CAPTURE funnel: landing page with opt-in \u2192 thank-you/access page"}
CONNECTED ASSET: ${asset_title || "None selected"} (${asset_type || "custom offer"})
CHECKOUT: ${checkout_url ? "Seller link provided" : "Connect after generation"}
DELIVERY: ${delivery_url ? "Seller link provided" : "Connect after generation"}
BOOKING: ${booking_url ? "Seller link provided" : "Connect after generation"}

VISUAL MODE: ${visual_mode?.toUpperCase()} \u2014 ${modeDesc}

BRAND ASSETS:
- Colors: ${brand_colors || "Not specified \u2014 choose based on visual mode"}
- Fonts: ${brand_fonts || "Not specified \u2014 choose based on visual mode"}
- Logo: ${logo_url ? "Provided (use in header)" : "None \u2014 use business name as wordmark"}
- Subject Photo: ${subject_photo_url ? "Provided (feature prominently)" : "None"}

URGENCY MECHANISM: ${urgency_mechanism || "None specified"}

CTA: ${cta_action}
CONTACT INFO: ${contact_info || "N/A"}
DEPLOYMENT PLATFORM: ${platform || "Go High Level"}
${custom_context ? `
ADDITIONAL CONTEXT: ${custom_context}` : ""}
---

DESIGN THE FUNNEL ASSETS. For every page/asset provide:
1. Visual direction (layout, color usage, typography, imagery, hero treatment) matching the ${visual_mode?.toUpperCase()} visual mode
2. Exact conversion copy (headline, subhead, bullets, CTA, guarantee, urgency)
3. Section-by-section structure

${isPaid ? `Build ALL pages: Landing Page, Order Page, Upsell Page, Thank-You Page, plus a primary Ad Creative.` : `Build a Landing Page with lead capture and a Thank-You/Access Page. Do not build an order or upsell page. Also create a primary Ad Creative.`}

Be brutally specific \u2014 give exact headlines, exact button text, exact color hex suggestions, and exact layout instructions a designer could hand to a graphic designer or paste into a builder.
`;
  const FUNNEL_SCHEMA = {
    type: "object",
    properties: {
      funnel_name: { type: "string" },
      funnel_type: { type: "string", description: "e.g. Webinar Funnel, VSL Funnel, DM Funnel, Application Funnel" },
      visual_mode: { type: "string", description: "The visual mode applied" },
      estimated_monthly_leads: { type: "number" },
      estimated_conversion_rate: { type: "number" },
      funnel_summary: { type: "string" },
      brand_system: {
        type: "object",
        properties: {
          primary_color: { type: "string", description: "hex" },
          secondary_color: { type: "string", description: "hex" },
          accent_color: { type: "string", description: "hex" },
          headline_font: { type: "string" },
          body_font: { type: "string" },
          imagery_direction: { type: "string" }
        }
      },
      ad_creative: {
        type: "object",
        properties: {
          format: { type: "string", description: "e.g. 1080x1080 square, 1080x1920 story" },
          headline: { type: "string" },
          subhead: { type: "string" },
          visual_direction: { type: "string", description: "Exact layout, imagery, color treatment" },
          cta_text: { type: "string" }
        }
      },
      landing_page: {
        type: "object",
        properties: {
          headline: { type: "string" },
          subhead: { type: "string" },
          hero_visual_direction: { type: "string" },
          pain_points: { type: "array", items: { type: "string" } },
          benefit_bullets: { type: "array", items: { type: "string" } },
          social_proof: { type: "string" },
          offer_stack: { type: "array", items: { type: "string" }, description: "Everything included in the offer" },
          price_anchor: { type: "string" },
          guarantee: { type: "string" },
          urgency_block: { type: "string" },
          cta_text: { type: "string" },
          sections: { type: "array", items: { type: "object", properties: { name: { type: "string" }, copy: { type: "string" }, visual_direction: { type: "string" } } } }
        }
      },
      order_page: {
        type: "object",
        properties: {
          headline: { type: "string" },
          order_summary: { type: "string" },
          price_display: { type: "string" },
          payment_options: { type: "string" },
          guarantee_block: { type: "string" },
          cta_text: { type: "string" }
        }
      },
      upsell_page: {
        type: "object",
        properties: {
          headline: { type: "string" },
          offer: { type: "string" },
          price: { type: "string" },
          reason_why: { type: "string" },
          cta_text: { type: "string" }
        }
      },
      thank_you_page: {
        type: "object",
        properties: {
          headline: { type: "string" },
          next_steps: { type: "array", items: { type: "string" } },
          onboarding_instructions: { type: "string" },
          community_link: { type: "string" }
        }
      },
      traffic_sources: {
        type: "array",
        items: { type: "object", properties: {
          channel: { type: "string" },
          strategy: { type: "string" },
          daily_action: { type: "string" },
          estimated_leads_per_week: { type: "number" },
          cost_per_lead: { type: "string" },
          priority: { type: "string", enum: ["primary", "secondary", "testing"] }
        } }
      },
      email_sequence: {
        type: "array",
        items: { type: "object", properties: {
          day: { type: "number" },
          subject_line: { type: "string" },
          email_type: { type: "string" },
          opening_line: { type: "string" },
          core_message: { type: "string" },
          cta: { type: "string" }
        } }
      },
      kpis: { type: "array", items: { type: "object", properties: { metric: { type: "string" }, target: { type: "string" }, how_to_measure: { type: "string" } } } },
      quick_wins: { type: "array", items: { type: "string" } },
      funnel_verdict: { type: "string" }
    },
    required: ["funnel_name", "landing_page", "thank_you_page"]
  };
  let { funnel, engine } = await generateFunnelJson(base44, prompt, FUNNEL_SCHEMA);
  if (!hasCorePages(funnel)) {
    const retryPrompt = `${prompt}

IMPORTANT: Your previous answer was missing pages. You MUST include landing_page and thank_you_page${isPaid ? ", order_page and upsell_page" : ""} with full copy.`;
    ({ funnel, engine } = await generateFunnelJson(base44, retryPrompt, FUNNEL_SCHEMA));
  }
  if (!hasCorePages(funnel)) {
    return Response.json({ error: "The AI did not return the landing and thank-you pages. Please try again." }, { status: 502 });
  }
  funnel.generated_with = engine;
  funnel.funnel_goal = normalizedGoal;
  funnel.connected_asset = { title: asset_title || "", type: asset_type || "" };
  if (!isPaid) {
    delete funnel.order_page;
    delete funnel.upsell_page;
  }
  return Response.json({ funnel });
}
async function main(req) {
  try {
    return await handle(req);
  } catch (error) {
    console.error("funnelBuilderGenerate error", error);
    const message = String(error?.message || "");
    if (error?.status === 401) {
      return Response.json({ error: "The Anthropic API key is invalid. Update ANTHROPIC_API_KEY in Base44 secrets, or remove it to use Base44 AI." }, { status: 500 });
    }
    if (error?.status === 429 || /credit|quota|limit|rate/i.test(message)) {
      return Response.json({ error: "AI usage limit reached. Check your AI credits and try again in a few minutes." }, { status: 429 });
    }
    return Response.json({ error: "The funnel could not be generated. Please try again." }, { status: 500 });
  }
}
export {
  main as default
};
