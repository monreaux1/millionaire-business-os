import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Zap, Loader2, Palette, ArrowRight, RotateCcw, Download, Gift, ShoppingBag, BriefcaseBusiness, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import FreebieOutput from "@/components/clientmagnet/FreebieOutput";
import BrandingPanel from "@/components/clientmagnet/BrandingPanel";
import { generateFreebiePDF } from "@/components/clientmagnet/generateFreebiePDF";
import { getBrandProfileForBusiness } from "@/lib/brand-profile";
import { accountStorage } from "@/lib/account-storage";

const ASSET_PURPOSES = [
  { id: "lead_magnet", label: "Free Lead Magnet", desc: "Capture leads and move them toward an offer", icon: Gift },
  { id: "paid_product", label: "Paid Digital Product", desc: "Create a valuable product customers purchase", icon: ShoppingBag },
  { id: "client_delivery", label: "Client Delivery Asset", desc: "Build a polished resource for existing clients", icon: BriefcaseBusiness },
];

const FREEBIE_TYPES = [
  { id: "ai",           label: "🤖 AI Decides",    desc: "Best converting option for your offer" },
  { id: "ebook",        label: "📘 Ebook / Guide",  desc: "Full chapters + action steps" },
  { id: "checklist",    label: "✅ Checklist",       desc: "Quick win, high conversion" },
  { id: "prompt_pack",  label: "💡 Prompt Pack",    desc: "30–50 prompts, categorized" },
  { id: "templates",    label: "📄 Template Pack",  desc: "Scripts, DMs, emails, copy" },
  { id: "workbook",     label: "📓 Workbook",       desc: "Exercises + fill-in prompts" },
  { id: "mini_training",label: "🎓 Mini Training",  desc: "Lesson breakdown + scripts" },
];

const TYPE_PROMPTS = {
  ebook: `Generate a complete, fully written lead magnet ebook. NOT an outline — full content.

Structure required:
- title: outcome-driven, specific, compelling
- subtitle: one-line supporting statement
- intro: 3-paragraph hook explaining the transformation the reader will get
- toc: array of 5 section titles (table of contents)
- sections: 5 sections, each with:
    heading, body (2-3 paragraphs of real written content explaining the concept), 
    steps (array of 2-3 actionable steps as strings), example (real-world example)
- final_section: recap paragraph + how the main offer is the next step
- cta: strong call-to-action encouraging the reader to take action and move into the offer`,

  checklist: `Generate a complete, ready-to-use checklist lead magnet. NOT an outline — full content.

Structure required:
- title: outcome-driven checklist title
- subtitle: one-line description
- intro: 1 paragraph explaining what this checklist does and how to use it
- categories: array of 3 categories, each with:
    name (category heading), items (array of 8-12 specific, actionable checklist items as strings)
- quick_wins: array of 3 "quick win" tips the user can implement today
- cta: call-to-action pointing to the main offer`,

  prompt_pack: `Generate a complete prompt pack lead magnet with 40+ prompts. NOT an outline — real, usable prompts.

Structure required:
- title: "X Prompts to [Desired Result]" format
- subtitle: one-line description
- intro: 2 paragraphs explaining how to use these prompts for best results
- categories: array of 3 categories:
    1. Content Creation Prompts (12-15 prompts)
    2. Sales & Outreach Prompts (12-15 prompts)
    3. Funnel & Offer Prompts (10-12 prompts)
  Each category: name, description (1 sentence), prompts (array of fully written prompt strings — each prompt should be copy-paste ready)
- usage_tips: array of 5 tips for using prompts effectively
- cta: call-to-action pointing to the main offer`,

  templates: `Generate a complete template pack lead magnet. NOT placeholders — real, copy-paste-ready scripts.

Structure required:
- title: compelling template pack title
- subtitle: one-line description
- intro: 2 paragraphs explaining how to use these templates
- sections: array of 5 template sections:
    1. DM Scripts (3 full outreach DM scripts for different situations)
    2. Email Templates (3 full email scripts: cold, follow-up, closing)
    3. Sales Scripts (2 full sales conversation scripts)
    4. Funnel Headlines (8-10 high-converting headline examples)
    5. CTA Examples (8-10 call-to-action phrases)
  Each section: name, description, items (array of template objects with label and content)
- daily_usage: paragraph on how to use templates daily
- cta: call-to-action pointing to the main offer`,

  workbook: `Generate a complete interactive workbook lead magnet. NOT an outline — real exercises and prompts.

Structure required:
- title: engaging workbook title
- subtitle: one-line description
- intro: 2 paragraphs on what the reader will accomplish in this workbook
- sections: 4 sections:
    1. Clarity (questions + reflection prompts)
    2. Strategy (exercises + fill-in areas)
    3. Execution (action steps + accountability prompts)
    4. Plan (mapping next steps)
  Each section: name, instructions (1 paragraph), exercises (array of 4-6 exercise objects with: prompt, space_hint like "Write 3-5 sentences here")
- reflection_questions: array of 5 powerful reflection questions
- final_message: encouraging closing paragraph
- cta: call-to-action pointing to the main offer`,

  mini_training: `Generate a complete mini training lead magnet with full lesson scripts. NOT bullet points — full talking points.

Structure required:
- title: compelling mini training title
- subtitle: one-line description
- intro: 2 paragraphs setting up what the student will learn and why it matters
- lessons: 3 lessons:
    1. Problem Awareness
    2. Strategy Overview
    3. Quick Win Implementation
  Each lesson: title, objective (1 sentence), script (3-4 paragraphs of full talking points — as if being recorded), example (real-world example), key_takeaway (1 bold sentence)
- bonus_tips: array of 3 bonus implementation tips
- transition: paragraph smoothly transitioning into the main offer
- cta: call-to-action pointing to the main offer`,
};

const TYPE_SCHEMAS = {
  ebook: {
    type: "object",
    properties: {
      title: { type: "string" },
      subtitle: { type: "string" },
      intro: { type: "string" },
      toc: { type: "array", items: { type: "string" } },
      sections: { type: "array", items: { type: "object", properties: {
        heading: { type: "string" }, body: { type: "string" },
        steps: { type: "array", items: { type: "string" } }, example: { type: "string" }
      } } },
      final_section: { type: "string" }, cta: { type: "string" }
    }
  },
  checklist: {
    type: "object",
    properties: {
      title: { type: "string" }, subtitle: { type: "string" }, intro: { type: "string" },
      categories: { type: "array", items: { type: "object", properties: {
        name: { type: "string" }, items: { type: "array", items: { type: "string" } }
      } } },
      quick_wins: { type: "array", items: { type: "string" } }, cta: { type: "string" }
    }
  },
  prompt_pack: {
    type: "object",
    properties: {
      title: { type: "string" }, subtitle: { type: "string" }, intro: { type: "string" },
      categories: { type: "array", items: { type: "object", properties: {
        name: { type: "string" }, description: { type: "string" }, prompts: { type: "array", items: { type: "string" } }
      } } },
      usage_tips: { type: "array", items: { type: "string" } }, cta: { type: "string" }
    }
  },
  templates: {
    type: "object",
    properties: {
      title: { type: "string" }, subtitle: { type: "string" }, intro: { type: "string" },
      sections: { type: "array", items: { type: "object", properties: {
        name: { type: "string" }, description: { type: "string" },
        items: { type: "array", items: { type: "object", properties: {
          label: { type: "string" }, content: { type: "string" }
        } } }
      } } },
      daily_usage: { type: "string" }, cta: { type: "string" }
    }
  },
  workbook: {
    type: "object",
    properties: {
      title: { type: "string" }, subtitle: { type: "string" }, intro: { type: "string" },
      sections: { type: "array", items: { type: "object", properties: {
        name: { type: "string" }, instructions: { type: "string" },
        exercises: { type: "array", items: { type: "object", properties: {
          prompt: { type: "string" }, space_hint: { type: "string" }
        } } }
      } } },
      reflection_questions: { type: "array", items: { type: "string" } },
      final_message: { type: "string" }, cta: { type: "string" }
    }
  },
  mini_training: {
    type: "object",
    properties: {
      title: { type: "string" }, subtitle: { type: "string" }, intro: { type: "string" },
      lessons: { type: "array", items: { type: "object", properties: {
        title: { type: "string" }, objective: { type: "string" }, script: { type: "string" },
        example: { type: "string" }, key_takeaway: { type: "string" }
      } } },
      bonus_tips: { type: "array", items: { type: "string" } },
      transition: { type: "string" }, cta: { type: "string" }
    }
  }
};

function safeParse(s) {
  try {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start !== -1 && end !== -1) return JSON.parse(s.slice(start, end + 1));
  } catch (_) {}
  return { raw_text: s };
}

function buildPrompt(type, form, biz, strat, intake, brand) {
  // Rich context from Idea Intake (accountStorage) — the actual answers + generated offer ladder
  const intakeCtx = intake ? `
=== IDEA INTAKE (the user's actual answers) ===
What they're launching: ${intake.intake?.what || "N/A"}
Who it's for: ${intake.intake?.who || "N/A"}
Problem it solves: ${intake.intake?.problem || "N/A"}
Result the customer gets: ${intake.intake?.result || "N/A"}
Offer tiers selected: ${intake.intake?.tiers || "N/A"}
Deployment platform: ${intake.intake?.platform || "N/A"}

GENERATED OFFER LADDER (use these real offers as the upsell path):
Low Ticket: ${intake.result?.offer_ladder?.low_ticket?.name || "N/A"} — ${intake.result?.offer_ladder?.low_ticket?.price || ""} — Guarantee: ${intake.result?.offer_ladder?.low_ticket?.guarantee || "N/A"}
Mid Ticket: ${intake.result?.offer_ladder?.mid_ticket?.name || "N/A"} — ${intake.result?.offer_ladder?.mid_ticket?.price || ""} — Guarantee: ${intake.result?.offer_ladder?.mid_ticket?.guarantee || "N/A"}
High Ticket: ${intake.result?.offer_ladder?.high_ticket?.name || "N/A"} — ${intake.result?.offer_ladder?.high_ticket?.price || ""} — Guarantee: ${intake.result?.offer_ladder?.high_ticket?.guarantee || "N/A"}

FREEBIE STRATEGY ALREADY SUGGESTED (align with this):
Best pick: ${intake.result?.freebie_strategy?.best_pick || "N/A"}
Reason: ${intake.result?.freebie_strategy?.best_pick_reason || "N/A"}
` : "";

  // Rich context from Idea Intake (Business) + Offer Ladder (Strategy)
  const bizCtx = biz ? `
=== FULL BUSINESS CONTEXT (Idea Intake) ===
Business Name: ${biz.business_name || "N/A"}
Industry / Niche: ${biz.industry || "N/A"}
Core Service / Offer: ${biz.core_service || "N/A"}
Target Avatar (ideal customer): ${biz.target_avatar || "N/A"}
Dream Outcome (the ultimate result the customer achieves): ${biz.dream_outcome || "N/A"}
Unique Advantage / Differentiator: ${biz.unique_advantage || "N/A"}
Biggest Challenge / Pain Point: ${biz.biggest_challenge || "N/A"}
Likelihood of Achievement Proof (testimonials, stats): ${biz.likelihood_of_achievement_proof || "N/A"}
Time Delay to Result: ${biz.time_delay_to_result || "N/A"}
Effort & Sacrifice Reduced (what they DON'T have to do): ${biz.effort_and_sacrifice_reduced || "N/A"}
Pricing Model: ${biz.pricing_model || "N/A"}
Current Monthly Revenue: ${biz.current_revenue || "N/A"}
Desired Monthly Revenue: ${biz.desired_revenue || "N/A"}
Launch Purpose / Mission: ${biz.launch_purpose || "N/A"}
` : "";

  const offerCtx = strat?.offer_stack ? `
=== OFFER LADDER / STRATEGY (Offer Builder) ===
Core Offer: ${strat.offer_stack.core_offer?.name || "N/A"} — Value: $${strat.offer_stack.core_offer?.value || 0} — Price: $${strat.offer_stack.core_offer?.price || 0} — Guarantee: ${strat.offer_stack.core_offer?.guarantee || "N/A"}
Upsells: ${(strat.offer_stack.upsells || []).map(u => `${u.name} ($${u.price})`).join(", ") || "None"}
Downsell: ${strat.offer_stack.downsell?.name ? `${strat.offer_stack.downsell.name} ($${strat.offer_stack.downsell.price})` : "None"}
Pricing Strategy — Anchor: $${strat.pricing_strategy?.anchor_price || 0} — Actual: $${strat.pricing_strategy?.actual_price || 0} — Positioning: ${strat.pricing_strategy?.positioning || "N/A"} — Urgency: ${strat.pricing_strategy?.urgency_mechanism || "N/A"}
Funnel Map — Lead Magnet: ${strat.funnel_map?.lead_magnet || "N/A"} — Close Mechanism: ${strat.funnel_map?.close_mechanism || "N/A"}
` : "";

  const brandCtx = brand ? `
=== BRAND INTELLIGENCE ===
Brand Name: ${brand.brand_name || biz?.business_name || "N/A"}
Brand Voice: ${brand.brand_voice || "N/A"}
Tone: ${brand.tone || "N/A"}
Visual Style: ${brand.visual_style || "N/A"}
Phrases to Use: ${brand.phrases_to_use || "N/A"}
Phrases to Avoid: ${brand.phrases_to_avoid || "N/A"}
Proof and Credentials: ${brand.proof_assets || "N/A"}
Website: ${brand.website || "N/A"}
Booking Link: ${brand.booking_link || "N/A"}
` : "";

  const purposeLabel = ASSET_PURPOSES.find((item) => item.id === form.purpose)?.label || "Free Lead Magnet";
  const purposeInstructions = form.purpose === "paid_product"
    ? "This is a standalone PAID product. Make it premium, substantial, and complete. Do not call it a freebie or lead magnet. The CTA should support delivery, implementation, or a logical next offer."
    : form.purpose === "client_delivery"
      ? "This is a CLIENT DELIVERY asset for an existing customer. Prioritize implementation, clarity, and client success. Do not write a sales CTA; end with the client's next action or support step."
      : "This is a FREE lead magnet. Deliver a fast, valuable win and use the CTA to move the reader toward the core offer.";
  const formatPrompt = TYPE_PROMPTS[type].replaceAll("lead magnet", purposeLabel.toLowerCase()).replaceAll("freebie", purposeLabel.toLowerCase());
  const base = `You are a world-class digital asset creator and direct response copywriter.

You are building a ${purposeLabel} for a REAL business. Below is the COMPLETE context from the user's Idea Intake and Offer Ladder. You MUST ground every section in THESE specific facts — NOT generic marketing filler.

${intakeCtx}${bizCtx}${offerCtx}${brandCtx}

Quick summary the user provided:
- Offer: ${form.offer}
- Audience: ${form.audience}
- Desired Result: ${form.result}

${formatPrompt}\n\nPURPOSE-SPECIFIC RULES:\n${purposeInstructions}\n\nMANDATORY SPECIFICITY RULES (violate these = failed output):
1. Reference the ACTUAL business name, industry, and target avatar by name in the intro and throughout — do not use generic phrases like "your business" or "many people".
2. Weave in the REAL unique advantage and the REAL biggest challenge/pain point the user described — reframe the freebie as the bridge over that specific challenge.
3. Use the REAL proof / testimonial the user provided (e.g. the specific client result) as a credibility example where relevant — do not invent fake testimonials.
4. Tie the dream outcome and the time-to-result directly into the promised transformation of the freebie.
5. For a free lead magnet, the CTA must point to the ACTUAL core offer. For paid products and client-delivery assets, follow the purpose-specific CTA rules above.
6. Write in a voice that fits THIS industry and audience — not a one-size-fits-all tone.

OUTPUT RULES:
1. Return FULL written content — not placeholders, not descriptions of what to write. Actual paragraphs, actual scripts, actual prompts. Ready to use immediately.
2. Do NOT include meta-commentary, preamble, or phrases like "Here is your response". Jump straight into the content fields.
3. Do NOT reference yourself, the request, or the generation process. Write as if YOU are the author speaking directly to the reader.`;
  return base;
}

const CANVA_PROMPT = (title, type, raw, purpose, brand, businessName, fallbackColor) => `You are a premium design director. Create a Canva-ready layout guide for a branded business asset titled "${title}" (type: ${type}).

Purpose: ${purpose}. The asset content has ALREADY been written. Lay it out page-by-page for Canva using the ACTUAL content below, not generic placeholders.

=== ACTUAL FREEBIE CONTENT (JSON) ===
${JSON.stringify(raw).slice(0, 6000)}

=== BRAND DESIGN SYSTEM ===
Brand: ${brand?.brand_name || businessName || "Business"}
Logo available: ${brand?.logo_url ? "Yes. Reserve intentional placement for the supplied logo." : "No logo supplied. Use a refined text treatment for the brand name."}
Visual direction: ${brand?.visual_style || "clean, premium, and editorial"}

Colors (use these exact hex codes):
- Primary: ${brand?.primary_color || fallbackColor || "#FF6A3D"}
- Secondary: ${brand?.secondary_color || "#0D0D0D"}
- Accent: ${brand?.accent_color || "#F4F4F4"}
- Background: ${brand?.background_color || "#FFFFFF"}
- Text: ${brand?.text_color || "#0D0D0D"}

Fonts:
- ${brand?.heading_font || "Plus Jakarta Sans"}: ALL headings, titles, callouts, highlighted text
- ${brand?.body_font || "Inter"}: ALL body text, descriptions, instructions

Font sizes to specify:
- Cover headline: 48-64px
- Page titles: 32-40px
- Section headings: 24-28px
- Body text: 14-16px
- Captions/labels: 10-12px

=== INSTRUCTIONS ===
Map the actual freebie content to pages. Each page should reference REAL content from the freebie (real headlines, real sections, real CTA). Don't invent generic pages like "Welcome" or "Testimonials" unless they exist in the content.

Return JSON:
- cover: object with headline_text (from the freebie title), subheading_text (from subtitle), background_tip (specific color hex + style), visual_suggestion (specific imagery direction)
- pages: array of page objects mapping to the real content structure:
    page_number, page_type, title (real section name), content_to_place (the ACTUAL text/content that goes on this page, pulled from the freebie), layout_tip (specific layout with column counts, alignment), visual_tip (specific visual element), accent_color (which hex to use for this page's accent)
- color_palette: array of {name, hex, usage} objects
- font_usage: object with headings (font + sizes), body (font + sizes), accents (font + sizes)
- design_principles: array of 5 specific design tips for THIS freebie type`;

export default function ClientMagnetBuilder() {
  const [form, setForm] = useState(() => {
    const prefill = accountStorage.getItem("clientMagnetPrefill");
    if (prefill) {
      accountStorage.removeItem("clientMagnetPrefill");
      try { return { purpose: "lead_magnet", type: "ai", ...JSON.parse(prefill) }; } catch (_) {}
    }
    return { purpose: "lead_magnet", offer: "", audience: "", result: "", type: "ai" };
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput]         = useState(null);
  const [chosenType, setChosenType] = useState(null);
  const [showCanva, setShowCanva]   = useState(false);
  const [canvaData, setCanvaData]   = useState(null);
  const [isDesigning, setIsDesigning] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [brandColor, setBrandColor] = useState("#FF6A3D");
  const [businessName, setBusinessName] = useState("");
  const [prefillSource, setPrefillSource] = useState(null);
  const [bizData, setBizData] = useState(null);
  const [stratData, setStratData] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [selectedBizId, setSelectedBizId] = useState("");
  const [intakeData, setIntakeData] = useState(null);
  const [appliedBrand, setAppliedBrand] = useState(null);
  const [outline, setOutline] = useState(null);
  const [isOutlining, setIsOutlining] = useState(false);
  const [assetProject, setAssetProject] = useState(null);
  const [projectMessage, setProjectMessage] = useState("");
  const [savedProjects, setSavedProjects] = useState([]);

  const applyBusiness = async (biz, stratList) => {
    if (!biz) return;
    const strat = (stratList || []).find((s) => s.business_id === biz.id) || null;
    setSelectedBizId(biz.id);
    setBusinessName(biz.business_name || "");
    setPrefillSource(biz.business_name);
    setBizData(biz);
    setStratData(strat);
    setIntakeData(null);
    setForm((prev) => ({
      ...prev,
      offer: prev.offer || strat?.offer_stack?.core_offer?.name || biz.core_service || "",
      audience: prev.audience || biz.target_avatar || "",
      result: prev.result || biz.dream_outcome || "",
    }));
    try {
      const brand = await getBrandProfileForBusiness(biz.id);
      setAppliedBrand(brand);
      if (brand) {
        setBusinessName(brand.brand_name || biz.business_name || "");
        setBrandColor(brand.primary_color || "#FF6A3D");
        setLogoDataUrl(brand.logo_url || null);
      }
    } catch (error) {
      console.warn("Brand Profile could not be applied:", error);
    }
  };

  const applyIntake = (parsed) => {
    const intake = parsed.intake || {};
    const result = parsed.result || {};
    setIntakeData({ intake, result });
    setBizData(null);
    setStratData(null);
    setPrefillSource(parsed.source === "money_model" ? "Money Model strategy" : "Idea Intake (current session)");
    setForm((prev) => ({
      ...prev,
      offer: prev.offer || intake.what || "",
      audience: prev.audience || intake.who || "",
      result: prev.result || intake.result || "",
      business_id: prev.business_id || intake.business_id || parsed.business_id || "",
      money_model_id: prev.money_model_id || parsed.money_model_id || "",
      brand_profile_id: prev.brand_profile_id || parsed.brand_profile_id || "",
    }));
    const handoffBrand = parsed.brand_snapshot || result.brand_profile;
    if (handoffBrand) {
      setAppliedBrand(handoffBrand);
      setBusinessName(handoffBrand.brand_name || intake.business_name || "");
      setBrandColor(handoffBrand.primary_color || "#FF6A3D");
      setLogoDataUrl(handoffBrand.logo_url || null);
    }
  };

  // Load saved records first, then apply the active strategy handoff last so it keeps priority.
  const loadSaved = async () => {
    try {
        const [bizList, stratList, projectList] = await Promise.all([
          base44.entities.Business.list("-updated_date"),
          base44.entities.Strategy.list("-updated_date"),
          base44.entities.AssetProject.list("-updated_date", 6),
        ]);
        setBusinesses(bizList || []);
        setStrategies(stratList || []);
        setSavedProjects(projectList || []);
        if (bizList?.[0]) await applyBusiness(bizList[0], stratList || []);
        const activeWorkspace = accountStorage.getItem("launchSystem");
        if (activeWorkspace) applyIntake(JSON.parse(activeWorkspace));
    } catch (error) {
      console.warn("Saved business and brand data unavailable:", error);
    }
  };

  useEffect(() => { loadSaved(); }, []);

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 400;
        const ratio = Math.min(max / img.naturalWidth, max / img.naturalHeight, 1);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth * ratio;
        canvas.height = img.naturalHeight * ratio;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        setLogoDataUrl(canvas.toDataURL("image/png"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const resolveAssetType = () => {
    if (form.type !== "ai") return form.type;
    const offerLower = form.offer.toLowerCase();
    if (offerLower.includes("coaching") || offerLower.includes("program") || offerLower.includes("mastermind") || offerLower.includes("high")) return "ebook";
    if (offerLower.includes("template") || offerLower.includes("agency") || offerLower.includes("service")) return "templates";
    if (offerLower.includes("course") || offerLower.includes("training")) return "mini_training";
    return "prompt_pack";
  };

  const generateOutline = async () => {
    setIsOutlining(true);
    setProjectMessage("");
    try {
      const finalType = resolveAssetType();
      setChosenType(finalType);
      const purpose = ASSET_PURPOSES.find((item) => item.id === form.purpose)?.label;
      const result = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `Create a specific, conversion-focused outline for a ${purpose} in ${finalType} format.

Business: ${businessName || bizData?.business_name}
Offer: ${form.offer}
Audience: ${form.audience}
Desired result: ${form.result}
Brand voice: ${appliedBrand?.brand_voice || "clear, credible, and practical"}
Brand tone: ${appliedBrand?.tone || "Not specified"}
Visual style: ${appliedBrand?.visual_style || "Not specified"}
Phrases to use: ${appliedBrand?.phrases_to_use || "None specified"}
Phrases to avoid: ${appliedBrand?.phrases_to_avoid || "None specified"}
Proof and credentials: ${appliedBrand?.proof_assets || bizData?.likelihood_of_achievement_proof || "None supplied"}

Return only the requested structured outline. Do not write the full asset yet. Do not invent testimonials or results.`,
        response_json_schema: {
          type: "object",
          properties: {
            title_options: { type: "array", items: { type: "string" } },
            recommended_title: { type: "string" },
            core_promise: { type: "string" },
            sections: { type: "array", items: { type: "object", properties: { title: { type: "string" }, summary: { type: "string" } } } },
            cta_strategy: { type: "string" }
          }
        }
      });
      setOutline(result);
      const businessId = form.business_id || intakeData?.intake?.business_id || selectedBizId || bizData?.id;
      if (businessId) {
        const project = await base44.entities.AssetProject.create({
          business_id: businessId,
          brand_profile_id: appliedBrand?.id || "",
          business_name: businessName || bizData?.business_name || "My Business",
          purpose: form.purpose,
          asset_type: finalType,
          title: result.recommended_title,
          status: "outline_ready",
          inputs: form,
          outline: result,
          brand_snapshot: appliedBrand || { brand_name: businessName, primary_color: brandColor, logo_url: logoDataUrl },
          project_version: 2,
        });
        setAssetProject(project);
        setSavedProjects((current) => [project, ...current.filter((item) => item.id !== project.id)].slice(0, 6));
        setProjectMessage("Outline saved automatically.");
      }
    } catch (error) {
      console.error("Asset outline generation failed:", error);
      setProjectMessage("We could not create the outline. Please try again.");
    } finally {
      setIsOutlining(false);
    }
  };

  const generate = async () => {
    if (!outline) return;
    setIsGenerating(true);
    setOutput(null);
    setChosenType(null);
    setShowCanva(false);
    setCanvaData(null);

    try {
    const finalType = resolveAssetType();
    setChosenType(finalType);
    if (assetProject?.id) await base44.entities.AssetProject.update(assetProject.id, { status: "outline_approved", outline, title: outline.recommended_title });
    const prompt = `${buildPrompt(finalType, form, bizData, stratData, intakeData, appliedBrand)}\n\nAPPROVED OUTLINE:\n${JSON.stringify(outline)}\n\nFollow this approved outline closely.`;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6",
      response_json_schema: TYPE_SCHEMAS[finalType]
    });
    const raw = typeof result === "string" ? safeParse(result) : result;
    setOutput({ type: finalType, raw });
    if (assetProject?.id) {
      const updated = await base44.entities.AssetProject.update(assetProject.id, { title: raw?.title || outline.recommended_title, content: raw, status: "content_ready" });
      setAssetProject(updated);
      setSavedProjects((current) => [updated, ...current.filter((item) => item.id !== updated.id)].slice(0, 6));
      setProjectMessage("Content saved automatically.");
    }
    } catch (error) {
      console.error("Asset content generation failed:", error);
      setProjectMessage("We could not write the full asset. Your approved outline is still saved, so you can try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFreebie = async () => {
    if (!output?.raw) return;
    await generateFreebiePDF({
      type: output.type,
      data: output.raw,
      logoDataUrl,
      brandColor,
      businessName,
      purpose: form.purpose,
    });
  };

  const designFreebie = async () => {
    if (!output) return;
    setIsDesigning(true);
    setShowCanva(true);
    const title = output.raw?.title || "Your Asset";
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: CANVA_PROMPT(title, output.type, output.raw, form.purpose, appliedBrand, businessName, brandColor),
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          cover: { type: "object", properties: { headline_text: {type:"string"}, subheading_text:{type:"string"}, background_tip:{type:"string"}, visual_suggestion:{type:"string"} } },
          pages: { type: "array", items: { type:"object", properties: { page_number:{type:"number"}, page_type:{type:"string"}, title:{type:"string"}, content_to_place:{type:"string"}, layout_tip:{type:"string"}, visual_tip:{type:"string"}, accent_color:{type:"string"} } } },
          color_palette: { type: "array", items: { type: "object", properties: { name:{type:"string"}, hex:{type:"string"}, usage:{type:"string"} } } },
          design_principles: { type: "array", items: { type: "string" } },
          font_usage: { type: "object", properties: { headings:{type:"string"}, body:{type:"string"}, accents:{type:"string"} } }
        }
      }
    });
    setCanvaData(result);
    if (assetProject?.id) {
      const updated = await base44.entities.AssetProject.update(assetProject.id, { design: result, status: "designed" });
      setAssetProject(updated);
      setSavedProjects((current) => [updated, ...current.filter((item) => item.id !== updated.id)].slice(0, 6));
      setProjectMessage("Design plan saved automatically.");
    }
    setIsDesigning(false);
  };

  const loadProject = (project) => {
    setAssetProject(project);
    setSelectedBizId(project.business_id);
    setBusinessName(project.business_name || "");
    setForm({ purpose: "lead_magnet", offer: "", audience: "", result: "", type: project.asset_type || "ai", ...(project.inputs || {}) });
    setOutline(project.outline || null);
    setOutput(project.content ? { type: project.asset_type, raw: project.content } : null);
    setCanvaData(project.design || null);
    setShowCanva(Boolean(project.design));
    const savedBrand = project.brand_snapshot;
    if (savedBrand) {
      setAppliedBrand(savedBrand);
      setBrandColor(savedBrand.primary_color || "#FF6A3D");
      setLogoDataUrl(savedBrand.logo_url || null);
      setBusinessName(savedBrand.brand_name || project.business_name || "");
    }
    setProjectMessage(`${project.title || "Project"} loaded.`);
  };

  const reset = () => { setOutput(null); setOutline(null); setAssetProject(null); setProjectMessage(""); setChosenType(null); setShowCanva(false); setCanvaData(null); };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadSaved}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto hero-radial min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">ASSET CREATOR</Badge>
          <h1 className="font-display text-3xl font-black text-foreground mb-2">Create a Branded Business Asset</h1>
          <p className="text-muted-foreground">Choose the purpose, approve the strategy, then generate the complete branded asset.</p>

          {prefillSource && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
                <Zap className="w-3.5 h-3.5" />
                Shared intelligence loaded from: <span className="text-foreground">{prefillSource}</span>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-primary font-semibold">View data being used</summary>
                <div className="mt-2 p-3 rounded-xl border border-border bg-card text-sm space-y-1 max-w-2xl">
                  {intakeData ? (
                    <>
                      <p className="font-semibold text-primary mb-1">From your active strategy workspace:</p>
                      <p><span className="text-muted-foreground">Launching:</span> <span className="text-foreground font-medium">{intakeData.intake?.what || "—"}</span></p>
                      <p><span className="text-muted-foreground">Audience:</span> <span className="text-foreground font-medium">{intakeData.intake?.who || "—"}</span></p>
                      <p><span className="text-muted-foreground">Problem:</span> <span className="text-foreground font-medium">{intakeData.intake?.problem || "—"}</span></p>
                      <p><span className="text-muted-foreground">Result:</span> <span className="text-foreground font-medium">{intakeData.intake?.result || "—"}</span></p>
                      <p><span className="text-muted-foreground">High Ticket Offer:</span> <span className="text-foreground font-medium">{intakeData.result?.offer_ladder?.high_ticket?.name || "—"} ({intakeData.result?.offer_ladder?.high_ticket?.price || ""})</span></p>
                      <p><span className="text-muted-foreground">Mid Ticket Offer:</span> <span className="text-foreground font-medium">{intakeData.result?.offer_ladder?.mid_ticket?.name || "—"} ({intakeData.result?.offer_ladder?.mid_ticket?.price || ""})</span></p>
                      <p><span className="text-muted-foreground">Low Ticket Offer:</span> <span className="text-foreground font-medium">{intakeData.result?.offer_ladder?.low_ticket?.name || "—"} ({intakeData.result?.offer_ladder?.low_ticket?.price || ""})</span></p>
                      <p><span className="text-muted-foreground">Suggested Freebie:</span> <span className="text-foreground font-medium">{intakeData.result?.freebie_strategy?.best_pick || "—"}</span></p>
                    </>
                  ) : (
                    <>
                      <p><span className="text-muted-foreground">Industry:</span> <span className="text-foreground font-medium">{bizData?.industry || "—"}</span></p>
                      <p><span className="text-muted-foreground">Core Service:</span> <span className="text-foreground font-medium">{bizData?.core_service || "—"}</span></p>
                      <p><span className="text-muted-foreground">Target Avatar:</span> <span className="text-foreground font-medium">{bizData?.target_avatar || "—"}</span></p>
                      <p><span className="text-muted-foreground">Dream Outcome:</span> <span className="text-foreground font-medium">{bizData?.dream_outcome || "—"}</span></p>
                      <p><span className="text-muted-foreground">Unique Advantage:</span> <span className="text-foreground font-medium">{bizData?.unique_advantage || "—"}</span></p>
                      <p><span className="text-muted-foreground">Biggest Challenge:</span> <span className="text-foreground font-medium">{bizData?.biggest_challenge || "—"}</span></p>
                      <p><span className="text-muted-foreground">Proof:</span> <span className="text-foreground font-medium">{bizData?.likelihood_of_achievement_proof || "—"}</span></p>
                      <p><span className="text-muted-foreground">Core Offer:</span> <span className="text-foreground font-medium">{stratData?.offer_stack?.core_offer?.name || "—"}</span></p>
                      <p><span className="text-muted-foreground">Offer Price:</span> <span className="text-foreground font-medium">${stratData?.offer_stack?.core_offer?.price || "—"}</span></p>
                      <p><span className="text-muted-foreground">Guarantee:</span> <span className="text-foreground font-medium">{stratData?.offer_stack?.core_offer?.guarantee || "—"}</span></p>
                    </>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>

        {savedProjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-black text-lg">Recent Asset Projects</h2>
              <span className="text-sm text-muted-foreground">Saved automatically</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedProjects.map((project) => (
                <button key={project.id} onClick={() => loadProject(project)}
                  className="p-4 rounded-xl border border-border bg-card text-left hover:border-primary/40 transition-all">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-bold uppercase text-primary">{project.status?.replaceAll("_", " ")}</span>
                    <span className="text-sm text-muted-foreground">{ASSET_PURPOSES.find((item) => item.id === project.purpose)?.label}</span>
                  </div>
                  <p className="font-bold text-sm line-clamp-2">{project.title || "Untitled Asset"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{project.business_name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        {!output && !isGenerating && (
          <div className="space-y-6 mb-8">
            <div>
              <label className="text-muted-foreground text-sm font-bold uppercase block mb-3">What are you creating?</label>
              <div className="grid md:grid-cols-3 gap-3">
                {ASSET_PURPOSES.map(({ id, label, desc, icon: Icon }) => (
                  <button key={id} onClick={() => { setForm({ ...form, purpose: id }); setOutline(null); setAssetProject(null); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.purpose === id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}>
                    <Icon className={`w-5 h-5 mb-2 ${form.purpose === id ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-bold text-sm text-foreground">{label}</p>
                    <p className="text-muted-foreground text-sm mt-1">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { key: "offer",    label: "What are you offering?",     placeholder: "e.g. 1-on-1 coaching for real estate agents" },
                { key: "audience", label: "Who is it for?",             placeholder: "e.g. New agents in their first 2 years" },
                { key: "result",   label: "What result do they want?",  placeholder: "e.g. Close their first deal within 90 days" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">{label}</label>
                  <textarea
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-bold uppercase block mb-3">Choose the asset format</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {FREEBIE_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setForm({ ...form, type: t.id })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.type === t.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}
                  >
                    <p className={`font-bold text-sm mb-1 ${form.type === t.id ? 'text-primary' : 'text-foreground'}`}>{t.label}</p>
                    <p className="text-muted-foreground text-sm">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <BrandingPanel
              logoDataUrl={logoDataUrl}
              onLogoChange={onLogoChange}
              onLogoRemove={() => setLogoDataUrl(null)}
              brandColor={brandColor}
              onBrandColorChange={setBrandColor}
              businessName={businessName}
              onBusinessNameChange={setBusinessName}
            />
            {appliedBrand ? (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm">
                <span className="text-emerald-800 font-semibold">Brand Profile applied for {appliedBrand.brand_name}.</span>
                <Link to="/BrandProfile" className="text-primary font-bold hover:underline">Edit Brand Profile</Link>
              </div>
            ) : selectedBizId ? (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm">
                <span className="text-amber-800">Manual branding still works. Save a Brand Profile to reuse it automatically.</span>
                <Link to="/BrandProfile" className="text-primary font-bold hover:underline">Create Brand Profile</Link>
              </div>
            ) : null}

            {projectMessage && !outline && <p className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{projectMessage}</p>}
            {!outline ? (
              <Button
                onClick={generateOutline}
                disabled={isOutlining || !form.offer || !form.audience || !form.result}
                className="w-full accent-gradient hover:opacity-90 text-white font-black text-lg py-6 rounded-xl"
              >
                {isOutlining ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
                {isOutlining ? "CREATING ASSET STRATEGY..." : "CREATE MY OUTLINE"}
              </Button>
            ) : (
              <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-black text-xl">Review Your Asset Strategy</h2>
                </div>
                <div>
                  <label className="text-sm font-bold uppercase text-muted-foreground block mb-2">Recommended Title</label>
                  <input value={outline.recommended_title || ""} onChange={(e) => setOutline({ ...outline, recommended_title: e.target.value })}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 font-bold text-foreground" />
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm font-bold uppercase text-primary mb-1">Core Promise</p>
                  <p className="text-sm text-foreground">{outline.core_promise}</p>
                </div>
                <div className="space-y-2">
                  {(outline.sections || []).map((section, index) => (
                    <div key={index} className="p-4 rounded-xl bg-card border border-border">
                      <p className="font-bold text-sm">{index + 1}. {section.title}</p>
                      <p className="text-muted-foreground text-sm mt-1">{section.summary}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm font-bold uppercase text-primary mb-1">CTA Strategy</p>
                  <p className="text-sm text-foreground">{outline.cta_strategy}</p>
                </div>
                {projectMessage && <p className="text-sm font-semibold text-emerald-700">{projectMessage}</p>}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => { setOutline(null); setAssetProject(null); }} className="flex-1">Revise Inputs</Button>
                  <Button onClick={generate} className="flex-1 accent-gradient text-white font-black">
                    Approve &amp; Write Full Asset <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generating State */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-foreground font-black text-xl">Building Your Complete Asset...</p>
            <p className="text-muted-foreground text-sm">Writing the approved strategy into premium full-length content. Your saved project will update automatically.</p>
          </div>
        )}

        {/* Output */}
        {output && !isGenerating && (
          <div className="space-y-6">
            {/* Ready Banner */}
            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-primary font-black text-lg">✅ Your Business Asset Is Ready</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Type: <span className="text-primary font-bold">{FREEBIE_TYPES.find(t => t.id === output.type)?.label}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadFreebie} className="accent-gradient hover:opacity-90 text-white gap-2">
                  <Download className="w-4 h-4" /> Download
                </Button>
                <Button onClick={reset} variant="outline" className="border-border text-muted-foreground hover:text-foreground gap-2">
                  <RotateCcw className="w-4 h-4" /> Start Over
                </Button>
              </div>
            </div>

            {/* Freebie Content */}
            <FreebieOutput type={output.type} data={output.raw} />

            {/* Design Button */}
            <Button
              onClick={designFreebie}
              disabled={isDesigning}
              className="w-full accent-gradient hover:opacity-90 text-white font-black text-base py-4 rounded-xl"
            >
              {isDesigning
                ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Designing Your Layout...</>
                : <><Palette className="w-5 h-5 mr-2" />Design My Asset (Canva Layout)</>
              }
            </Button>

            {/* Canva Layout */}
            {showCanva && canvaData && (
              <CanvaLayout data={canvaData} />
            )}

            {/* Funnel CTA */}
            <Link to="/FunnelBuilder">
              <Button className="w-full accent-gradient hover:opacity-90 text-white font-black text-base py-4 rounded-xl">
                Turn This Into a Funnel <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}

function CanvaLayout({ data }) {
  return (
    <div className="space-y-5 p-6 rounded-2xl border border-primary/20 bg-card">
      <div className="flex items-center gap-2">
        <p className="text-primary font-black text-sm uppercase tracking-wider">🎨 Canva-Ready Layout</p>
        <span className="text-muted-foreground text-sm">— Real content mapped to pages</span>
      </div>

      {/* Color Palette */}
      {data.color_palette?.length > 0 && (
        <div>
          <p className="text-primary text-sm font-bold uppercase mb-2">Color Palette</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {data.color_palette.map((c, i) => (
              <div key={i} className="p-2 rounded-lg border border-border bg-card">
                <div className="w-full h-8 rounded mb-1.5" style={{ backgroundColor: c.hex }} />
                <p className="text-foreground text-sm font-bold">{c.name}</p>
                <p className="text-muted-foreground text-sm font-mono">{c.hex}</p>
                <p className="text-muted-foreground text-sm mt-0.5">{c.usage}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cover */}
      {data.cover && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
          <p className="text-primary font-bold text-sm uppercase mb-2">Cover Page</p>
          <p className="text-foreground font-black text-lg font-display">{data.cover.headline_text}</p>
          <p className="text-muted-foreground text-sm mt-1">{data.cover.subheading_text}</p>
          <div className="mt-3 space-y-1">
            <p className="text-sm"><span className="text-primary font-semibold">Background:</span> <span className="text-muted-foreground">{data.cover.background_tip}</span></p>
            <p className="text-sm"><span className="text-primary font-semibold">Visual:</span> <span className="text-muted-foreground">{data.cover.visual_suggestion}</span></p>
          </div>
        </div>
      )}

      {/* Pages */}
      <div className="space-y-3">
        {data.pages?.map((page, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Page header bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-black font-display" style={{ backgroundColor: page.accent_color || "#FF6A3D" }}>
                {page.page_number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary/10 text-primary text-sm">{page.page_type}</Badge>
                  <span className="text-foreground font-semibold text-sm">{page.title}</span>
                </div>
              </div>
            </div>
            {/* Page body */}
            <div className="px-4 py-3 space-y-2">
              {page.content_to_place && (
                <div>
                  <p className="text-primary text-sm font-bold uppercase mb-1">Content to Place</p>
                  <p className="text-foreground/80 text-sm whitespace-pre-wrap bg-secondary rounded-lg p-3 border border-border">{page.content_to_place}</p>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-2">
                {page.layout_tip && (
                  <div className="p-2.5 rounded-lg bg-secondary border border-border">
                    <p className="text-primary text-sm font-bold mb-0.5">📐 Layout</p>
                    <p className="text-muted-foreground text-sm">{page.layout_tip}</p>
                  </div>
                )}
                {page.visual_tip && (
                  <div className="p-2.5 rounded-lg bg-secondary border border-border">
                    <p className="text-primary text-sm font-bold mb-0.5">🖼 Visual</p>
                    <p className="text-muted-foreground text-sm">{page.visual_tip}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Font Usage */}
      {data.font_usage && (
        <div>
          <p className="text-primary text-sm font-bold uppercase mb-2">Font Usage</p>
          <div className="grid md:grid-cols-3 gap-3">
            {Object.entries(data.font_usage).map(([k, v]) => (
              <div key={k} className="p-3 rounded-lg bg-card border border-border">
                <p className="text-primary text-sm font-bold capitalize mb-1">{k}</p>
                <p className="text-muted-foreground text-sm">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Design Principles */}
      {data.design_principles && (
        <div>
          <p className="text-primary text-sm font-bold uppercase mb-2">Design Principles</p>
          <ul className="space-y-1.5">
            {data.design_principles.map((p, i) => (
              <li key={i} className="text-muted-foreground text-sm flex gap-2"><span className="text-primary flex-shrink-0">•</span>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}