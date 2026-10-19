import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { getLatestBusinessProfile, saveUnifiedBusinessProfile } from "@/lib/business-profile";
import { getBrandCompletion, getBrandProfileForBusiness } from "@/lib/brand-profile";
import { activateMoneyModel } from "@/lib/money-model-handoff";
import {
  ArrowLeft, ArrowRight, Check, Copy, DollarSign, Loader2,
  RefreshCw, Sparkles, Target, TrendingUp, Zap, Gift, Layers, Map, Mic2, Rocket, FileText,
  Building2, Palette, History
} from "lucide-react";

const STEPS = [
  { title: "Business Foundation", subtitle: "Confirm the business and revenue target." },
  { title: "Dream Customer", subtitle: "Define who should move through the model." },
  { title: "Core Economics", subtitle: "Set pricing, volume, and delivery constraints." },
  { title: "Growth Preferences", subtitle: "Choose how the model should acquire and retain buyers." },
];

const toNumber = (value) => {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0
}).format(toNumber(value));

const initialAnswers = {
  business_id: "",
  business_name: "",
  industry: "",
  core_service: "",
  target_customer: "",
  primary_problem: "",
  dream_outcome: "",
  current_price: 0,
  current_monthly_customers: 10,
  target_monthly_revenue: 10000,
  gross_margin_percent: 70,
  fulfillment_capacity: 30,
  acquisition_channel: "",
  proof_assets: "",
  preferred_attraction: "lead-magnet",
  continuity_preference: "membership",
  launch_timeline: "30-days",
};

export default function MoneyModelBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [model, setModel] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [profileBusiness, setProfileBusiness] = useState(null);
  const [brandProfile, setBrandProfile] = useState(null);
  const [latestModel, setLatestModel] = useState(null);

  const loadProfile = async () => {
    try {
      const business = await getLatestBusinessProfile();
      if (!business) return;
      setProfileBusiness(business);
      setAnswers((current) => ({
        ...current,
        business_id: business.id,
        business_name: business.business_name || "",
        industry: business.industry || "",
        core_service: business.core_service || "",
        target_customer: business.target_avatar || "",
        primary_problem: business.primary_problem || business.biggest_challenge || "",
        dream_outcome: business.customer_result || business.dream_outcome || "",
        current_price: toNumber(business.launch_system_snapshot?.result?.offer_ladder?.mid_ticket?.price),
        target_monthly_revenue: business.desired_revenue || 10000,
        acquisition_channel: business.acquisition_method || "",
        proof_assets: business.likelihood_of_achievement_proof || "",
        launch_timeline: business.timeline || "30-days",
      }));

      const [brand, models] = await Promise.all([
        getBrandProfileForBusiness(business.id),
        base44.entities.MoneyModel.filter({ business_id: business.id, status: "complete" }, "-updated_date", 1),
      ]);
      setBrandProfile(brand);
      setLatestModel(models?.[0] || null);
    } catch (profileError) {
      console.warn(profileError);
      setError("Your saved intelligence could not be loaded. You can still complete the builder.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const update = (key, value) => setAnswers((current) => ({ ...current, [key]: value }));

  const canContinue = useMemo(() => {
    if (step === 0) return answers.business_name.trim() && answers.core_service.trim() && Number(answers.target_monthly_revenue) > 0;
    if (step === 1) return answers.target_customer.trim() && answers.primary_problem.trim() && answers.dream_outcome.trim();
    if (step === 2) return Number(answers.current_monthly_customers) > 0 && Number(answers.fulfillment_capacity) > 0;
    return answers.acquisition_channel.trim();
  }, [answers, step]);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      let businessId = answers.business_id;
      if (!businessId) {
        const business = await saveUnifiedBusinessProfile({
          business_name: answers.business_name,
          industry: answers.industry,
          what: answers.core_service,
          who: answers.target_customer,
          problem: answers.primary_problem,
          result: answers.dream_outcome,
          desired_revenue: answers.target_monthly_revenue,
          acquisition_method: answers.acquisition_channel,
          business_stage: "idea",
          existing_recurring_revenue: 0,
          tiers: "all",
          platform: "base44",
        });
        businessId = business.id;
        setAnswers((current) => ({ ...current, business_id: businessId }));
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite revenue model architect. Build a practical, ethical and highly specific money model inspired by acquisition, ascension and continuity principles. Do not imitate any living person's voice or claim affiliation with any third-party author, publisher, or business education brand.

BUSINESS
Name: ${answers.business_name}
Industry: ${answers.industry}
Core product or service: ${answers.core_service}
Dream customer: ${answers.target_customer}
Primary problem: ${answers.primary_problem}
Dream outcome: ${answers.dream_outcome}
Current price: $${answers.current_price || 0}
Current monthly customers: ${answers.current_monthly_customers}
Target monthly revenue: $${answers.target_monthly_revenue}
Estimated gross margin: ${answers.gross_margin_percent}%
Monthly fulfillment capacity: ${answers.fulfillment_capacity}
Current acquisition channel: ${answers.acquisition_channel}
Proof assets: ${answers.proof_assets || brandProfile?.proof_assets || "No proof assets listed"}

BRAND INTELLIGENCE
Brand name: ${brandProfile?.brand_name || answers.business_name}
Brand voice: ${brandProfile?.brand_voice || "Not specified"}
Tone: ${brandProfile?.tone || "Not specified"}
Visual style: ${brandProfile?.visual_style || "Not specified"}
Signature phrases: ${brandProfile?.phrases_to_use || "None specified"}
Language to avoid: ${brandProfile?.phrases_to_avoid || "None specified"}
Website: ${brandProfile?.website || "Not specified"}

Preferred attraction mechanism: ${answers.preferred_attraction}
Preferred continuity format: ${answers.continuity_preference}
Launch timeline: ${answers.launch_timeline}

Create one connected customer journey. Make every offer appropriate for the industry and buyer. All revenue math must be internally consistent and show assumptions. Avoid fake scarcity, misleading guarantees, legal claims, and unrealistic income promises.

Return:
1. Dream customer with buying trigger, urgent pains, desired outcomes, objections and readiness signals.
2. Core offer with name, promise, deliverables, price, value justification, guarantee approach and qualification criteria.
3. Attraction offer with type, name, promise, price, fulfillment and conversion goal.
4. Two upsells with timing, name, purpose, price and transition script.
5. Two downsells with trigger, name, adjusted scope, price and positioning.
6. One continuity offer with name, monthly price, recurring value, retention mechanism and cancellation risk control.
7. Ordered customer journey stages with offer, customer action, business action and success metric.
8. Sales messages for attraction, core, upsell, downsell and continuity.
9. Monthly revenue projection with customers, conversion assumptions, revenue by stage, total revenue, gross profit estimate and capacity warning.
10. A 30 day launch plan grouped into four weekly phases.
11. Executive action plan with biggest opportunity, biggest risk, decisions needed and exactly three next actions.`,
        response_json_schema: {
          type: "object",
          properties: {
            dream_customer: { type: "object", properties: {
              summary: { type: "string" }, buying_trigger: { type: "string" },
              urgent_pains: { type: "array", items: { type: "string" } },
              desired_outcomes: { type: "array", items: { type: "string" } },
              objections: { type: "array", items: { type: "string" } },
              readiness_signals: { type: "array", items: { type: "string" } }
            }},
            core_offer: { type: "object", properties: {
              name: { type: "string" }, promise: { type: "string" },
              deliverables: { type: "array", items: { type: "string" } },
              price: { type: "number" }, value_justification: { type: "string" },
              guarantee_approach: { type: "string" }, qualification_criteria: { type: "string" }
            }},
            attraction_offer: { type: "object", properties: {
              type: { type: "string" }, name: { type: "string" }, promise: { type: "string" },
              price: { type: "number" }, fulfillment: { type: "string" }, conversion_goal: { type: "string" }
            }},
            upsell_offers: { type: "array", items: { type: "object", properties: {
              timing: { type: "string" }, name: { type: "string" }, purpose: { type: "string" },
              price: { type: "number" }, transition_script: { type: "string" }
            }}},
            downsell_offers: { type: "array", items: { type: "object", properties: {
              trigger: { type: "string" }, name: { type: "string" }, adjusted_scope: { type: "string" },
              price: { type: "number" }, positioning: { type: "string" }
            }}},
            continuity_offer: { type: "object", properties: {
              name: { type: "string" }, monthly_price: { type: "number" },
              recurring_value: { type: "string" }, retention_mechanism: { type: "string" },
              cancellation_risk_control: { type: "string" }
            }},
            customer_journey: { type: "array", items: { type: "object", properties: {
              stage: { type: "string" }, offer: { type: "string" }, customer_action: { type: "string" },
              business_action: { type: "string" }, success_metric: { type: "string" }
            }}},
            sales_messages: { type: "object", properties: {
              attraction: { type: "string" }, core: { type: "string" }, upsell: { type: "string" },
              downsell: { type: "string" }, continuity: { type: "string" }
            }},
            revenue_projection: { type: "object", properties: {
              customers: { type: "number" }, conversion_assumptions: { type: "array", items: { type: "string" } },
              revenue_by_stage: { type: "array", items: { type: "object", properties: {
                stage: { type: "string" }, revenue: { type: "number" }
              }}},
              total_monthly_revenue: { type: "number" }, gross_profit_estimate: { type: "number" },
              capacity_warning: { type: "string" }
            }},
            launch_plan: { type: "array", items: { type: "object", properties: {
              week: { type: "number" }, focus: { type: "string" },
              actions: { type: "array", items: { type: "string" } }, milestone: { type: "string" }
            }}},
            executive_action_plan: { type: "object", properties: {
              biggest_opportunity: { type: "string" }, biggest_risk: { type: "string" },
              decisions_needed: { type: "array", items: { type: "string" } },
              next_three_actions: { type: "array", items: { type: "string" } }
            }}
          }
        }
      });

      const generated = response.response || response;
      const saved = await base44.entities.MoneyModel.create({
        business_id: businessId,
        business_name: answers.business_name,
        status: "complete",
        inputs: { ...answers, business_id: businessId, brand_profile_id: brandProfile?.id || "", brand_snapshot: brandProfile || null },
        ...generated,
        model_version: 2,
      });
      setModel({ ...generated, id: saved.id });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (generationError) {
      console.error("Money Model generation failed:", generationError);
      const message = String(generationError?.message || "");
      if (/credit|quota|limit/i.test(message)) {
        setError("Your Money Model could not be generated because the account has reached its AI usage limit. Please try again in a few minutes.");
      } else if (/network|timeout|temporar/i.test(message)) {
        setError("The AI service did not respond in time. Your answers are still here—please try again.");
      } else {
        setError("Your Money Model could not be generated. Your answers are saved on this page—please try again.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyModel = async () => {
    await navigator.clipboard.writeText(JSON.stringify(model, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const createAsset = (target) => {
    const route = activateMoneyModel(model, answers, target, brandProfile);
    if (route) navigate(route);
  };

  if (loadingProfile) return <AppLayout><div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;

  if (model) return (
    <AppLayout>
      <PullToRefresh onRefresh={loadProfile}>
      <div className="min-h-screen hero-radial p-5 md:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">COMPLETE MONEY MODEL</Badge>
              <h1 className="font-display text-4xl md:text-5xl font-black text-foreground">{answers.business_name}</h1>
              <p className="text-muted-foreground mt-2">One connected path from attention to recurring revenue.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyModel}>{copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}{copied ? "Copied" : "Copy"}</Button>
              <Button onClick={() => { setModel(null); setStep(0); }}><RefreshCw className="w-4 h-4 mr-2" />New Model</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <SummaryCard icon={Target} label="Core Offer" value={model.core_offer?.name} sub={money(model.core_offer?.price)} />
            <SummaryCard icon={TrendingUp} label="Projected Revenue" value={money(model.revenue_projection?.total_monthly_revenue)} sub="Monthly model" />
            <SummaryCard icon={DollarSign} label="Continuity" value={model.continuity_offer?.name} sub={money(model.continuity_offer?.monthly_price) + "/month"} />
          </div>

          <ActivationPanel onCreate={createAsset} />

          <Section title="Dream Customer"><p>{model.dream_customer?.summary}</p><Pills values={model.dream_customer?.urgent_pains} /></Section>
          <div className="grid lg:grid-cols-2 gap-5">
            <OfferCard label="Attraction Offer" offer={model.attraction_offer} priceKey="price" />
            <OfferCard label="Core Offer" offer={model.core_offer} priceKey="price" />
          </div>
          <div className="grid lg:grid-cols-3 gap-5 mt-5">
            <ListOffers label="Upsells" offers={model.upsell_offers} />
            <ListOffers label="Downsells" offers={model.downsell_offers} />
            <OfferCard label="Continuity" offer={model.continuity_offer} priceKey="monthly_price" />
          </div>

          <Section title="Customer Journey">
            <div className="space-y-3">{model.customer_journey?.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-xl bg-secondary/40 border border-border">
                <div className="w-8 h-8 rounded-full accent-gradient text-white grid place-items-center font-black text-sm flex-shrink-0">{index + 1}</div>
                <div><h3 className="font-bold text-foreground">{item.stage}: {item.offer}</h3><p className="text-sm text-muted-foreground mt-1">{item.business_action}</p><p className="text-sm text-primary font-semibold mt-2">Measure: {item.success_metric}</p></div>
              </div>
            ))}</div>
          </Section>

          <Section title="Revenue Projection">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {model.revenue_projection?.revenue_by_stage?.map((item, index) => <div key={index} className="rounded-xl bg-secondary/40 p-4"><p className="text-sm text-muted-foreground">{item.stage}</p><p className="text-xl font-black text-foreground">{money(item.revenue)}</p></div>)}
            </div>
            <p className="text-sm text-muted-foreground">{model.revenue_projection?.capacity_warning}</p>
          </Section>

          <Section title="30 Day Launch Plan">
            <div className="grid md:grid-cols-2 gap-4">{model.launch_plan?.map((week) => (
              <div key={week.week} className="rounded-xl border border-border p-5"><p className="text-sm font-black text-primary">WEEK {week.week}</p><h3 className="font-bold text-foreground text-lg mt-1">{week.focus}</h3><Pills values={week.actions} /><p className="text-sm font-semibold mt-3">Milestone: {week.milestone}</p></div>
            ))}</div>
          </Section>

          <Section title="Executive Action Plan">
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <Callout label="Biggest Opportunity" value={model.executive_action_plan?.biggest_opportunity} />
              <Callout label="Biggest Risk" value={model.executive_action_plan?.biggest_risk} />
            </div>
            <h3 className="font-black text-foreground mb-3">Your Next Three Actions</h3>
            <div className="space-y-3">{model.executive_action_plan?.next_three_actions?.map((action, index) => <div key={index} className="flex gap-3 items-start p-4 rounded-xl bg-primary/5 border border-primary/15"><Check className="w-5 h-5 text-primary mt-0.5" /><p className="font-semibold text-foreground">{action}</p></div>)}</div>
          </Section>
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadProfile}>
      <div className="min-h-screen hero-radial p-5 md:p-10">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Link>
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">FLAGSHIP STRATEGY</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-black text-foreground">Build My Money Model</h1>
          <p className="text-muted-foreground mt-3 mb-6">Build your attraction, core, upsell, downsell, and continuity system around one customer journey.</p>

          {profileBusiness ? <div className="mb-6 rounded-2xl bg-[#111111] text-white p-5 md:p-6 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/15 grid place-items-center text-primary"><Building2 className="w-5 h-5" /></div>
                <div><p className="text-sm font-black tracking-[0.18em] text-primary uppercase">Shared Intelligence Loaded</p><h2 className="font-display font-extrabold text-lg mt-1">{profileBusiness.business_name}</h2><p className="text-sm text-white/50 mt-1">{profileBusiness.industry} · {profileBusiness.core_service}</p></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/70"><Check className="w-3.5 h-3.5 text-emerald-400" /> Business ready</span>
                <Link to="/BrandProfile" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/70 hover:border-primary/40 hover:text-white"><Palette className="w-3.5 h-3.5 text-primary" /> Brand {getBrandCompletion(brandProfile)}%</Link>
              </div>
            </div>
            {latestModel ? <div className="mt-5 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex items-center gap-3"><History className="w-4 h-4 text-white/45" /><div><p className="text-sm font-bold">A saved Money Model is available</p><p className="text-sm text-white/45">Open it instantly or continue to build a new version.</p></div></div><Button type="button" onClick={() => { setAnswers((current) => ({ ...current, ...(latestModel.inputs || {}) })); setModel(latestModel); }} className="bg-white text-black hover:bg-white/90">Open Latest Model</Button></div> : null}
          </div> : <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-5"><p className="font-bold text-amber-900 dark:text-amber-200">No Business Profile found</p><p className="text-sm text-amber-800 dark:text-amber-300 mt-1">You can continue here, or create your shared foundation first so the rest of the app can reuse it.</p><Link to="/BusinessFoundation" className="inline-flex items-center text-sm font-bold text-primary mt-3">Open Business Foundation <ArrowRight className="w-4 h-4 ml-1" /></Link></div>}

          <div className="flex gap-2 mb-8">{STEPS.map((item, index) => <div key={item.title} className={`h-2 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-border"}`} />)}</div>
          {error && <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <div className="light-card rounded-3xl p-6 md:p-8">
            <div className="flex items-start gap-4 mb-7">
              <div className="w-11 h-11 rounded-xl accent-gradient text-white grid place-items-center"><Sparkles className="w-5 h-5" /></div>
              <div><p className="text-sm font-black text-primary">STEP {step + 1} OF {STEPS.length}</p><h2 className="font-display text-2xl font-black text-foreground">{STEPS[step].title}</h2><p className="text-sm text-muted-foreground">{STEPS[step].subtitle}</p></div>
            </div>

            {step === 0 && <div className="space-y-4">
              <Field label="Business name" value={answers.business_name} onChange={(v) => update("business_name", v)} />
              <Field label="Industry or niche" value={answers.industry} onChange={(v) => update("industry", v)} />
              <Field label="What is your primary product or service?" value={answers.core_service} onChange={(v) => update("core_service", v)} area />
              <NumberField label="Target monthly revenue" value={answers.target_monthly_revenue} onChange={(v) => update("target_monthly_revenue", v)} />
            </div>}

            {step === 1 && <div className="space-y-4">
              <Field label="Who is your dream customer?" value={answers.target_customer} onChange={(v) => update("target_customer", v)} area />
              <Field label="What urgent problem are they trying to solve?" value={answers.primary_problem} onChange={(v) => update("primary_problem", v)} area />
              <Field label="What dream outcome do they want?" value={answers.dream_outcome} onChange={(v) => update("dream_outcome", v)} area />
              <Field label="What proof do you already have?" value={answers.proof_assets} onChange={(v) => update("proof_assets", v)} area optional />
            </div>}

            {step === 2 && <div className="grid sm:grid-cols-2 gap-4">
              <NumberField label="Current offer price" value={answers.current_price} onChange={(v) => update("current_price", v)} />
              <NumberField label="Monthly customers now" value={answers.current_monthly_customers} onChange={(v) => update("current_monthly_customers", v)} />
              <NumberField label="Estimated gross margin %" value={answers.gross_margin_percent} onChange={(v) => update("gross_margin_percent", v)} />
              <NumberField label="Monthly fulfillment capacity" value={answers.fulfillment_capacity} onChange={(v) => update("fulfillment_capacity", v)} />
            </div>}

            {step === 3 && <div className="space-y-5">
              <Field label="How do customers find you now?" value={answers.acquisition_channel} onChange={(v) => update("acquisition_channel", v)} area />
              <Choice label="Preferred attraction offer" value={answers.preferred_attraction} onChange={(v) => update("preferred_attraction", v)} options={[["lead-magnet","Free lead magnet"],["low-ticket","Low ticket offer"],["free-trial","Free trial or audit"]]} />
              <Choice label="Preferred continuity model" value={answers.continuity_preference} onChange={(v) => update("continuity_preference", v)} options={[["membership","Membership"],["retainer","Monthly retainer"],["subscription","Product subscription"]]} />
            </div>}

            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              {step < STEPS.length - 1 ? <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>Continue<ArrowRight className="w-4 h-4 ml-2" /></Button> :
                <Button onClick={generate} disabled={!canContinue || generating} className="accent-gradient text-white">{generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Architecting Your Model...</> : <><Zap className="w-4 h-4 mr-2" />Build My Money Model</>}</Button>}
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-5">Framework inspired. Your final pricing, claims, and guarantees should be reviewed for your business and industry.</p>
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}

function ActivationPanel({ onCreate }) {
  const assets = [
    { target: "lead_magnet", label: "Lead Magnet", description: "Open the Freebie Builder with the attraction and core offers loaded.", icon: Gift },
    { target: "offer_stack", label: "Offer Stack", description: "Open the Offer Ladder with attraction, core, and ascension pricing.", icon: Layers },
    { target: "funnel", label: "Funnel", description: "Prefill the complete customer journey for GoHighLevel execution.", icon: Map },
    { target: "sales_scripts", label: "Sales Scripts", description: "Turn stage messaging and objections into the sales workspace.", icon: Mic2 },
    { target: "launch_plan", label: "Launch Plan", description: "Activate the model inside the day by day launch workspace.", icon: Rocket },
    { target: "content", label: "Content Plan", description: "Open hooks, videos, stories, and email messaging from this model.", icon: FileText },
  ];

  return (
    <section className="rounded-3xl p-6 md:p-8 mb-6 bg-card border-2 border-primary/20 shadow-sm">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-xl accent-gradient text-white grid place-items-center flex-shrink-0"><Zap className="w-5 h-5" /></div>
        <div>
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">ACTIVATE YOUR MODEL</Badge>
          <h2 className="font-display font-black text-2xl text-foreground">Create the assets that make it real</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose an asset. Your business, customer, offers, pricing, and journey will travel with you automatically.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {assets.map(({ target, label, description, icon: Icon }) => (
          <button key={target} type="button" onClick={() => onCreate(target)}
            className="group text-left rounded-2xl border border-border p-4 hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center"><Icon className="w-5 h-5 text-primary" /></div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-black text-foreground">{label}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
            <p className="text-sm font-black text-primary mt-3">Create This Asset</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function Field({ label, value, onChange, area, optional }) {
  const Control = area ? Textarea : Input;
  return <div><label className="text-sm font-bold text-foreground">{label}{optional && <span className="font-normal text-muted-foreground"> (optional)</span>}</label><Control value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 bg-card" /></div>;
}
function NumberField({ label, value, onChange }) {
  return <div><label className="text-sm font-bold text-foreground">{label}</label><Input type="number" min="0" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 bg-card" /></div>;
}
function Choice({ label, value, onChange, options }) {
  return <div><label className="text-sm font-bold text-foreground">{label}</label><div className="grid sm:grid-cols-3 gap-2 mt-2">{options.map(([key, text]) => <button type="button" key={key} onClick={() => onChange(key)} className={`p-3 rounded-xl border text-sm font-semibold ${value === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{text}</button>)}</div></div>;
}
function SummaryCard({ icon: Icon, label, value, sub }) {
  return <div className="light-card rounded-2xl p-5"><Icon className="w-5 h-5 text-primary mb-3" /><p className="text-sm text-muted-foreground font-bold">{label}</p><p className="text-xl font-black text-foreground mt-1">{value || "Not set"}</p><p className="text-sm text-primary font-semibold mt-1">{sub}</p></div>;
}
function Section({ title, children }) {
  return <section className="light-card rounded-2xl p-6 mt-5"><h2 className="font-display font-black text-2xl text-foreground mb-4">{title}</h2><div className="text-muted-foreground">{children}</div></section>;
}
function Pills({ values = [] }) {
  return <div className="flex flex-wrap gap-2 mt-3">{values?.map((value, index) => <span key={index} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">{value}</span>)}</div>;
}
function OfferCard({ label, offer, priceKey }) {
  return <div className="light-card rounded-2xl p-6"><p className="text-sm font-black text-primary">{label.toUpperCase()}</p><h3 className="text-xl font-black text-foreground mt-2">{offer?.name}</h3><p className="text-sm text-muted-foreground mt-2">{offer?.promise || offer?.recurring_value || offer?.value_justification}</p><p className="text-2xl font-black text-foreground mt-4">{money(offer?.[priceKey])}{priceKey === "monthly_price" && <span className="text-sm text-muted-foreground">/mo</span>}</p></div>;
}
function ListOffers({ label, offers = [] }) {
  return <div className="light-card rounded-2xl p-6"><p className="text-sm font-black text-primary">{label.toUpperCase()}</p><div className="space-y-4 mt-3">{offers?.map((offer, index) => <div key={index} className="pb-4 border-b border-border last:border-0 last:pb-0"><h3 className="font-bold text-foreground">{offer.name}</h3><p className="text-sm text-muted-foreground mt-1">{offer.purpose || offer.positioning}</p><p className="font-black text-primary mt-2">{money(offer.price)}</p></div>)}</div></div>;
}
function Callout({ label, value }) {
  return <div className="rounded-xl p-5 bg-secondary/50 border border-border"><p className="text-sm font-black text-primary">{label}</p><p className="text-foreground font-semibold mt-2">{value}</p></div>;
}