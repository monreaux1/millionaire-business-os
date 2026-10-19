import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, ArrowRight, ArrowLeft, Zap, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  getLatestBusinessProfile,
  mergeProfileIntoIntake,
  saveUnifiedBusinessProfile,
} from "@/lib/business-profile";
import { accountStorage } from "@/lib/account-storage";
import PullToRefresh from "@/components/PullToRefresh";

const DEPLOY_OPTIONS = [
  { value: "gohighlevel", label: "Go High Level", icon: "🔶" },
  { value: "base44", label: "Hosted in the app", icon: "🔵" },
  { value: "taxnitro", label: "Tax Nitro", icon: "🟢" },
  { value: "export", label: "Export Copy", icon: "📄" },
];

const TIER_OPTIONS = [
  { value: "all", label: "All Three (Low + Mid + High)" },
  { value: "low", label: "Low Ticket Only ($27–$297)" },
  { value: "mid", label: "Mid Ticket Only ($497–$2,997)" },
  { value: "high", label: "High Ticket Only ($5K+)" },
];

export default function IdeaIntake() {
  const navigate = useNavigate();
  const savedDraft = (() => { try { return JSON.parse(accountStorage.getItem("ideaIntakeDraft") || "null"); } catch { return null; } })();
  const [step, setStep] = useState(savedDraft?.step ?? 0);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState(null);

  const [intake, setIntake] = useState({
    business_id: savedDraft?.intake?.business_id || "",
    business_name: savedDraft?.intake?.business_name || "",
    industry: savedDraft?.intake?.industry || "",
    what: savedDraft?.intake?.what || "",
    who: savedDraft?.intake?.who || "",
    problem: savedDraft?.intake?.problem || "",
    result: savedDraft?.intake?.result || "",
    current_revenue: savedDraft?.intake?.current_revenue ?? 0,
    desired_revenue: savedDraft?.intake?.desired_revenue ?? 0,
    business_stage: savedDraft?.intake?.business_stage || "idea",
    acquisition_method: savedDraft?.intake?.acquisition_method || "",
    existing_recurring_revenue: savedDraft?.intake?.existing_recurring_revenue ?? 0,
    tiers: savedDraft?.intake?.tiers || "all",
    platform: savedDraft?.intake?.platform || "gohighlevel",
  });

  useEffect(() => {
    accountStorage.setItem("ideaIntakeDraft", JSON.stringify({ step, intake }));
  }, [step, intake]);

  const loadProfilePrefill = async () => {
    try {
      const business = await getLatestBusinessProfile();
      if (business) {
        setIntake((current) => mergeProfileIntoIntake(current, business));
      }
    } catch (profileError) {
      console.warn("Business profile prefill unavailable:", profileError);
    }
  };

  useEffect(() => { loadProfilePrefill(); }, []);

  const questions = [
    { key: "what", label: "What are you launching?", placeholder: "e.g. A mentorship program for new real estate agents", type: "textarea" },
    { key: "who", label: "Who is it for?", placeholder: "e.g. New agents in their first 2 years who haven't closed a deal", type: "input" },
    { key: "problem", label: "What problem does it solve?", placeholder: "e.g. They don't know how to find clients or close deals", type: "input" },
    { key: "result", label: "What result does the customer get?", placeholder: "e.g. Close their first deal within 90 days", type: "input" },
  ];

  const currentQ = questions[step];
  const isLastQuestion = step === questions.length - 1;

  const buildSystem = async () => {
    setIsBuilding(true);
    setError(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are a world-class business strategist. Build a COMPLETE business launch system.

BUSINESS NAME: "${intake.business_name || intake.what}"
INDUSTRY: "${intake.industry || "Not specified"}"
BUSINESS IDEA: "${intake.what}"
TARGET AUDIENCE: "${intake.who}"
PROBLEM SOLVED: "${intake.problem}"
CUSTOMER RESULT: "${intake.result}"
CURRENT MONTHLY REVENUE: $${intake.current_revenue || 0}
TARGET MONTHLY REVENUE: $${intake.desired_revenue || 0}
BUSINESS STAGE: ${intake.business_stage}
CURRENT CUSTOMER ACQUISITION: "${intake.acquisition_method || "Not specified"}"
CURRENT RECURRING REVENUE: $${intake.existing_recurring_revenue || 0}
OFFER TIERS: ${intake.tiers}
DEPLOYMENT: ${intake.platform}

Generate a complete launch system with:

1. OFFER LADDER: Three offers (low/mid/high ticket). Each includes: name, price, whats_included (array), quick_win, order_bump, delivery_format, guarantee.

2. FREEBIE STRATEGY: 3 freebie options (each: type, title, description). Plus best_pick (title) and best_pick_reason.

3. FUNNEL MAP: funnel_type, steps array (each: page, headline, subheadline, cta, sections array), deployment_notes for ${intake.platform}.

4. LAUNCH PLAN: 7 days. Each: day (number), theme, hook, cta.

5. CONTENT PLAN: hooks (5 strings), video_scripts (3 objects: title + script), carousel_ideas (3 strings), story_posts (2 strings), email_outline (string).

6. SALES SYSTEM: discovery_call_script, dm_script, price_objections (3 strings), think_about_it (string), closing_statement (string).

Use the actual business idea and audience throughout. Make it extremely specific and ready to execute.`,
        response_json_schema: {
          type: "object",
          properties: {
            offer_ladder: {
              type: "object",
              properties: {
                low_ticket: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, whats_included: { type: "array", items: { type: "string" } }, quick_win: { type: "string" }, order_bump: { type: "string" }, delivery_format: { type: "string" }, guarantee: { type: "string" } } },
                mid_ticket: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, whats_included: { type: "array", items: { type: "string" } }, quick_win: { type: "string" }, order_bump: { type: "string" }, delivery_format: { type: "string" }, guarantee: { type: "string" } } },
                high_ticket: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, whats_included: { type: "array", items: { type: "string" } }, quick_win: { type: "string" }, order_bump: { type: "string" }, delivery_format: { type: "string" }, guarantee: { type: "string" } } },
              }
            },
            freebie_strategy: {
              type: "object",
              properties: {
                options: { type: "array", items: { type: "object", properties: { type: { type: "string" }, title: { type: "string" }, description: { type: "string" } } } },
                best_pick: { type: "string" },
                best_pick_reason: { type: "string" }
              }
            },
            funnel_map: {
              type: "object",
              properties: {
                funnel_type: { type: "string" },
                steps: { type: "array", items: { type: "object", properties: { page: { type: "string" }, headline: { type: "string" }, subheadline: { type: "string" }, cta: { type: "string" }, sections: { type: "array", items: { type: "string" } } } } },
                deployment_notes: { type: "string" }
              }
            },
            launch_plan: { type: "array", items: { type: "object", properties: { day: { type: "number" }, theme: { type: "string" }, hook: { type: "string" }, cta: { type: "string" } } } },
            content_plan: {
              type: "object",
              properties: {
                hooks: { type: "array", items: { type: "string" } },
                video_scripts: { type: "array", items: { type: "object", properties: { title: { type: "string" }, script: { type: "string" } } } },
                carousel_ideas: { type: "array", items: { type: "string" } },
                story_posts: { type: "array", items: { type: "string" } },
                email_outline: { type: "string" }
              }
            },
            sales_system: {
              type: "object",
              properties: {
                discovery_call_script: { type: "string" },
                dm_script: { type: "string" },
                price_objections: { type: "array", items: { type: "string" } },
                think_about_it: { type: "string" },
                closing_statement: { type: "string" }
              }
            }
          }
        }
      });

      const launchData = result.response || result;
      let synchronizedIntake = intake;

      try {
        const business = await saveUnifiedBusinessProfile(intake, launchData);
        synchronizedIntake = { ...intake, business_id: business.id };
        setIntake(synchronizedIntake);
      } catch (profileError) {
        console.warn("Launch generated, but the shared business profile did not sync:", profileError);
      }

      accountStorage.setItem("launchSystem", JSON.stringify({
        intake: synchronizedIntake,
        result: launchData,
        business_id: synchronizedIntake.business_id || null,
        profile_version: 2,
      }));
      navigate("/OfferLadder");
    } catch (err) {
      console.error(err);
      setError("Build failed. Please try again.");
    }
    setIsBuilding(false);
  };

  const next = () => {
    if (isLastQuestion) return;
    setStep(s => s + 1);
  };

  const canProceed = intake[currentQ?.key]?.trim().length > 3;

  // Final review step
  if (step === questions.length) {
    return (
      <AppLayout>
        <PullToRefresh onRefresh={loadProfilePrefill}>
        <div className="p-6 md:p-10 max-w-3xl mx-auto hero-radial min-h-screen">
          <div className="mb-8">
            <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">STEP 5 OF 6</Badge>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">Configure Your Launch</h1>
            <p className="text-muted-foreground">Choose your offer tiers and deployment platform.</p>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

          <div className="space-y-6">
            <div className="light-card rounded-2xl p-6">
              <div className="mb-5">
                <h3 className="text-foreground font-bold">Your Shared Business Profile</h3>
                <p className="text-muted-foreground text-sm mt-1">Saved once and used across your strategy, offer, funnel, and launch tools.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Business name</label>
                  <Input
                    value={intake.business_name}
                    onChange={e => setIntake({ ...intake, business_name: e.target.value })}
                    placeholder="Your business or brand name"
                    className="mt-1 bg-card"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Industry or niche</label>
                  <Input
                    value={intake.industry}
                    onChange={e => setIntake({ ...intake, industry: e.target.value })}
                    placeholder="e.g. Tax, credit, coaching"
                    className="mt-1 bg-card"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Current monthly revenue</label>
                  <Input
                    type="number"
                    min="0"
                    value={intake.current_revenue}
                    onChange={e => setIntake({ ...intake, current_revenue: Number(e.target.value) })}
                    className="mt-1 bg-card"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Target monthly revenue</label>
                  <Input
                    type="number"
                    min="0"
                    value={intake.desired_revenue}
                    onChange={e => setIntake({ ...intake, desired_revenue: Number(e.target.value) })}
                    className="mt-1 bg-card"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Business stage</label>
                  <Select
                    value={intake.business_stage}
                    onValueChange={(value) => setIntake({ ...intake, business_stage: value })}
                  >
                    <SelectTrigger className="mt-1 w-full h-11 rounded-md border border-border bg-card px-3 text-sm text-foreground">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="growing">Growing</SelectItem>
                      <SelectItem value="established">Established</SelectItem>
                      <SelectItem value="scaling">Scaling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Monthly recurring revenue</label>
                  <Input
                    type="number"
                    min="0"
                    value={intake.existing_recurring_revenue}
                    onChange={e => setIntake({ ...intake, existing_recurring_revenue: Number(e.target.value) })}
                    className="mt-1 bg-card"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground">How do customers find you now?</label>
                  <Input
                    value={intake.acquisition_method}
                    onChange={e => setIntake({ ...intake, acquisition_method: e.target.value })}
                    placeholder="e.g. Referrals, Facebook group, paid ads"
                    className="mt-1 bg-card"
                  />
                </div>
              </div>
            </div>

            <div className="light-card rounded-2xl p-6">
              <h3 className="text-foreground font-bold mb-4">Which offer tiers do you want?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIER_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setIntake({ ...intake, tiers: opt.value })}
                    className={`p-4 rounded-xl border text-left transition-all ${intake.tiers === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}>
                    <p className="font-semibold text-sm">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="light-card rounded-2xl p-6">
              <h3 className="text-foreground font-bold mb-4">Where do you want to deploy your funnel?</h3>
              <div className="grid grid-cols-2 gap-3">
                {DEPLOY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setIntake({ ...intake, platform: opt.value })}
                    className={`p-4 rounded-xl border text-center transition-all ${intake.platform === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <p className={`text-sm font-semibold ${intake.platform === opt.value ? 'text-primary' : 'text-muted-foreground'}`}>{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={buildSystem}
              disabled={isBuilding || !intake.business_name.trim() || !intake.industry.trim()}
              className="w-full accent-gradient text-white font-black text-lg py-5 h-auto rounded-xl hover:opacity-90"
            >
              {isBuilding ? (
                <><Loader2 className="w-5 h-5 mr-3 animate-spin" />Building Your Complete Launch System...</>
              ) : (
                <><Zap className="w-5 h-5 mr-3" />Build My Business Launch<ArrowRight className="w-5 h-5 ml-3" /></>
              )}
            </Button>
            {isBuilding && <p className="text-center text-muted-foreground text-sm">This takes 20–30 seconds. Generating offers, funnel, content & sales scripts...</p>}
          </div>
        </div>
        </PullToRefresh>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadProfilePrefill}>
      <div className="p-6 md:p-10 max-w-3xl mx-auto hero-radial min-h-screen">
        <div className="mb-8">
          <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">
            STEP {step + 1} OF 6
          </Badge>
          <h1 className="font-display text-3xl font-black text-foreground mb-2">Idea Intake</h1>
          <p className="text-muted-foreground">Answer a few questions. Get your complete launch system.</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[...questions, { key: "config" }, { key: "build" }].map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>

        <div className="light-card rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-foreground font-bold text-xl">{currentQ.label}</h2>
          </div>

          {currentQ.type === "textarea" ? (
            <Textarea
              value={intake[currentQ.key]}
              onChange={e => setIntake({ ...intake, [currentQ.key]: e.target.value })}
              placeholder={currentQ.placeholder}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground text-base resize-none h-28 focus:border-primary/50"
              onKeyDown={e => { if (e.key === "Enter" && e.metaKey && canProceed) { isLastQuestion ? setStep(step + 1) : next(); } }}
            />
          ) : (
            <Input
              value={intake[currentQ.key]}
              onChange={e => setIntake({ ...intake, [currentQ.key]: e.target.value })}
              placeholder={currentQ.placeholder}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground text-base h-12 focus:border-primary/50"
              onKeyDown={e => { if (e.key === "Enter" && canProceed) { isLastQuestion ? setStep(step + 1) : next(); } }}
            />
          )}

          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed}
              className="accent-gradient text-white font-bold px-6 py-2 h-auto rounded-lg hover:opacity-90">
              {isLastQuestion ? "Configure Launch" : "Next"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}