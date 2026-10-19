import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { loadAgentSources, agentErrorMessage } from "@/lib/agent-sources";
import { funnelAcquisitionAgent } from "@/functions/funnelAcquisitionAgent";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import AgentChatBubble from "@/components/AgentChatBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  RefreshCw, ChevronDown, Copy, Check,
  Target, Zap, Mail, AlertTriangle, Users, ArrowRight, GitBranch
} from "lucide-react";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className="w-11 h-11 -my-2 grid place-items-center rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = false, accentClass = "border-border" }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl overflow-hidden border ${accentClass} bg-card`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-foreground/10 transition-colors">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          <span>{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-border">{children}</div>}
    </div>
  );
}

const PRIORITY_STYLES = {
  primary:   { badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  secondary: { badge: "bg-blue-100 text-blue-700 border-blue-200" },
  testing:   { badge: "bg-amber-100 text-amber-700 border-amber-200" },
};

const STAGE_COLORS = [
  "border-l-blue-500",
  "border-l-indigo-500",
  "border-l-purple-500",
  "border-l-primary",
  "border-l-orange-500",
  "border-l-emerald-500",
  "border-l-teal-500",
  "border-l-pink-500",
];

const EMAIL_TYPE_COLORS = {
  Welcome:   "bg-blue-100 text-blue-700",
  Value:     "bg-emerald-100 text-emerald-700",
  Story:     "bg-purple-100 text-purple-700",
  Pitch:     "bg-primary/20 text-primary",
  Urgency:   "bg-rose-100 text-rose-700",
  "Re-engage": "bg-amber-100 text-amber-700",
};

export default function FunnelAcquisitionAgent() {
  const [strategies, setStrategies] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [funnel, setFunnel] = useState(null);
  const [error, setError] = useState(null);

  const loadEntities = async () => {
    const options = await loadAgentSources();
    setStrategies(options);
    if (!selectedId && options.length === 1) setSelectedId(options[0].value);
  };

  useEffect(() => { loadEntities(); }, []);

  const run = async () => {
    if (!selectedId) return;
    setLoading(true);
    setFunnel(null);
    setError(null);
    const source = strategies.find(o => o.value === selectedId);
    try {
      const res = await funnelAcquisitionAgent({ ...(source?.payload || {}), custom_context: customContext });
      if (res.data?.funnel) {
        setFunnel(res.data.funnel);
      } else {
        setError(res.data?.error || "Failed to generate funnel map. Try again.");
      }
    } catch (e) {
      setError(agentErrorMessage(e, "Failed to generate funnel map. Try again."));
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadEntities}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        <div>
          <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">ACQUISITION FUNNEL AGENT</Badge>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Funnel <span className="accent-text">Acquisition</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Full customer acquisition funnel map — traffic to close — engineered to maximize lead flow</p>
        </div>

        <div className="light-card rounded-xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Business</label>
            <Select value={selectedId} onValueChange={(v) => setSelectedId(v)}>
              <SelectTrigger className="w-full bg-card border border-border rounded-lg h-11 px-4 text-sm focus:ring-2 focus:ring-primary/50">
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
              placeholder="e.g. $1k/mo ad budget, mainly targeting LinkedIn. Currently getting leads but they don't convert. Want to add a webinar funnel..."
              value={customContext} onChange={e => setCustomContext(e.target.value)}
              className="bg-card border-border text-foreground text-sm resize-none" rows={3} />
          </div>

          <Button onClick={run} disabled={!selectedId || loading} className="w-full accent-gradient text-white font-bold">
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Mapping Your Acquisition Funnel...</>
              : <><GitBranch className="w-4 h-4 mr-2" />Build My Acquisition Funnel</>}
          </Button>
          {error && <p className="text-rose-600 text-sm text-center">{error}</p>}
        </div>

        {funnel && (
          <div className="space-y-4">

            <div className="light-card rounded-xl p-6 accent-border space-y-3 text-center">
              <Badge className="bg-primary/20 text-primary border-primary/30">Funnel Map Ready</Badge>
              <h2 className="text-2xl font-display font-bold text-foreground">{funnel.funnel_name}</h2>
              <Badge className="bg-secondary text-muted-foreground border-border">{funnel.funnel_type}</Badge>
              <div className="flex items-center justify-center gap-6 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Est. Monthly Leads</p>
                  <p className="text-xl font-black text-emerald-600">{(funnel.estimated_monthly_leads || 0).toLocaleString()}</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground">Cold-to-Client Rate</p>
                  <p className="text-xl font-black text-foreground">{funnel.estimated_conversion_rate || 0}%</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground">Funnel Stages</p>
                  <p className="text-xl font-black text-foreground">{funnel.funnel_stages?.length || 0}</p>
                </div>
              </div>
              {funnel.funnel_summary && (
                <p className="text-muted-foreground text-sm max-w-xl mx-auto pt-2">{funnel.funnel_summary}</p>
              )}
            </div>

            {funnel.funnel_verdict && (
              <div className="rounded-xl p-4 border border-primary/30 bg-primary/5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-primary text-sm font-bold uppercase mb-1">Funnel Verdict</p>
                  <p className="text-foreground text-sm leading-relaxed">{funnel.funnel_verdict}</p>
                </div>
                <CopyBtn text={funnel.funnel_verdict} />
              </div>
            )}

            {funnel.quick_wins?.length > 0 && (
              <div className="rounded-xl p-5 border border-emerald-300/50 bg-emerald-50">
                <p className="text-emerald-600 text-sm font-bold uppercase tracking-wider mb-3">⚡ 48-Hour Quick Wins</p>
                <ul className="space-y-2">
                  {funnel.quick_wins.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground text-sm">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {funnel.traffic_sources?.length > 0 && (
              <Section title="Traffic Sources" icon={Users} defaultOpen={true}>
                <div className="space-y-3 pt-2">
                  {funnel.traffic_sources.map((src, i) => {
                    const style = PRIORITY_STYLES[src.priority] || PRIORITY_STYLES.secondary;
                    return (
                      <div key={i} className="p-4 rounded-lg bg-secondary border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-foreground font-bold text-sm">{src.channel}</p>
                          <Badge className={`${style.badge} text-sm border`}>{src.priority}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{src.strategy}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-emerald-600">~{src.estimated_leads_per_week} leads/wk</span>
                          <span className="text-muted-foreground">CPL: {src.cost_per_lead}</span>
                        </div>
                        <div className="p-2 rounded bg-primary/5 border border-primary/20">
                          <p className="text-primary text-sm font-semibold">Daily Action:</p>
                          <p className="text-foreground/80 text-sm mt-0.5">{src.daily_action}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {funnel.funnel_stages?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Funnel Stages</p>
                {funnel.funnel_stages.map((stage, i) => (
                  <div key={i} className={`light-card rounded-xl border-l-4 ${STAGE_COLORS[i % STAGE_COLORS.length]} overflow-hidden`}>
                    <details>
                      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-foreground/10 list-none">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-foreground text-sm font-black">
                            {stage.stage_number || i + 1}
                          </div>
                          <div>
                            <p className="text-foreground font-bold text-sm">{stage.stage_name}</p>
                            <p className="text-muted-foreground text-sm">{stage.stage_type} · {stage.time_in_stage}</p>
                          </div>
                        </div>
                        <Badge className="bg-secondary text-muted-foreground text-sm">{stage.conversion_benchmark}</Badge>
                      </summary>
                      <div className="px-5 pb-5 pt-3 border-t border-border space-y-3">
                        <p className="text-foreground/80 text-sm">{stage.objective}</p>

                        {stage.copy_example && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start justify-between gap-2">
                            <div>
                              <p className="text-primary text-sm font-bold uppercase mb-1">Copy Hook</p>
                              <p className="text-foreground text-sm italic">"{stage.copy_example}"</p>
                            </div>
                            <CopyBtn text={stage.copy_example} />
                          </div>
                        )}

                        {stage.key_lever && (
                          <div className="flex items-start gap-2">
                            <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-foreground/80 text-sm"><span className="text-primary font-semibold">#1 Lever: </span>{stage.key_lever}</p>
                          </div>
                        )}

                        {stage.actions?.length > 0 && (
                          <ul className="space-y-1.5">
                            {stage.actions.map((a, j) => (
                              <li key={j} className="flex items-start gap-2 text-muted-foreground text-sm">
                                <ArrowRight className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />{a}
                              </li>
                            ))}
                          </ul>
                        )}

                        {stage.tools_recommended?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {stage.tools_recommended.map((t, j) => (
                              <span key={j} className="text-sm px-2 py-1 rounded-full bg-secondary text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}

            {funnel.email_sequence?.length > 0 && (
              <Section title="Nurture Email Sequence" icon={Mail}>
                <div className="space-y-2 pt-2">
                  {funnel.email_sequence.map((email, i) => {
                    const typeColor = EMAIL_TYPE_COLORS[email.email_type] || "bg-secondary text-muted-foreground";
                    return (
                      <div key={i} className="p-3 rounded-lg bg-secondary border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`${typeColor} text-sm`}>{email.email_type}</Badge>
                            <span className="text-muted-foreground text-sm">Day {email.day}</span>
                          </div>
                          <CopyBtn text={`Subject: ${email.subject_line}\n\n${email.opening_line}\n\n${email.core_message}\n\nCTA: ${email.cta}`} />
                        </div>
                        <p className="text-foreground font-semibold text-sm">Subject: {email.subject_line}</p>
                        <p className="text-muted-foreground text-sm mt-1 italic">"{email.opening_line}"</p>
                        <p className="text-muted-foreground text-sm mt-1">{email.core_message}</p>
                        <p className="text-primary text-sm mt-1 font-medium">CTA: {email.cta}</p>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {funnel.kpis?.length > 0 && (
              <Section title="KPIs to Track" icon={Target} defaultOpen={true}>
                <div className="grid md:grid-cols-2 gap-3 pt-2">
                  {funnel.kpis.map((kpi, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary border border-border">
                      <p className="text-foreground font-semibold text-sm">{kpi.metric}</p>
                      <p className="text-emerald-600 text-sm font-black">{kpi.target}</p>
                      <p className="text-muted-foreground text-sm mt-1">{kpi.how_to_measure}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {funnel.bottlenecks?.length > 0 && (
              <Section title="Funnel Bottlenecks & Fixes" icon={AlertTriangle} accentClass="border-amber-300">
                <div className="space-y-3 pt-2">
                  {funnel.bottlenecks.map((b, i) => (
                    <div key={i} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-amber-700 font-semibold text-sm">⚠️ {b.stage}: {b.risk}</p>
                      <p className="text-foreground/80 text-sm mt-1">→ Fix: {b.fix}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>
        )}
      </div>
      </PullToRefresh>
      <AgentChatBubble
        title="Funnel Acquisition Agent"
        systemPrompt="You are an elite customer acquisition funnel expert. You architect end-to-end funnels: traffic sources, lead capture, nurture sequences, sales conversion, and KPIs. Be direct, specific, and give a concrete next action."
        greeting="Hey! I'm your Funnel Acquisition Agent. Ask me about traffic sources, funnel stages, or email sequences — I'll use your saved business data."
        quickPrompts={["What traffic sources should I use?", "How do I structure my funnel?", "What should my email sequence look like?", "What KPIs should I track?"]}
      />
    </AppLayout>
  );
}