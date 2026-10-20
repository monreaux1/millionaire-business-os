import React, { useState, useEffect } from "react";
import { Business, Strategy } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, ArrowLeft, Zap, DollarSign, Target, AlertCircle } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import AppLayout from "@/components/AppLayout";

export default function StrategyGenerator() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [generatedStrategy, setGeneratedStrategy] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    setError(null);
    try {
      const data = await Business.list("-created_date");
      setBusinesses(data);
      if (data.length > 0) {
        setSelectedBusiness(data[0]);
      }
    } catch (err) {
        console.error("Failed to load businesses:", err);
        setError("Could not load your businesses. Please try again later.");
    }
  };

  const generateStrategy = async () => {
    if (!selectedBusiness) return;

    setIsGenerating(true);
    setError(null);
    try {
      const prompt = `
You are an elite business strategist and offer architect. Create a comprehensive, practical strategy for this business.

BUSINESS CONTEXT:
- Name: ${selectedBusiness.business_name}
- Industry: ${selectedBusiness.industry}
- Core Service: ${selectedBusiness.core_service}
- Target Avatar: ${selectedBusiness.target_avatar}
- Challenge: ${selectedBusiness.biggest_challenge}
- Advantage: ${selectedBusiness.unique_advantage}
- Timeline: ${selectedBusiness.timeline}

VALUE EQUATION COMPONENTS:
- Dream Outcome: ${selectedBusiness.dream_outcome || 'Not provided'}
- Likelihood of Achievement (Proof): ${selectedBusiness.likelihood_of_achievement_proof || 'Not provided'}
- Time Delay to Result: ${selectedBusiness.time_delay_to_result || 'Not provided'}
- Effort & Sacrifice Reduced: ${selectedBusiness.effort_and_sacrifice_reduced || 'Not provided'}

FINANCIALS:
- Current Revenue: $${selectedBusiness.current_revenue}/month
- Target Revenue: $${selectedBusiness.desired_revenue}/month

YOUR TASK:
Using all the information above, especially the Value Equation components, create a COMPLETE strategy.

1. IRRESISTIBLE OFFER STACK — 3 TICKET TIERS:
   - LOW TICKET ($27–$297): A productized entry point that delivers a quick win. This gets them in the ecosystem with low friction.
   - MID TICKET ($497–$2,997): The core transformation offer. This is where most revenue comes from. Bundle bonuses, add guarantee, remove all friction.
   - HIGH TICKET ($5,000–$50,000+): Premium done-for-you or intensive coaching. Limited spots, application-only, maximum white-glove delivery.
   - Each tier must have: name, price, perceived value, what's included, and a guarantee.
   - The tiers should form a natural ascension ladder — each one makes the next feel obvious.
   - Also include 1 downsell for people who say no to the low ticket.

2. PRICING STRATEGY:
   - Create an anchor price based on the immense value presented in the offer.
   - Define a final, "no-brainer" actual price.
   - Propose urgency mechanisms (e.g., price increases, bonus removal).
   - Define a premium positioning statement.

3. FUNNEL MAP:
   - A lead magnet that gives a TASTE of the Dream Outcome (not a watered-down tip sheet).
   - Use the Hook Formula for the lead magnet: Call out the avatar → Hit their #1 pain → Promise the result.
   - A 5-step nurture sequence: Step 1 delivers value, Step 2 shows social proof, Step 3 handles their top objection, Step 4 builds urgency, Step 5 closes.
   - A direct close mechanism using the Sales Framework: Problem → Agitate → Solution → Risk Removal → Confident Close.

4. LEAD GENERATION PLAN:
   - 3 daily content post ideas (polarizing angles that stop the scroll).
   - 1 outreach script for cold DMs/emails targeting the avatar.
   - 1 referral mechanism to activate existing network.

5. OBJECTION HANDLING:
   - Identify the top 3 objections this avatar will have (Trust, Money, Time, or Belief).
   - For each objection, provide a pre-handle that can be woven into content/sales calls BEFORE the objection is raised.

Be specific, aggressive, and focus on VALUE DELIVERY. Your response must be structured in the JSON format provided. Think like you're advising a client to 10x their business.
      `;

      const result = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            offer_stack: {
              type: "object",
              properties: {
                low_ticket: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "number" },
                    value: { type: "number" },
                    whats_included: { type: "string" },
                    guarantee: { type: "string" }
                  }
                },
                mid_ticket: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "number" },
                    value: { type: "number" },
                    whats_included: { type: "string" },
                    guarantee: { type: "string" }
                  }
                },
                high_ticket: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "number" },
                    value: { type: "number" },
                    whats_included: { type: "string" },
                    guarantee: { type: "string" }
                  }
                },
                downsell: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    value: { type: "number" },
                    price: { type: "number" }
                  }
                }
              }
            },
            pricing_strategy: {
              type: "object",
              properties: {
                anchor_price: { type: "number" },
                actual_price: { type: "number" },
                urgency_mechanism: { type: "string" },
                positioning: { type: "string" }
              }
            },
            funnel_map: {
              type: "object",
              properties: {
                lead_magnet: { type: "string" },
                nurture_sequence: { type: "array", items: { type: "string" } },
                close_mechanism: { type: "string" }
              }
            },
            lead_generation: {
              type: "object",
              properties: {
                daily_content_ideas: { type: "array", items: { type: "string" } },
                outreach_script: { type: "string" },
                referral_mechanism: { type: "string" }
              }
            },
            objection_handling: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  objection: { type: "string" },
                  root_cause: { type: "string" },
                  pre_handle: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGeneratedStrategy(result);
    } catch (error) {
      console.error("Error generating strategy:", error);
      setError("The AI failed to generate a strategy. This can happen. Try again.");
    }
    setIsGenerating(false);
  };

  const saveStrategy = async () => {
    if (!generatedStrategy || !selectedBusiness) return;

    setIsSaving(true);
    setError(null);
    try {
      const stack = generatedStrategy.offer_stack || {};
      await Strategy.create({
        business_id: selectedBusiness.id,
        ...generatedStrategy,
        // Other tools read the main offer as core_offer and the next steps as upsells.
        offer_stack: {
          ...stack,
          core_offer: stack.core_offer || stack.mid_ticket || stack.low_ticket || null,
          upsells: stack.upsells || [stack.high_ticket].filter(Boolean),
        },
      });
      navigate(createPageUrl("LaunchCalendar"));
    } catch (error) {
      console.error("Error saving strategy:", error);
      setError("Failed to save the strategy. Please try again.");
    }
    setIsSaving(false);
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadBusinesses}>
      <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-yellow-400 rounded-lg">
              <TrendingUp className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">STRATEGY GENERATOR</h1>
              <p className="text-muted-foreground">Build offers that make people stupid money.</p>
            </div>
          </div>
        </div>

        {error && (
            <div className="bg-red-900 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
            </div>
        )}

        {/* Business Selection */}
        <Card className="dark-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-foreground font-bold">SELECT BUSINESS</CardTitle>
          </CardHeader>
          <CardContent>
            {businesses.length > 0 ? (
              <Select 
                value={selectedBusiness?.id} 
                onValueChange={(value) => {
                  const business = businesses.find(b => b.id === value);
                  setSelectedBusiness(business);
                  setGeneratedStrategy(null);
                }}
              >
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Choose your business" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.business_name} - {business.industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No businesses found. Setup your first business.</p>
                <Button onClick={() => navigate(createPageUrl("BusinessSetup"))} className="bg-yellow-400 text-black font-bold">
                  Setup Business
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        {selectedBusiness && !generatedStrategy && (
          <div className="text-center mb-8">
            <Button
              onClick={generateStrategy}
              disabled={isGenerating}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-4 text-xl"
            >
              {isGenerating ? (
                "BUILDING YOUR EMPIRE..."
              ) : (
                <>
                  <Zap className="w-6 h-6 mr-3" />
                  GENERATE BUSINESS STRATEGY
                </>
              )}
            </Button>
            {selectedBusiness && (
              <div className="mt-4 p-4 bg-card rounded-lg text-left max-w-md mx-auto">
                <p className="text-yellow-400 font-bold mb-2">TARGETING:</p>
                <p className="text-foreground font-semibold">{selectedBusiness.business_name}</p>
                <p className="text-muted-foreground">{selectedBusiness.industry} • {selectedBusiness.target_avatar.slice(0, 100)}...</p>
              </div>
            )}
          </div>
        )}

        {/* Generated Strategy */}
        {generatedStrategy && (
          <div className="space-y-6">
            {/* Offer Stack — 3 Tiers */}
            <Card className="dark-card border-yellow-400">
              <CardHeader>
                <CardTitle className="text-yellow-400 font-bold text-xl flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  IRRESISTIBLE OFFER STACK — 3 TICKET TIERS
                </CardTitle>
                <p className="text-muted-foreground text-sm">Every tier feeds the next. Low → Mid → High. Build the ascension ladder.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Low Ticket */}
                {generatedStrategy.offer_stack?.low_ticket && (
                  <div className="p-5 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600 text-primary-foreground font-bold">LOW TICKET</Badge>
                        <span className="text-muted-foreground text-sm">Entry Point • Low Friction</span>
                      </div>
                      <Badge className="bg-blue-500 text-primary-foreground font-bold text-lg px-3 py-1">
                        ${generatedStrategy.offer_stack?.low_ticket.price?.toLocaleString()}
                      </Badge>
                    </div>
                    <h4 className="text-foreground font-bold text-lg mb-1">{generatedStrategy.offer_stack?.low_ticket.name}</h4>
                    <p className="text-muted-foreground text-sm mb-2">Value: ${generatedStrategy.offer_stack?.low_ticket.value?.toLocaleString()}</p>
                    <p className="text-foreground/80 text-sm mb-3">{generatedStrategy.offer_stack?.low_ticket.whats_included}</p>
                    <div className="bg-card p-3 rounded"><p className="text-blue-300 text-sm">🛡️ {generatedStrategy.offer_stack?.low_ticket.guarantee}</p></div>
                  </div>
                )}

                {/* Mid Ticket */}
                {generatedStrategy.offer_stack?.mid_ticket && (
                  <div className="p-5 bg-green-900 bg-opacity-20 border border-green-500 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600 text-primary-foreground font-bold">MID TICKET</Badge>
                        <span className="text-muted-foreground text-sm">Core Transformation • Main Revenue</span>
                      </div>
                      <Badge className="bg-green-500 text-black font-bold text-lg px-3 py-1">
                        ${generatedStrategy.offer_stack?.mid_ticket.price?.toLocaleString()}
                      </Badge>
                    </div>
                    <h4 className="text-foreground font-bold text-lg mb-1">{generatedStrategy.offer_stack?.mid_ticket.name}</h4>
                    <p className="text-muted-foreground text-sm mb-2">Value: ${generatedStrategy.offer_stack?.mid_ticket.value?.toLocaleString()}</p>
                    <p className="text-foreground/80 text-sm mb-3">{generatedStrategy.offer_stack?.mid_ticket.whats_included}</p>
                    <div className="bg-card p-3 rounded"><p className="text-green-300 text-sm">🛡️ {generatedStrategy.offer_stack?.mid_ticket.guarantee}</p></div>
                  </div>
                )}

                {/* High Ticket */}
                {generatedStrategy.offer_stack?.high_ticket && (
                  <div className="p-5 bg-yellow-900 bg-opacity-20 border border-yellow-400 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-500 text-black font-bold">HIGH TICKET</Badge>
                        <span className="text-muted-foreground text-sm">Premium DFY • Application Only</span>
                      </div>
                      <Badge className="bg-yellow-400 text-black font-bold text-lg px-3 py-1">
                        ${generatedStrategy.offer_stack?.high_ticket.price?.toLocaleString()}
                      </Badge>
                    </div>
                    <h4 className="text-foreground font-bold text-lg mb-1">{generatedStrategy.offer_stack?.high_ticket.name}</h4>
                    <p className="text-muted-foreground text-sm mb-2">Value: ${generatedStrategy.offer_stack?.high_ticket.value?.toLocaleString()}</p>
                    <p className="text-foreground/80 text-sm mb-3">{generatedStrategy.offer_stack?.high_ticket.whats_included}</p>
                    <div className="bg-card p-3 rounded"><p className="text-yellow-300 text-sm">🛡️ {generatedStrategy.offer_stack?.high_ticket.guarantee}</p></div>
                  </div>
                )}

                {/* Downsell */}
                {generatedStrategy.offer_stack?.downsell && (
                  <div className="p-4 bg-purple-900 bg-opacity-20 border border-purple-500 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-purple-600 text-primary-foreground font-bold">DOWNSELL</Badge>
                      <Badge className="bg-purple-500 text-primary-foreground font-bold">${generatedStrategy.offer_stack?.downsell.price?.toLocaleString()}</Badge>
                    </div>
                    <h4 className="text-foreground font-bold mb-1">{generatedStrategy.offer_stack?.downsell.name}</h4>
                    <p className="text-muted-foreground text-sm">Value: ${generatedStrategy.offer_stack?.downsell.value?.toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Strategy */}
            <Card className="dark-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground font-bold text-xl flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  PRICING PSYCHOLOGY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-card rounded-lg">
                    <h3 className="text-yellow-400 font-bold mb-2">ANCHOR PRICE</h3>
                    <p className="text-3xl font-black text-foreground">${generatedStrategy.pricing_strategy?.anchor_price?.toLocaleString?.() ?? "—"}</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg">
                    <h3 className="text-green-400 font-bold mb-2">ACTUAL PRICE</h3>
                    <p className="text-3xl font-black text-foreground">${generatedStrategy.pricing_strategy?.actual_price?.toLocaleString?.() ?? "—"}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-yellow-400 font-bold mb-2">URGENCY MECHANISM</h3>
                    <p className="text-foreground/80">{generatedStrategy.pricing_strategy?.urgency_mechanism}</p>
                  </div>
                  <div>
                    <h3 className="text-yellow-400 font-bold mb-2">POSITIONING</h3>
                    <p className="text-foreground/80">{generatedStrategy.pricing_strategy?.positioning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Funnel Map */}
            <Card className="dark-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground font-bold text-xl">CUSTOMER ACQUISITION FUNNEL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-yellow-900 bg-opacity-20 border border-yellow-400 rounded-lg">
                  <h3 className="text-yellow-400 font-bold mb-2">LEAD MAGNET</h3>
                  <p className="text-foreground/80">{generatedStrategy.funnel_map?.lead_magnet}</p>
                </div>

                <div className="p-4 bg-card rounded-lg">
                  <h3 className="text-foreground font-bold mb-4">NURTURE SEQUENCE</h3>
                  <div className="space-y-3">
                    {(Array.isArray(generatedStrategy.funnel_map?.nurture_sequence) ? generatedStrategy.funnel_map.nurture_sequence : []).map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <p className="text-foreground/80">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-green-900 bg-opacity-20 border border-green-400 rounded-lg">
                  <h3 className="text-green-400 font-bold mb-2">CLOSE MECHANISM</h3>
                  <p className="text-foreground/80">{generatedStrategy.funnel_map?.close_mechanism}</p>
                </div>
              </CardContent>
            </Card>

            {/* Lead Generation */}
            {generatedStrategy.lead_generation && (
              <Card className="dark-card border-blue-500">
                <CardHeader>
                  <CardTitle className="text-blue-400 font-bold text-xl flex items-center gap-2">
                    <Zap className="w-6 h-6" />
                    LEAD GENERATION ENGINE
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg">
                    <h3 className="text-blue-400 font-bold mb-3">📱 DAILY CONTENT IDEAS</h3>
                    <div className="space-y-2">
                      {(Array.isArray(generatedStrategy.lead_generation.daily_content_ideas) ? generatedStrategy.lead_generation.daily_content_ideas : []).map((idea, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-card rounded">
                          <div className="w-6 h-6 bg-blue-500 text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{index + 1}</div>
                          <p className="text-foreground/80 text-sm">{idea}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-card rounded-lg">
                    <h3 className="text-foreground font-bold mb-2">📩 OUTREACH SCRIPT</h3>
                    <p className="text-foreground/80 text-sm whitespace-pre-wrap">{generatedStrategy.lead_generation.outreach_script}</p>
                  </div>
                  <div className="p-4 bg-green-900 bg-opacity-20 border border-green-500 rounded-lg">
                    <h3 className="text-green-400 font-bold mb-2">🤝 REFERRAL MECHANISM</h3>
                    <p className="text-foreground/80 text-sm">{generatedStrategy.lead_generation.referral_mechanism}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Objection Handling */}
            {Array.isArray(generatedStrategy.objection_handling) && generatedStrategy.objection_handling.length > 0 && (
              <Card className="dark-card border-red-500">
                <CardHeader>
                  <CardTitle className="text-red-400 font-bold text-xl flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    OBJECTION CRUSHER
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">Every objection = lack of Trust, Time, Money, or Belief. Fix the root.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedStrategy.objection_handling.map((item, index) => (
                    <div key={index} className="p-4 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-red-400 font-bold">"{item.objection}"</h3>
                        <Badge className="bg-red-800 text-red-200 text-sm">{item.root_cause}</Badge>
                      </div>
                      <p className="text-yellow-400 font-semibold text-sm mb-1">PRE-HANDLE:</p>
                      <p className="text-foreground/80 text-sm">{item.pre_handle}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Save Strategy */}
            <div className="flex justify-end pt-6">
              <Button
                onClick={saveStrategy}
                disabled={isSaving}
                className="bg-green-500 hover:bg-green-600 text-primary-foreground font-bold px-8 py-3 text-lg"
              >
                {isSaving ? "SAVING..." : "SAVE STRATEGY & BUILD LAUNCH PLAN"}
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}