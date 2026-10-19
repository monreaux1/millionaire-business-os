import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { launchSequenceAgent } from "@/functions/launchSequenceAgent";
import AppLayout from "@/components/AppLayout";
import { agentErrorMessage } from "@/lib/agent-sources";
import PullToRefresh from "@/components/PullToRefresh";
import AgentChatBubble from "@/components/AgentChatBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Rocket, RefreshCw, ChevronDown, ChevronUp, Check, Copy,
  Target, Calendar, TrendingUp, AlertTriangle, Flag, Clock
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
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-border">{children}</div>}
    </div>
  );
}

const PHASE_COLORS = [
  { border: "border-blue-300", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { border: "border-amber-300", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  { border: "border-primary/40", bg: "bg-primary/5", badge: "bg-primary/20 text-primary", dot: "bg-primary" },
  { border: "border-purple-300", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
];

const TIMELINE_OPTIONS = [
  { label: "14 Days", value: 14 },
  { label: "30 Days", value: 30 },
  { label: "60 Days", value: 60 },
  { label: "90 Days", value: 90 },
];

export default function LaunchSequenceAgent() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [timelineDays, setTimelineDays] = useState(30);
  const [customContext, setCustomContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [sequence, setSequence] = useState(null);
  const [error, setError] = useState(null);

  const loadBusinesses = async () => {
    const businesses = await base44.entities.Business.list();
    setBusinesses(businesses);
  };

  useEffect(() => { loadBusinesses(); }, []);

  const run = async () => {
    if (!selectedId) return;
    setLoading(true);
    setSequence(null);
    setError(null);
    try {
      const res = await launchSequenceAgent({ business_id: selectedId, timeline_days: timelineDays, custom_context: customContext });
      if (res.data?.sequence) {
        setSequence(res.data.sequence);
      } else {
        setError(res.data?.error || "Failed to generate sequence. Try again.");
      }
    } catch (e) {
      setError(agentErrorMessage(e, "Failed to generate sequence. Try again."));
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadBusinesses}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">LAUNCH SEQUENCE AGENT</Badge>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Launch <span className="accent-text">Sequence</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Step-by-step execution plan to scale any business fast — no fluff, only actions</p>
        </div>

        <div className="light-card rounded-xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Business</label>
            <Select value={selectedId} onValueChange={(v) => setSelectedId(v)}>
              <SelectTrigger className="w-full bg-card border border-border rounded-lg h-11 px-4 text-sm focus:ring-2 focus:ring-primary/50">
                <SelectValue placeholder="— Choose a business —" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.business_name}</SelectItem>)}
              </SelectContent>
            </Select>
            {businesses.length === 0 && <p className="text-sm text-muted-foreground">No businesses found. Complete the Idea Intake first.</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Timeline</label>
            <div className="grid grid-cols-4 gap-2">
              {TIMELINE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setTimelineDays(opt.value)}
                  className={`py-2 rounded-lg text-sm font-bold border transition-all ${timelineDays === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Additional Context <span className="normal-case text-muted-foreground/60">(optional)</span>
            </label>
            <Textarea placeholder="e.g. Starting from zero followers. Budget is $500/mo for ads. Want to focus on Instagram + outbound DMs..."
              value={customContext} onChange={e => setCustomContext(e.target.value)}
              className="bg-card border-border text-foreground text-sm resize-none" rows={3} />
          </div>

          <Button onClick={run} disabled={!selectedId || loading} className="w-full accent-gradient text-white font-bold">
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Building Your Launch Sequence...</>
              : <><Rocket className="w-4 h-4 mr-2" />Build My Launch Sequence</>}
          </Button>
          {error && <p className="text-rose-600 text-sm text-center">{error}</p>}
        </div>

        {sequence && (
          <div className="space-y-4">

            <div className="light-card rounded-xl p-6 accent-border space-y-3 text-center">
              <Badge className="bg-primary/20 text-primary border-primary/30">Launch Sequence Ready</Badge>
              <h2 className="text-2xl font-display font-bold text-foreground">{sequence.launch_title}</h2>
              <div className="flex items-center justify-center gap-6 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Target</p>
                  <p className="text-xl font-black text-emerald-600">${(sequence.revenue_target || 0).toLocaleString()}</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground">Timeline</p>
                  <p className="text-xl font-black text-foreground">{timelineDays} Days</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground">Phases</p>
                  <p className="text-xl font-black text-foreground">{sequence.phases?.length || 4}</p>
                </div>
              </div>
            </div>

            {sequence.battle_cry && (
              <div className="rounded-xl p-4 border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
                <p className="text-primary font-bold text-sm italic">"{sequence.battle_cry}"</p>
                <CopyBtn text={sequence.battle_cry} />
              </div>
            )}

            {sequence.fastest_path_to_10k && (
              <div className="light-card rounded-xl p-5 border border-emerald-300/50 bg-emerald-50">
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">⚡ Fastest Path to First $10k</p>
                <p className="text-foreground text-sm leading-relaxed">{sequence.fastest_path_to_10k}</p>
              </div>
            )}

            {sequence.offer_sequence?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Offer Sequence</p>
                <div className="flex flex-col md:flex-row gap-2">
                  {sequence.offer_sequence.map((offer, i) => (
                    <div key={i} className="flex-1 light-card rounded-xl p-4 border border-border relative">
                      {i < sequence.offer_sequence.length - 1 && (
                        <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-primary text-lg font-black">→</div>
                      )}
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-sm mb-2">{offer.stage}</Badge>
                      <p className="text-foreground font-bold text-sm">{offer.offer_name}</p>
                      <p className="text-emerald-600 font-black text-base">{offer.price > 0 ? `$${offer.price.toLocaleString()}` : 'FREE'}</p>
                      <p className="text-muted-foreground text-sm mt-1">{offer.conversion_goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sequence.phases?.map((phase, i) => {
              const colors = PHASE_COLORS[i % PHASE_COLORS.length];
              return (
                <div key={i} className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}>
                  <button
                    onClick={e => {
                      const body = e.currentTarget.nextElementSibling;
                      body.style.display = body.style.display === 'none' ? 'block' : 'none';
                      e.currentTarget.querySelector('.chevron').style.transform =
                        body.style.display === 'block' ? 'rotate(180deg)' : '';
                    }}
                    className="w-full px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${colors.dot} flex items-center justify-center text-white font-black text-sm`}>
                        {phase.phase_number || i + 1}
                      </div>
                      <div className="text-left">
                        <p className="text-foreground font-bold">{phase.phase_name}</p>
                        <p className="text-muted-foreground text-sm">Day {phase.day_start}–{phase.day_end} · Target: ${(phase.revenue_target || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground chevron transition-transform duration-200" />
                  </button>
                  <div className="border-t border-black/10 px-5 pb-5 pt-3 space-y-4" style={{ display: i === 0 ? 'block' : 'none' }}>
                    <p className="text-foreground/80 text-sm">{phase.objective}</p>

                    {phase.daily_steps?.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Daily Actions</p>
                        {phase.daily_steps.map((step, j) => (
                          <div key={j} className="p-3 rounded-lg bg-card/60 border border-black/5">
                            <div className="flex items-center justify-between mb-1">
                              <Badge className={`${colors.badge} text-sm`}>{step.day_range}</Badge>
                              <span className="text-muted-foreground text-sm flex items-center gap-1"><Clock className="w-3 h-3" />{step.time_required}</span>
                            </div>
                            <p className="text-foreground font-semibold text-sm">{step.task}</p>
                            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{step.how_to}</p>
                            {step.expected_output && (
                              <p className="text-emerald-600 text-sm mt-1">✓ Output: {step.expected_output}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-3">
                      {phase.key_metrics?.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Track These</p>
                          <ul className="space-y-1">
                            {phase.key_metrics.map((m, j) => (
                              <li key={j} className="text-foreground/80 text-sm flex items-start gap-2">
                                <Target className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />{m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {phase.bottlenecks?.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Watch Out For</p>
                          <ul className="space-y-1">
                            {phase.bottlenecks.map((b, j) => (
                              <li key={j} className="text-amber-700 text-sm flex items-start gap-2">
                                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />{b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {phase.phase_win && (
                      <div className="p-3 rounded-lg border border-emerald-300/50 bg-emerald-50">
                        <p className="text-emerald-600 text-sm font-bold uppercase mb-1">🏆 Phase Win</p>
                        <p className="text-foreground text-sm">{phase.phase_win}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sequence.top_channels?.length > 0 && (
              <Section title="Top 3 Channels to Dominate" icon={TrendingUp} defaultOpen={true}>
                <div className="space-y-3 pt-2">
                  {sequence.top_channels.map((ch, i) => (
                    <div key={i} className="p-4 rounded-lg bg-secondary border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full accent-gradient flex items-center justify-center text-white text-sm font-black">{i + 1}</div>
                        <p className="text-foreground font-bold text-sm">{ch.channel}</p>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">{ch.why}</p>
                      <div className="p-2 rounded bg-primary/5 border border-primary/20">
                        <p className="text-primary text-sm font-semibold">Daily Action:</p>
                        <p className="text-foreground/80 text-sm mt-0.5">{ch.daily_action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {sequence.content_calendar?.length > 0 && (
              <Section title="7-Day Content Calendar" icon={Calendar}>
                <div className="space-y-2 pt-2">
                  {sequence.content_calendar.map((post, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className="bg-secondary text-muted-foreground text-sm">Day {post.day}</Badge>
                        <span className="text-primary text-sm font-semibold">{post.platform}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-foreground font-semibold text-sm">"{post.hook}"</p>
                        <CopyBtn text={`${post.hook}\n\n${post.content_angle}\n\n${post.cta}`} />
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">{post.content_angle}</p>
                      <p className="text-primary text-sm mt-1">CTA: {post.cta}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {sequence.weekly_non_negotiables?.length > 0 && (
              <Section title="Weekly Non-Negotiables" icon={Flag} defaultOpen={true}>
                <div className="space-y-3 pt-2">
                  {sequence.weekly_non_negotiables.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                      <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-black flex-shrink-0 mt-0.5">{i + 1}</div>
                      <div className="flex-1">
                        <p className="text-foreground font-semibold text-sm">{item.action}</p>
                        <p className="text-muted-foreground text-sm mt-0.5">{item.why}</p>
                        {item.time_block && <p className="text-primary text-sm mt-1">⏱ {item.time_block}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {sequence.success_metrics && (
              <Section title="Weekly Success Benchmarks" icon={Target}>
                <div className="grid grid-cols-2 gap-3 pt-3">
                  {Object.entries(sequence.success_metrics).map(([week, target]) => (
                    <div key={week} className="p-3 rounded-lg bg-secondary border border-border">
                      <p className="text-primary text-sm font-bold uppercase mb-1">{week.replace('_', ' ')}</p>
                      <p className="text-foreground text-sm">{target}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {sequence.kill_switches?.length > 0 && (
              <Section title="Kill Switches — When to Pivot" icon={AlertTriangle} accentClass="border-rose-300">
                <div className="space-y-3 pt-2">
                  {sequence.kill_switches.map((ks, i) => (
                    <div key={i} className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                      <p className="text-rose-700 font-semibold text-sm">⚠️ {ks.warning_sign}</p>
                      <p className="text-foreground/80 text-sm mt-1">→ {ks.immediate_action}</p>
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
        title="Launch Sequence Agent"
        systemPrompt="You are a launch strategist who builds step-by-step execution plans to scale a business fast. Cover: phased launch calendars, daily actions, offer sequencing, content calendars, channel selection, weekly non-negotiables, and kill switches. Be direct, specific, and give a concrete next action."
        greeting="Hey! I'm your Launch Sequence Agent. Ask me about your launch phases, daily actions, or fastest path to revenue — I'll use your saved business data."
        quickPrompts={["What should I do in my first 14 days?", "What's the fastest path to $10k?", "Which channels should I focus on?", "What are my weekly non-negotiables?"]}
      />
    </AppLayout>
  );
}