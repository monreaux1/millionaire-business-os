import { accountStorage } from "@/lib/account-storage";

const asOffer = (offer, fallbackPurpose = "") => ({
  name: offer?.name || "Untitled offer",
  price: Number(offer?.price ?? offer?.monthly_price) || 0,
  value: Number(offer?.price ?? offer?.monthly_price) || 0,
  whats_included: offer?.deliverables || [],
  quick_win: offer?.promise || offer?.purpose || offer?.recurring_value || fallbackPurpose,
  delivery_format: offer?.fulfillment || offer?.adjusted_scope || offer?.retention_mechanism || "",
  guarantee: offer?.guarantee_approach || "",
});

const sevenDayPlan = (weeks = []) => {
  const actions = weeks.flatMap((week) =>
    (week.actions || []).map((action) => ({ week: week.week, focus: week.focus, action }))
  );

  return Array.from({ length: 7 }, (_, index) => {
    const item = actions[index] || actions[actions.length - 1] || {};
    return {
      day: index + 1,
      theme: item.focus || `Money Model Activation Day ${index + 1}`,
      hook: item.action || "Review the next priority in your Executive Action Plan.",
      cta: index < 2 ? "Build awareness" : index < 5 ? "Invite the next step" : "Present the core offer",
    };
  });
};

export function activateMoneyModel(model, answers, target, brandProfile = null) {
  if (!model || typeof window === "undefined") return null;

  const previous = accountStorage.getItem("launchSystem");
  if (previous) accountStorage.setItem("launchSystemBeforeMoneyModel", previous);

  const intake = {
    business_id: answers.business_id || "",
    business_name: answers.business_name || "",
    industry: answers.industry || "",
    what: answers.core_service || model.core_offer?.name || "",
    who: answers.target_customer || model.dream_customer?.summary || "",
    problem: answers.primary_problem || model.dream_customer?.urgent_pains?.[0] || "",
    result: answers.dream_outcome || model.core_offer?.promise || "",
    current_revenue: 0,
    desired_revenue: answers.target_monthly_revenue || model.revenue_projection?.total_monthly_revenue || 0,
    business_stage: "growing",
    acquisition_method: answers.acquisition_channel || "",
    existing_recurring_revenue: 0,
    tiers: "all",
    platform: "gohighlevel",
  };

  const offerLadder = {
    low_ticket: asOffer(model.attraction_offer, "Convert attention into a qualified lead"),
    mid_ticket: asOffer(model.core_offer, "Deliver the primary customer transformation"),
    high_ticket: asOffer(model.upsell_offers?.[0] || model.core_offer, "Accelerate or deepen the result"),
  };

  const priceObjections = model.dream_customer?.objections?.map((objection) =>
    `When the prospect says “${objection},” reconnect the decision to this outcome: ${model.core_offer?.promise || intake.result}. Clarify fit, scope, and the cost of leaving the problem unsolved without using pressure or false urgency.`
  ) || [];

  const result = {
    offer_ladder: offerLadder,
    freebie_strategy: {
      options: [{
        type: model.attraction_offer?.type || "lead magnet",
        title: model.attraction_offer?.name || "Attraction Offer",
        description: model.attraction_offer?.promise || "",
      }],
      best_pick: model.attraction_offer?.name || "Attraction Offer",
      best_pick_reason: model.attraction_offer?.conversion_goal || "Designed to move the dream customer into the core offer.",
    },
    funnel_map: {
      funnel_type: "Money Model Ascension Funnel",
      steps: (model.customer_journey || []).map((stage) => ({
        page: stage.stage,
        headline: stage.offer,
        subheadline: stage.customer_action,
        cta: stage.business_action,
        sections: [stage.success_metric],
      })),
      deployment_notes: "Use GoHighLevel as the CRM and execution destination. Preserve stage names and conversion metrics.",
    },
    launch_plan: sevenDayPlan(model.launch_plan),
    content_plan: {
      hooks: Object.values(model.sales_messages || {}).filter(Boolean),
      video_scripts: Object.entries(model.sales_messages || {}).slice(0, 3).map(([stage, script]) => ({
        title: `${stage.charAt(0).toUpperCase() + stage.slice(1)} Message`,
        script,
      })),
      carousel_ideas: (model.customer_journey || []).slice(0, 3).map((stage) => `${stage.stage}: ${stage.customer_action}`),
      story_posts: (model.executive_action_plan?.next_three_actions || []).slice(0, 2),
      email_outline: model.sales_messages?.core || model.core_offer?.promise || "",
    },
    sales_system: {
      discovery_call_script: model.sales_messages?.core || model.core_offer?.promise || "",
      dm_script: model.sales_messages?.attraction || model.attraction_offer?.promise || "",
      price_objections: priceObjections,
      think_about_it: model.sales_messages?.downsell || "Offer the appropriate downsell only when it genuinely fits the customer's needs and budget.",
      closing_statement: model.sales_messages?.continuity || model.sales_messages?.upsell || model.core_offer?.promise || "",
    },
    money_model: model,
    brand_profile: brandProfile,
  };

  const launchSystem = {
    intake,
    result,
    business_id: intake.business_id,
    profile_version: 2,
    source: "money_model",
    money_model_id: model.id || null,
    brand_profile_id: brandProfile?.id || null,
    brand_snapshot: brandProfile,
    activated_asset: target,
  };

  accountStorage.setItem("launchSystem", JSON.stringify(launchSystem));
  accountStorage.setItem("moneyModelHandoff", JSON.stringify({
    target,
    money_model_id: model.id || null,
    activated_at: new Date().toISOString(),
  }));

  if (target === "lead_magnet") {
    accountStorage.setItem("clientMagnetPrefill", JSON.stringify({
      offer: model.core_offer?.name || answers.core_service || "",
      audience: answers.target_customer || model.dream_customer?.summary || "",
      result: model.attraction_offer?.promise || answers.dream_outcome || "",
      type: "ai",
      business_id: answers.business_id || "",
      brand_profile_id: brandProfile?.id || "",
      brand_name: brandProfile?.brand_name || answers.business_name || "",
      logo_url: brandProfile?.logo_url || "",
      primary_color: brandProfile?.primary_color || "",
      secondary_color: brandProfile?.secondary_color || "",
      brand_voice: brandProfile?.brand_voice || "",
      visual_style: brandProfile?.visual_style || "",
    }));
  }

  if (target === "funnel") {
    accountStorage.setItem("funnelFormDraft", JSON.stringify({
      business_name: answers.business_name || "",
      industry: answers.industry || "",
      target_avatar: answers.target_customer || "",
      core_service: answers.core_service || "",
      offer: model.core_offer?.name || "",
      offer_price: model.core_offer?.price || "",
      core_promise: model.core_offer?.promise || "",
      audience_pain: answers.primary_problem || "",
      audience_desire: answers.dream_outcome || "",
      funnel_scope: "full",
      visual_mode: "conversion",
      brand_colors: [brandProfile?.primary_color, brandProfile?.secondary_color, brandProfile?.accent_color].filter(Boolean).join(", "),
      brand_fonts: [brandProfile?.heading_font, brandProfile?.body_font].filter(Boolean).join(", "),
      urgency_mechanism: "",
      cta_action: "Start now",
      contact_info: [brandProfile?.website, brandProfile?.email, brandProfile?.phone, brandProfile?.booking_link].filter(Boolean).join(" | "),
      platform: "gohighlevel",
      custom_context: `Use this customer journey: ${JSON.stringify(model.customer_journey || [])}`,
    }));
    accountStorage.setItem("funnelBuilderState", JSON.stringify({ step: "form", funnel: null }));
    accountStorage.removeItem("generatedFunnel");
  }

  const routes = {
    lead_magnet: "/ClientMagnetBuilder",
    offer_stack: "/OfferLadder",
    funnel: "/FunnelBuilder",
    sales_scripts: "/SalesScripts",
    launch_plan: "/LaunchBattlePlan",
    content: "/ContentGenerator",
  };

  return routes[target] || "/MoneyModelBuilder";
}

export function restorePreviousLaunchWorkspace() {
  const previous = accountStorage.getItem("launchSystemBeforeMoneyModel");
  if (!previous) return false;
  accountStorage.setItem("launchSystem", previous);
  return true;
}
