import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { hormoziOfferAgent } from "@/functions/hormoziOfferAgent";
import AppLayout from "@/components/AppLayout";
import { agentErrorMessage } from "@/lib/agent-sources";
import PullToRefresh from "@/components/PullToRefresh";
import AgentChatBubble from "@/components/AgentChatBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Star, Shield, Clock, ChevronDown, ChevronUp, Copy, Check, RefreshCw } from "lucide-react";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      aria-label="Copy to clipboard"
      className="min-h-[44px] min-w-[44px] grid place-items-center rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ScoreBar({ label, score, max = 10 }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{label}</span><span className="font-bold text-foreground">{score}/{max}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/5 transition-colors">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          <span>{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-border">{children}</div>}
    </div>
  );
}

export default function OfferAgent() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState(null);

  const loadBusinesses = async () => {
    const businesses = await base44.entities.Business.list();
    setBusinesses(businesses);
  };

  useEffect(() => { loadBusinesses(); }, []);

  const generate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setOffer(null);
    setError(null);
    try {
      const res = await hormoziOfferAgent({ business_id: selectedId, custom_context: customContext });
      if (res.data?.offer) {
        setOffer(res.data.offer);
      } else {
        setError(res.data?.error || "Failed to generate offer. Try again.");
      }
    } catch (e) {
      setError(agentErrorMessage(e, "Failed to generate offer. Try again."));
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadBusinesses}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 hero-radial min-h-screen">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Offer <span className="accent-text">Agent</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Craft a high-value offer using the Value Equation</p>
        </div>

        {/* Controls */}
        <div className="light-card rounded-xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Business</label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full bg-card border border-border rounded-lg h-11 px-4 text-foreground text-sm focus:ring-2 focus:ring-primary/50">
                <SelectValue placeholder="— Choose a business —" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.business_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Additional Context <span className="normal-case text-muted-foreground/60">(optional)</span></label>
            <Textarea
              placeholder="e.g. targeting burnt-out coaches, price point around $3,000, need a 30-day guarantee..."
              value={customContext}
              onChange={e => setCustomContext(e.target.value)}
              className="bg-card border-border text-foreground text-sm resize-none"
              rows={3}
            />
          </div>
          <Button onClick={generate} disabled={!selectedId || loading}
            className="w-full accent-gradient hover:opacity-90 text-white font-bold">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Crafting Your Offer...</> : <><Zap className="w-4 h-4 mr-2" />Generate Grand Slam Offer</>}
          </Button>
          {error && <p className="text-rose-600 text-sm text-center">{error}</p>}
        </div>

        {/* Results */}
        {offer && (
          <div className="space-y-4">
            {/* Hero */}
            <div className="light-card rounded-xl p-6 accent-border text-center space-y-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">Grand Slam Offer</Badge>
              <h2 className="text-2xl font-display font-bold text-foreground">{offer.offer_name}</h2>
              <p className="text-muted-foreground">{offer.one_liner}</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Stack Value</p>
                  <p className="text-xl font-bold text-emerald-600">${(offer.total_stack_value || 0).toLocaleString()}</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Your Price</p>
                  <p className="text-xl font-bold accent-text">${(offer.recommended_price || 0).toLocaleString()}</p>
                </div>
                {offer.value_ratio && (
                  <>
                    <div className="w-px h-10 bg-border" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Value Ratio</p>
                      <p className="text-sm font-bold text-foreground">{offer.value_ratio}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Headline */}
            <div className="light-card rounded-xl p-5 space-y-1">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-2">Headline</p>
                <CopyBtn text={`${offer.headline}\n${offer.sub_headline}`} />
              </div>
              <p className="text-foreground font-bold text-lg">{offer.headline}</p>
              {offer.sub_headline && <p className="text-muted-foreground text-sm">{offer.sub_headline}</p>}
            </div>

            {/* Value Equation Score */}
            {offer.value_equation_score && (
              <Section title="Value Equation Score" icon={Star} defaultOpen={true}>
                <div className="space-y-3 pt-2">
                  <ScoreBar label="Dream Outcome" score={offer.value_equation_score.dream_outcome_score} />
                  <ScoreBar label="Likelihood of Achievement" score={offer.value_equation_score.likelihood_score} />
                  <ScoreBar label="Time Collapse (faster = higher)" score={offer.value_equation_score.time_delay_score} />
                  <ScoreBar label="Effort Eliminated" score={offer.value_equation_score.effort_score} />
                  <div className="mt-4 pt-4 border-t border-border">
                    <ScoreBar label="Overall Value Score" score={offer.value_equation_score.overall_value_score} max={100} />
                  </div>
                </div>
              </Section>
            )}

            {/* Core Deliverables */}
            {offer.core_deliverables?.length > 0 && (
              <Section title="Core Deliverables" icon={Zap} defaultOpen={true}>
                <div className="space-y-3 pt-2">
                  {offer.core_deliverables.map((d, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-secondary">
                      <div>
                        <p className="text-foreground font-semibold text-sm">{d.name}</p>
                        <p className="text-muted-foreground text-sm mt-0.5">{d.description}</p>
                      </div>
                      <span className="text-emerald-600 font-bold text-sm whitespace-nowrap">${(d.perceived_value || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Bonuses */}
            {offer.bonuses?.length > 0 && (
              <Section title="Bonus Stack" icon={Star}>
                <div className="space-y-3 pt-2">
                  {offer.bonuses.map((b, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary space-y-1">
                      <div className="flex items-start justify-between">
                        <p className="text-foreground font-semibold text-sm">{b.name}</p>
                        <span className="text-emerald-600 font-bold text-sm whitespace-nowrap">${(b.perceived_value || 0).toLocaleString()}</span>
                      </div>
                      <p className="text-muted-foreground text-sm">{b.description}</p>
                      {b.objection_it_kills && (
                        <p className="text-sm text-primary">⚡ Kills objection: "{b.objection_it_kills}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Guarantee */}
            {offer.guarantee && (
              <Section title="Risk Reversal Guarantee" icon={Shield}>
                <div className="pt-2 space-y-2">
                  <Badge variant="outline" className="border-emerald-300 text-emerald-600">{offer.guarantee.type}</Badge>
                  <p className="text-foreground text-sm">{offer.guarantee.description}</p>
                  {offer.guarantee.duration && <p className="text-muted-foreground text-sm">Duration: {offer.guarantee.duration}</p>}
                </div>
              </Section>
            )}

            {/* Urgency */}
            {offer.urgency_scarcity && (
              <Section title="Urgency & Scarcity" icon={Clock}>
                <p className="text-foreground text-sm pt-2">{offer.urgency_scarcity}</p>
              </Section>
            )}

            {/* Objection Crushers */}
            {offer.objection_crushers?.length > 0 && (
              <Section title="Objection Crushers">
                <div className="space-y-3 pt-2">
                  {offer.objection_crushers.map((o, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary">
                      <p className="text-rose-600 text-sm font-semibold mb-1">"{o.objection}"</p>
                      <p className="text-foreground text-sm">{o.reframe}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Strategic Verdict */}
            {offer.hormozi_verdict && (
              <div className="light-card rounded-xl p-5 accent-border">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">🔥 Strategic Verdict</p>
                <p className="text-foreground text-sm leading-relaxed">{offer.hormozi_verdict}</p>
              </div>
            )}
          </div>
        )}
      </div>
      </PullToRefresh>
      <AgentChatBubble
        title="Offer Agent"
        systemPrompt="You are an elite offer architect using the Value Equation (Dream Outcome × Likelihood) ÷ (Time Delay × Effort). You help craft irresistible offers: deliverables, bonus stacks, guarantees, urgency, and objection crushers. Be direct, specific, and give a concrete next action."
        greeting="Hey! I'm your Offer Agent. Ask me about building a grand slam offer, stacking bonuses, or crushing objections — I'll use your saved business data."
        quickPrompts={["How do I make my offer irresistible?", "What bonuses should I add?", "What guarantee should I offer?", "How do I handle price objections?"]}
      />
    </AppLayout>
  );
}