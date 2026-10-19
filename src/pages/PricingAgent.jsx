import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { loadAgentSources, agentErrorMessage } from "@/lib/agent-sources";
import { pricingAgent } from "@/functions/pricingAgent";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import AgentChatBubble from "@/components/AgentChatBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, AlertTriangle,
  ChevronDown, ChevronUp, RefreshCw, Check, Copy, BarChart3, Brain
} from "lucide-react";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className="w-11 h-11 -my-2 grid place-items-center rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = false, accent }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl overflow-hidden border ${accent || 'border-border'} bg-card`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-foreground/10 transition-colors">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          {Icon && <Icon className={`w-4 h-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />}
          <span>{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-border">{children}</div>}
    </div>
  );
}

const TIER_COLORS = ["border-blue-300 bg-blue-50", "border-primary/30 bg-primary/5", "border-purple-300 bg-purple-50"];
const TIER_BADGES = ["bg-blue-100 text-blue-700", "bg-primary/20 text-primary", "bg-purple-100 text-purple-700"];

export default function PricingAgent() {
  const [strategies, setStrategies] = useState([]); // business profiles + saved strategies
  const [selectedId, setSelectedId] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const loadStrategies = async () => {
    const options = await loadAgentSources();
    setStrategies(options);
    if (!selectedId && options.length === 1) setSelectedId(options[0].value);
  };

  useEffect(() => { loadStrategies(); }, []);

  const run = async () => {
    if (!selectedId) return;
    setLoading(true);
    setAnalysis(null);
    setError(null);
    const source = strategies.find(o => o.value === selectedId);
    try {
      const res = await pricingAgent({ ...(source?.payload || {}), custom_context: customContext });
      if (res.data?.analysis) {
        setAnalysis(res.data.analysis);
      } else {
        setError(res.data?.error || "Analysis failed. Try again.");
      }
    } catch (e) {
      setError(agentErrorMessage(e, "Analysis failed. Try again."));
    }
    setLoading(false);
  };

  const tierColor = (t) => {
    const tier = t?.toLowerCase();
    if (tier?.includes("ultra")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (tier?.includes("premium")) return "bg-primary/20 text-primary border-primary/30";
    if (tier?.includes("competitive")) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-secondary text-muted-foreground border-border";
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadStrategies}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">PRICING INTELLIGENCE</Badge>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Pricing <span className="accent-text">Agent</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Market positioning analysis + aggressive pricing architecture for your business</p>
        </div>

        <div className="light-card rounded-xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Business</label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full bg-card border border-border rounded-lg h-11 px-4 text-foreground text-sm focus:ring-2 focus:ring-primary/50">
                <SelectValue placeholder="— Choose a business —" />
              </SelectTrigger>
              <SelectContent>
                {strategies.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {strategies.length === 0 && (
              <p className="text-sm text-muted-foreground">No business profile yet. <Link to="/IdeaIntake" className="underline font-semibold">Complete the Idea Intake</Link> first — it takes about 5 minutes.</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Additional Context <span className="normal-case text-muted-foreground/60">(optional)</span>
            </label>
            <Textarea
              placeholder="e.g. Competitors charge $500–$2k/mo. I want to position at ultra-premium. Target is 6-figure agency owners..."
              value={customContext}
              onChange={e => setCustomContext(e.target.value)}
              className="bg-card border-border text-foreground text-sm resize-none"
              rows={3}
            />
          </div>
          <Button onClick={run} disabled={!selectedId || loading} className="w-full accent-gradient text-white font-bold">
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Analyzing Market...</>
              : <><Brain className="w-4 h-4 mr-2" />Run Pricing Analysis</>}
          </Button>
          {error && <p className="text-rose-600 text-sm text-center">{error}</p>}
        </div>

        {analysis && (
          <div className="space-y-4">

            <div className="light-card rounded-xl p-6 accent-border space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Current Position</p>
                  <Badge className={`${tierColor(analysis.current_positioning_tier)} border text-sm font-bold px-3 py-1`}>
                    {analysis.current_positioning_tier}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Target Position</p>
                  <Badge className={`${tierColor(analysis.recommended_positioning_tier)} border text-sm font-bold px-3 py-1`}>
                    {analysis.recommended_positioning_tier}
                  </Badge>
                </div>
              </div>
              {analysis.positioning_gap_analysis && (
                <p className="text-muted-foreground text-sm border-t border-border pt-3">{analysis.positioning_gap_analysis}</p>
              )}
            </div>

            {analysis.pricing_tiers?.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Aggressive Pricing Architecture</p>
                {analysis.pricing_tiers.map((tier, i) => (
                  <div key={i} className={`rounded-xl p-5 border relative ${TIER_COLORS[i % TIER_COLORS.length]}`}>
                    {tier.is_recommended && (
                      <span className="absolute top-3 right-3 text-sm bg-primary text-white font-bold px-2 py-0.5 rounded-full">RECOMMENDED</span>
                    )}
                    <div className="flex items-start gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${TIER_BADGES[i % TIER_BADGES.length]} text-sm font-bold`}>{tier.tier_name}</Badge>
                          <span className="text-muted-foreground text-sm">{tier.billing_model}</span>
                        </div>
                        <p className="text-2xl font-black text-foreground">${(tier.price || 0).toLocaleString()}</p>
                        <p className="text-muted-foreground text-sm mt-0.5">{tier.who_its_for}</p>
                      </div>
                    </div>
                    {tier.whats_included?.length > 0 && (
                      <ul className="space-y-1 mb-3">
                        {tier.whats_included.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center justify-between border-t border-black/10 pt-3">
                      <p className="text-sm text-muted-foreground italic">{tier.price_justification}</p>
                      {tier.profit_margin_estimate && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-sm border border-emerald-200 ml-2 flex-shrink-0">
                          {tier.profit_margin_estimate} margin
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {analysis.anchor_price && (
              <div className="light-card rounded-xl p-5 space-y-2 border border-amber-300/40">
                <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider">⚓ Price Anchoring Strategy</p>
                <p className="text-foreground text-2xl font-black">${(analysis.anchor_price.anchor_value || 0).toLocaleString()} <span className="text-muted-foreground text-base font-normal">anchor</span></p>
                <p className="text-muted-foreground text-sm">{analysis.anchor_price.anchor_rationale}</p>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-amber-700 text-sm font-medium">How to present it:</p>
                  <p className="text-foreground/80 text-sm mt-1">{analysis.anchor_price.how_to_present_it}</p>
                </div>
              </div>
            )}

            {analysis.competitor_landscape && (
              <Section title="Competitor Landscape" icon={BarChart3} defaultOpen={true}>
                <div className="space-y-3 pt-2">
                  {[
                    { key: "low_end", label: "Low End", color: "text-rose-600" },
                    { key: "mid_market", label: "Mid Market", color: "text-amber-600" },
                    { key: "premium", label: "Premium", color: "text-emerald-600" },
                  ].map(({ key, label, color }) => {
                    const seg = analysis.competitor_landscape[key];
                    if (!seg) return null;
                    return (
                      <div key={key} className="p-3 rounded-lg bg-secondary">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-bold uppercase ${color}`}>{label}</span>
                          <span className="text-foreground font-semibold text-sm">{seg.price_range}</span>
                        </div>
                        <p className="text-muted-foreground text-sm">{seg.who_plays_here}</p>
                        {(seg.weakness || seg.how_to_win) && (
                          <p className="text-sm mt-1 text-muted-foreground/80 italic">{seg.weakness || seg.how_to_win}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {analysis.psychological_pricing_levers?.length > 0 && (
              <Section title="Psychological Pricing Levers" icon={Brain}>
                <div className="space-y-3 pt-2">
                  {analysis.psychological_pricing_levers.map((lever, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary">
                      <p className="text-foreground font-semibold text-sm">{lever.tactic}</p>
                      <p className="text-muted-foreground text-sm mt-0.5">{lever.how_to_apply}</p>
                      <p className="text-primary text-sm mt-1">Impact: {lever.expected_impact}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {analysis.revenue_projections?.length > 0 && (
              <Section title="Revenue Projections" icon={TrendingUp}>
                <div className="space-y-4 pt-2">
                  {analysis.revenue_projections.map((proj, i) => (
                    <div key={i}>
                      <p className="text-foreground font-semibold text-sm mb-2">{proj.tier_name} — ${(proj.price || 0).toLocaleString()}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Conservative", data: proj.conservative, color: "text-rose-600" },
                          { label: "Realistic", data: proj.realistic, color: "text-amber-600" },
                          { label: "Aggressive", data: proj.aggressive, color: "text-emerald-600" },
                        ].map(({ label, data, color }) => (
                          <div key={label} className="p-2 rounded-lg bg-secondary text-center">
                            <p className={`text-sm font-bold ${color} mb-1`}>{label}</p>
                            <p className="text-foreground text-sm font-bold">${((data?.monthly_revenue || 0) / 1000).toFixed(1)}k</p>
                            <p className="text-muted-foreground text-sm">{data?.clients_per_month} clients/mo</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {analysis.money_left_on_table?.length > 0 && (
              <Section title="Money You're Leaving on the Table" icon={AlertTriangle} accent="border-rose-300">
                <div className="space-y-3 pt-2">
                  {analysis.money_left_on_table.map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                      <p className="text-rose-700 font-semibold text-sm">{item.issue}</p>
                      <p className="text-foreground/80 text-sm mt-1">{item.fix}</p>
                      {item.estimated_revenue_impact && (
                        <p className="text-emerald-600 text-sm mt-1 font-medium">💰 {item.estimated_revenue_impact}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {analysis.positioning_statement && (
              <div className="light-card rounded-xl p-5 accent-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary uppercase tracking-wider">Market-Dominating Positioning Statement</p>
                  <CopyBtn text={analysis.positioning_statement} />
                </div>
                <p className="text-foreground text-sm leading-relaxed italic">"{analysis.positioning_statement}"</p>
              </div>
            )}

            {analysis.overall_verdict && (
              <div className="light-card rounded-xl p-5 border border-primary/30 bg-primary/5">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">🔥 Verdict: #1 Pricing Action</p>
                <p className="text-foreground text-sm leading-relaxed">{analysis.overall_verdict}</p>
              </div>
            )}

          </div>
        )}
      </div>
      </PullToRefresh>
      <AgentChatBubble
        title="Pricing Agent"
        systemPrompt="You are an elite pricing strategist and premium business consultant. You help the user architect aggressive, psychology-driven pricing for their offer. Cover: anchor pricing, tier architecture, value-based pricing, psychological levers, competitor positioning, and revenue projections. Be direct, specific, and give a concrete next action."
        greeting="Hey! I'm your Pricing Agent. Ask me about pricing tiers, anchoring, or how to position your offer — I'll use your saved business data."
        quickPrompts={["How should I price my offer?", "What's a good anchor price?", "How do I beat cheaper competitors?", "What pricing psychology should I use?"]}
      />
    </AppLayout>
  );
}