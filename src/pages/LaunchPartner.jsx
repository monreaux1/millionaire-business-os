import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Rocket, Zap, ChevronRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import AppLayout from "@/components/AppLayout";
import { accountStorage } from "@/lib/account-storage";

const STEPS = [
  { id: 1, label: "Idea Intake" },
  { id: 2, label: "Offer Ladder" },
  { id: 3, label: "Freebie Strategy" },
  { id: 4, label: "Funnel Map" },
  { id: 5, label: "Launch Plan" },
  { id: 6, label: "Content & Sales" },
];

const DEPLOY_OPTIONS = [
  { value: "gohighlevel", label: "Go High Level", icon: "🔶" },
  { value: "base44", label: "Hosted in the app", icon: "🔵" },
  { value: "taxnitro", label: "Tax Nitro", icon: "🟢" },
  { value: "export", label: "Export Copy Only", icon: "📄" },
];

export default function LaunchPartner() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // 0 = intake form
  const [isBuilding, setIsBuilding] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("offers");

  const [intake, setIntake] = useState({
    what: "",
    who: "",
    problem: "",
    result: "",
    tiers: "all",
    platform: "gohighlevel",
  });

  const buildLaunchSystem = async () => {
    if (!intake.what || !intake.who) return;
    setIsBuilding(true);
    setError(null);
    try {
      const prompt = `You are a world-class business strategist who specializes in turning one idea into a complete revenue system. 
      
A user wants to launch: "${intake.what}"
Target audience: "${intake.who}"
Problem it solves: "${intake.problem}"
Result customer gets: "${intake.result}"
Offer tiers requested: ${intake.tiers}
Deployment platform: ${intake.platform}

Build a COMPLETE business launch system with:

1. OFFER LADDER — 3 ticket tiers (low, mid, high) each with:
   - Product name, price, what's included, quick win promise, order bump idea, delivery format, guarantee

2. FREEBIE STRATEGY — 3 freebie options, each with:
   - Type (checklist/PDF/mini training/quiz/challenge/workbook/template), title, description
   - Recommend which freebie is BEST for this offer and why

3. FUNNEL MAP — based on the offer type, provide:
   - Recommended funnel type (e.g. "Low Ticket Funnel", "VSL Funnel", "Challenge Funnel")
   - Funnel steps in order (headline, subheadline, CTA, each page section, upsell, thank you)
   - Deployment notes for ${intake.platform}

4. 7-DAY LAUNCH BATTLE PLAN — day by day:
   - Day theme, content hook, primary CTA

5. CONTENT PLAN — provide:
   - 5 scroll-stopping hooks
   - 3 short-form video scripts (title + 3-sentence script)
   - 3 carousel post ideas
   - 2 story posts
   - 1 email newsletter outline

6. SALES SYSTEM — provide:
   - Discovery call script (opening, qualifying questions, close)
   - DM outreach script
   - Top 3 price objection responses
   - "I need to think about it" response
   - Closing statement

Be extremely specific and use the actual business idea and audience throughout. Make it ready to execute.`;

      const data = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            offer_ladder: {
              type: "object",
              properties: {
                low_ticket: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "string" },
                    whats_included: { type: "array", items: { type: "string" } },
                    quick_win: { type: "string" },
                    order_bump: { type: "string" },
                    delivery: { type: "string" },
                    guarantee: { type: "string" }
                  }
                },
                mid_ticket: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "string" },
                    whats_included: { type: "array", items: { type: "string" } },
                    quick_win: { type: "string" },
                    order_bump: { type: "string" },
                    delivery: { type: "string" },
                    guarantee: { type: "string" }
                  }
                },
                high_ticket: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "string" },
                    whats_included: { type: "array", items: { type: "string" } },
                    quick_win: { type: "string" },
                    order_bump: { type: "string" },
                    delivery: { type: "string" },
                    guarantee: { type: "string" }
                  }
                }
              }
            },
            freebie_strategy: {
              type: "object",
              properties: {
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      title: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                },
                best_pick: { type: "string" },
                best_pick_reason: { type: "string" }
              }
            },
            funnel_map: {
              type: "object",
              properties: {
                funnel_type: { type: "string" },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      page: { type: "string" },
                      headline: { type: "string" },
                      subheadline: { type: "string" },
                      cta: { type: "string" },
                      sections: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                deployment_notes: { type: "string" }
              }
            },
            launch_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  theme: { type: "string" },
                  hook: { type: "string" },
                  cta: { type: "string" }
                }
              }
            },
            content_plan: {
              type: "object",
              properties: {
                hooks: { type: "array", items: { type: "string" } },
                video_scripts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      script: { type: "string" }
                    }
                  }
                },
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

      setResult(data);
      setCurrentStep(1);
      try {
        accountStorage.setItem("launchPartnerDraft", JSON.stringify({ intake, result: data, currentStep: 1, activeTab: "offers" }));
      } catch (storageErr) {
        console.warn("Launch draft could not be saved", storageErr);
      }
    } catch (err) {
      console.error(err);
      setError("Build failed. Try again.");
    }
    setIsBuilding(false);
  };

  const reloadLaunchData = () => {
    try {
      const stored = accountStorage.getItem("launchPartnerDraft");
      if (!stored) return;
      const draft = JSON.parse(stored);
      if (draft.intake) setIntake(draft.intake);
      // Reload saved data without resetting the wizard's current step or result.
      if (!result && draft.result) {
        setResult(draft.result);
        setCurrentStep(draft.currentStep || 1);
        setActiveTab(draft.activeTab || "offers");
      }
    } catch (err) {
      console.warn("Launch data could not be reloaded", err);
    }
  };

  const tabs = [
    { id: "offers", label: "💎 Offers" },
    { id: "freebie", label: "🎁 Freebie" },
    { id: "funnel", label: "🗺️ Funnel" },
    { id: "launch", label: "🚀 Launch Plan" },
    { id: "content", label: "📱 Content" },
    { id: "sales", label: "💰 Sales" },
  ];

  return (
    <AppLayout>
      <PullToRefresh onRefresh={reloadLaunchData}>
      <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {currentStep > 0 && (
            <Button variant="ghost" onClick={() => { setCurrentStep(0); setResult(null); }} className="text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Start Over
            </Button>
          )}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-400 rounded-xl">
              <Rocket className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">LAUNCH PARTNER MODE</h1>
              <p className="text-yellow-400 font-semibold">One idea → Complete revenue system in minutes</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {/* INTAKE FORM */}
        {currentStep === 0 && (
          <Card className="dark-card border-yellow-400">
            <CardHeader>
              <CardTitle className="text-yellow-400 font-black text-2xl">TELL ME WHAT YOU'RE LAUNCHING</CardTitle>
              <p className="text-muted-foreground">Answer 6 questions. Get a complete business launch system.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-foreground font-bold text-sm mb-2 block">1. What are you launching?</label>
                <Textarea
                  value={intake.what}
                  onChange={(e) => setIntake({ ...intake, what: e.target.value })}
                  className="bg-card border-border text-foreground"
                  placeholder="e.g. I'm starting a mentorship for new real estate agents"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-foreground font-bold text-sm mb-2 block">2. Who is it for?</label>
                <Input
                  value={intake.who}
                  onChange={(e) => setIntake({ ...intake, who: e.target.value })}
                  className="bg-card border-border text-foreground"
                  placeholder="e.g. New agents in their first 2 years who haven't closed a deal yet"
                />
              </div>
              <div>
                <label className="text-foreground font-bold text-sm mb-2 block">3. What problem does it solve?</label>
                <Input
                  value={intake.problem}
                  onChange={(e) => setIntake({ ...intake, problem: e.target.value })}
                  className="bg-card border-border text-foreground"
                  placeholder="e.g. They don't know how to find clients or close deals"
                />
              </div>
              <div>
                <label className="text-foreground font-bold text-sm mb-2 block">4. What result does the customer get?</label>
                <Input
                  value={intake.result}
                  onChange={(e) => setIntake({ ...intake, result: e.target.value })}
                  className="bg-card border-border text-foreground"
                  placeholder='e.g. "Close their first deal within 90 days"'
                />
              </div>
              <div>
                <label className="text-foreground font-bold text-sm mb-2 block">5. Which offer tiers do you want?</label>
                <Select value={intake.tiers} onValueChange={(v) => setIntake({ ...intake, tiers: v })}>
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="all">All Three (Low + Mid + High)</SelectItem>
                    <SelectItem value="low">Low Ticket Only ($27–$297)</SelectItem>
                    <SelectItem value="mid">Mid Ticket Only ($497–$2,997)</SelectItem>
                    <SelectItem value="high">High Ticket Only ($5K–$50K+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-foreground font-bold text-sm mb-2 block">6. Where do you want to deploy your funnel?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DEPLOY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setIntake({ ...intake, platform: opt.value })}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${intake.platform === opt.value ? 'border-yellow-400 bg-yellow-400 bg-opacity-10' : 'border-border bg-card hover:border-foreground/40'}`}
                    >
                      <div className="text-2xl mb-1">{opt.icon}</div>
                      <div className={`text-sm font-bold ${intake.platform === opt.value ? 'text-yellow-400' : 'text-foreground/80'}`}>{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={buildLaunchSystem}
                disabled={isBuilding || !intake.what || !intake.who}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black text-xl py-6"
              >
                {isBuilding ? (
                  <><Loader2 className="w-6 h-6 mr-3 animate-spin" />BUILDING YOUR LAUNCH SYSTEM...</>
                ) : (
                  <><Zap className="w-6 h-6 mr-3" />BUILD MY BUSINESS LAUNCH<ChevronRight className="w-6 h-6 ml-3" /></>
                )}
              </Button>
              {isBuilding && (
                <p className="text-center text-muted-foreground text-sm">This takes 20–30 seconds. We're building offers, funnels, content, sales scripts and your launch plan simultaneously.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* RESULTS */}
        {currentStep > 0 && result && (
          <div className="space-y-6">
            {/* Summary Banner */}
            <Card className="dark-card border-yellow-400 bg-yellow-400 bg-opacity-5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h2 className="text-foreground font-black text-2xl">YOUR LAUNCH SYSTEM IS READY</h2>
                    <p className="text-muted-foreground">{intake.what} → {intake.who} → Deployed on {DEPLOY_OPTIONS.find(d => d.value === intake.platform)?.label}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Offer Ladder", "Freebie Strategy", "Funnel Map", "7-Day Launch Plan", "Content Plan", "Sales Scripts"].map(tag => (
                    <Badge key={tag} className="bg-yellow-400 text-black font-bold">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-yellow-400 text-black' : 'bg-card text-foreground/80 hover:bg-secondary'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* OFFERS TAB */}
            {activeTab === "offers" && result.offer_ladder && (
              <div className="space-y-4">
                {[
                  { key: "low_ticket", label: "LOW TICKET", badge: "bg-blue-600", border: "border-blue-500", text: "text-blue-400", desc: "Entry Point • Fast Win • Ecosystem Builder" },
                  { key: "mid_ticket", label: "MID TICKET", badge: "bg-green-600", border: "border-green-500", text: "text-green-400", desc: "Core Transformation • Main Revenue Driver" },
                  { key: "high_ticket", label: "HIGH TICKET", badge: "bg-yellow-500 text-black", border: "border-yellow-400", text: "text-yellow-400", desc: "Premium DFY • Application Only • Max LTV" },
                ].map(({ key, label, badge, border, text, desc }) => {
                  const offer = result.offer_ladder[key];
                  if (!offer) return null;
                  return (
                    <Card key={key} className={`dark-card ${border}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Badge className={`${badge} font-bold`}>{label}</Badge>
                            <span className="text-muted-foreground text-sm">{desc}</span>
                          </div>
                          <span className={`font-black text-2xl ${text}`}>{offer.price}</span>
                        </div>
                        <h3 className="text-foreground font-black text-xl mb-3">{offer.name}</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-muted-foreground text-sm font-bold uppercase mb-2">What's Included</p>
                            <ul className="space-y-1">
                              {offer.whats_included?.map((item, i) => (
                                <li key={i} className="text-foreground/80 text-sm flex items-start gap-2">
                                  <span className="text-yellow-400 mt-0.5">✓</span>{item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <div className="p-3 bg-card rounded">
                              <p className="text-yellow-400 text-sm font-bold mb-1">QUICK WIN PROMISE</p>
                              <p className="text-foreground/80 text-sm">{offer.quick_win}</p>
                            </div>
                            <div className="p-3 bg-card rounded">
                              <p className="text-purple-400 text-sm font-bold mb-1">ORDER BUMP</p>
                              <p className="text-foreground/80 text-sm">{offer.order_bump}</p>
                            </div>
                            <div className="p-3 bg-card rounded">
                              <p className="text-blue-400 text-sm font-bold mb-1">DELIVERY FORMAT</p>
                              <p className="text-foreground/80 text-sm">{offer.delivery}</p>
                            </div>
                            <div className="p-3 bg-green-900 bg-opacity-30 border border-green-600 rounded">
                              <p className="text-green-400 text-sm font-bold mb-1">🛡️ GUARANTEE</p>
                              <p className="text-foreground/80 text-sm">{offer.guarantee}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* FREEBIE TAB */}
            {activeTab === "freebie" && result.freebie_strategy && (
              <div className="space-y-4">
                {result.freebie_strategy.best_pick && (
                  <Card className="dark-card border-yellow-400 bg-yellow-400 bg-opacity-5">
                    <CardContent className="p-5">
                      <p className="text-yellow-400 font-black text-lg mb-1">⭐ BEST PICK: {result.freebie_strategy.best_pick}</p>
                      <p className="text-foreground/80">{result.freebie_strategy.best_pick_reason}</p>
                    </CardContent>
                  </Card>
                )}
                <div className="grid md:grid-cols-3 gap-4">
                  {result.freebie_strategy.options?.map((opt, i) => (
                    <Card key={i} className={`dark-card border-border ${result.freebie_strategy.best_pick === opt.title ? 'border-yellow-400' : ''}`}>
                      <CardContent className="p-5">
                        <Badge className="bg-purple-700 text-primary-foreground mb-3">{opt.type}</Badge>
                        <h3 className="text-foreground font-bold mb-2">{opt.title}</h3>
                        <p className="text-muted-foreground text-sm">{opt.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* FUNNEL TAB */}
            {activeTab === "funnel" && result.funnel_map && (
              <div className="space-y-4">
                <Card className="dark-card border-blue-500">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-blue-400 text-sm font-bold uppercase">Funnel Type</p>
                        <h3 className="text-foreground font-black text-xl">{result.funnel_map.funnel_type}</h3>
                      </div>
                      <Badge className={`font-bold ${DEPLOY_OPTIONS.find(d => d.value === intake.platform)?.label ? 'bg-orange-600 text-primary-foreground' : 'bg-gray-600 text-primary-foreground'}`}>
                        {DEPLOY_OPTIONS.find(d => d.value === intake.platform)?.icon} {DEPLOY_OPTIONS.find(d => d.value === intake.platform)?.label}
                      </Badge>
                    </div>
                    <div className="p-3 bg-card rounded mb-4">
                      <p className="text-yellow-400 text-sm font-bold mb-1">DEPLOYMENT NOTES</p>
                      <p className="text-foreground/80 text-sm">{result.funnel_map.deployment_notes}</p>
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-3">
                  {result.funnel_map.steps?.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-yellow-400 text-black rounded-full flex items-center justify-center font-black">{i + 1}</div>
                      <Card className="dark-card border-border flex-1">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-yellow-400 font-bold">{step.page}</h4>
                            <Badge className="bg-secondary text-foreground/80 text-sm">{step.cta}</Badge>
                          </div>
                          <p className="text-foreground font-semibold mb-1">{step.headline}</p>
                          <p className="text-muted-foreground text-sm mb-2">{step.subheadline}</p>
                          {step.sections?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {step.sections.map((s, si) => (
                                <Badge key={si} className="bg-card text-muted-foreground text-sm">{s}</Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LAUNCH PLAN TAB */}
            {activeTab === "launch" && result.launch_plan && (
              <div className="space-y-3">
                {result.launch_plan.map((day, i) => (
                  <Card key={i} className="dark-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-yellow-400 text-black rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold">DAY</span>
                          <span className="font-black text-lg">{day.day}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-foreground font-black mb-1">{day.theme}</h4>
                          <p className="text-foreground/80 text-sm mb-2">"{day.hook}"</p>
                          <Badge className="bg-green-700 text-primary-foreground text-sm">CTA: {day.cta}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* CONTENT TAB */}
            {activeTab === "content" && result.content_plan && (
              <div className="space-y-6">
                <Card className="dark-card border-blue-500">
                  <CardHeader><CardTitle className="text-blue-400 font-bold">🪝 SCROLL-STOPPING HOOKS</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {result.content_plan.hooks?.map((hook, i) => (
                      <div key={i} className="p-3 bg-card rounded flex items-start gap-3">
                        <span className="text-yellow-400 font-black">{i + 1}.</span>
                        <p className="text-foreground font-semibold">{hook}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="dark-card border-red-500">
                  <CardHeader><CardTitle className="text-red-400 font-bold">🎥 SHORT FORM VIDEO SCRIPTS</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {result.content_plan.video_scripts?.map((v, i) => (
                      <div key={i} className="p-4 bg-card rounded">
                        <p className="text-yellow-400 font-bold mb-2">{v.title}</p>
                        <p className="text-foreground/80 text-sm whitespace-pre-wrap">{v.script}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="dark-card border-purple-500">
                  <CardHeader><CardTitle className="text-purple-400 font-bold">📊 CAROUSEL IDEAS</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {result.content_plan.carousel_ideas?.map((idea, i) => (
                      <div key={i} className="p-3 bg-card rounded text-foreground/80 text-sm">{i + 1}. {idea}</div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="dark-card border-green-500">
                  <CardHeader><CardTitle className="text-green-400 font-bold">📨 EMAIL NEWSLETTER OUTLINE</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-foreground/80 text-sm whitespace-pre-wrap">{result.content_plan.email_outline}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SALES TAB */}
            {activeTab === "sales" && result.sales_system && (
              <div className="space-y-4">
                <Card className="dark-card border-yellow-400">
                  <CardHeader><CardTitle className="text-yellow-400 font-bold">📞 DISCOVERY CALL SCRIPT</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-foreground/80 text-sm whitespace-pre-wrap">{result.sales_system.discovery_call_script}</p>
                  </CardContent>
                </Card>
                <Card className="dark-card border-blue-500">
                  <CardHeader><CardTitle className="text-blue-400 font-bold">💬 DM OUTREACH SCRIPT</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-foreground/80 text-sm whitespace-pre-wrap">{result.sales_system.dm_script}</p>
                  </CardContent>
                </Card>
                <Card className="dark-card border-red-500">
                  <CardHeader><CardTitle className="text-red-400 font-bold">💸 PRICE OBJECTION RESPONSES</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {result.sales_system.price_objections?.map((obj, i) => (
                      <div key={i} className="p-4 bg-red-900 bg-opacity-20 border border-red-700 rounded">
                        <p className="text-foreground/80 text-sm">{obj}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="dark-card border-orange-500">
                  <CardHeader><CardTitle className="text-orange-400 font-bold">⏳ "I NEED TO THINK ABOUT IT" RESPONSE</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-foreground/80 text-sm whitespace-pre-wrap">{result.sales_system.think_about_it}</p>
                  </CardContent>
                </Card>
                <Card className="dark-card border-green-500">
                  <CardHeader><CardTitle className="text-green-400 font-bold">🏆 CLOSING STATEMENT</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-foreground font-semibold text-base italic">"{result.sales_system.closing_statement}"</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}