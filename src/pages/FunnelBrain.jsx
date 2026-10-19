import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { accountStorage } from "@/lib/account-storage";
import AgentChatBubble from "@/components/AgentChatBubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import {
  Brain, Loader2, Copy, CheckCheck, ChevronDown, ChevronUp, RotateCcw
} from "lucide-react";
import { Link } from "react-router-dom";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0">
      {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function CollapsibleBlock({ title, color, badge, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`rounded-2xl border ${color} bg-card overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5">
        <span className={`font-black text-sm ${badge}`}>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

const GENERATORS = [
  { id: "offer_ladder",   label: "🏗️ Offer Ladder",       desc: "Low / Mid / High ticket stack" },
  { id: "page_copy",      label: "📄 Page Copy",           desc: "Headline → FAQ full page" },
  { id: "email_sms",      label: "📧 Email + SMS",         desc: "Full nurture sequence" },
  { id: "improve_funnel", label: "🔁 Improve My Funnel",   desc: "Rewrite + optimize existing" },
];

export default function FunnelBrain() {
  const [form, setForm]           = useState({ offer: "", audience: "", result: "", price: "", existing_funnel: "" });
  const [activeGen, setActiveGen] = useState("offer_ladder");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput]       = useState(null);

  const loadDraft = () => {
    try {
      const stored = accountStorage.getItem("funnelBrainDraft");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.form) setForm((current) => ({ ...current, ...parsed.form }));
        if (parsed.activeGen) setActiveGen(parsed.activeGen);
        if (parsed.output) setOutput(parsed.output);
      }
    } catch (error) {
      console.warn("Saved Funnel Brain draft could not be loaded:", error);
    }
  };

  useEffect(() => { loadDraft(); }, []);

  useEffect(() => {
    accountStorage.setItem("funnelBrainDraft", JSON.stringify({ form, activeGen, output }));
  }, [form, activeGen, output]);

  const generate = async () => {
    setIsGenerating(true);
    setOutput(null);

    const ctx = `Offer: ${form.offer}\nAudience: ${form.audience}\nDesired Result: ${form.result}\nPrice Point: ${form.price || "not specified"}`;

    let prompt = "";

    if (activeGen === "offer_ladder") {
      prompt = `You are an elite offer architect. Create a complete 3-tier offer ladder.

${ctx}

Return JSON:
- ladder: array of 3 offer objects: tier ("low"/"mid"/"high"), name, price_range, format, what_included (array of 5-7 items), transformation, guarantee, who_its_for, why_it_converts
- positioning_note: paragraph on how to position all 3 together
- upsell_path: string describing the ascension path (low → mid → high)
- pricing_psychology: array of 3 pricing tips specific to this offer`;
    }

    if (activeGen === "page_copy") {
      prompt = `You are a world-class direct response copywriter. Generate complete landing page copy.

${ctx}

Return JSON with these sections (all fully written, not placeholders):
- headline: the main hero headline (outcome-driven, specific)
- subheadline: 1-sentence supporting statement
- hero_body: 2-paragraph hero section body copy
- problem_section: { heading, paragraphs (array of 2) }
- opportunity_shift: { heading, body (2 paragraphs), mechanism_name (the unique method name) }
- offer_stack: { heading, items (array of 5-7 deliverables with name + value statement) }
- proof_section: { heading, testimonial_templates (array of 3 template testimonials), social_proof_stats (array of 3 credibility points) }
- pricing_block: { heading, price_display, anchor_price, value_stack_total, guarantee }
- faq: array of 6 objects: question, answer
- cta_primary: main CTA button text
- cta_secondary: secondary CTA or urgency line
- urgency_bar: short urgency/scarcity text for top of page`;
    }

    if (activeGen === "email_sms") {
      prompt = `You are a conversion-focused email copywriter. Generate a complete nurture + sales sequence.

${ctx}

Return JSON:
- email_sequence: array of 7 email objects: day (number), subject, preview_text, body (full written email — 3-5 paragraphs), cta_text, cta_purpose
- sms_sequence: array of 5 SMS objects: timing (e.g. "Day 1 - 2hrs after opt-in"), message (full SMS under 160 chars), purpose
- sequence_strategy: paragraph explaining the overall sequence logic`;
    }

    if (activeGen === "improve_funnel") {
      prompt = `You are a funnel optimization expert. Analyze and rewrite this funnel to maximize conversions.

${ctx}

Existing funnel description: ${form.existing_funnel || "Not provided — generate best-practice improvements for this type of offer."}

Return JSON:
- diagnosis: array of 5 specific problems with this funnel (or common problems for this offer type)
- rewrites: array of 5 improvement objects: section, problem, improved_copy (the actual rewritten copy), why_it_converts
- quick_wins: array of 3 changes to make today
- a_b_tests: array of 3 A/B test ideas with hypothesis and what to measure
- funnel_score: number 1-10 representing current estimated conversion health, score_reasoning (sentence)`;
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6"
    });

    // Parse if string
    let parsed = result;
    if (typeof result === "string") {
      try { parsed = JSON.parse(result); } catch { parsed = { raw: result }; }
    }

    setOutput({ type: activeGen, data: parsed });
    setIsGenerating(false);
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadDraft}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto hero-radial min-h-screen">
        <div className="mb-8">
          <Badge className="mb-3 bg-purple-50 text-purple-600 border border-purple-200 text-sm font-semibold tracking-wider px-3 py-1">FUNNEL BRAIN</Badge>
          <h1 className="font-display text-3xl font-black text-foreground mb-2">Offer + Funnel Brain</h1>
          <p className="text-muted-foreground">Your AI layer. Generates offers, page copy, email sequences, and funnel rewrites.</p>
        </div>

        {/* Generator Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {GENERATORS.map(g => (
            <button key={g.id} onClick={() => { setActiveGen(g.id); setOutput(null); }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${activeGen === g.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
              <p className={`font-bold text-sm mb-1 ${activeGen === g.id ? 'text-primary' : 'text-foreground'}`}>{g.label}</p>
              <p className="text-muted-foreground text-sm">{g.desc}</p>
            </button>
          ))}
        </div>

        {/* Form */}
        {!output && !isGenerating && (
          <div className="space-y-4 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { key: "offer",    label: "Your Offer",          placeholder: "e.g. Business coaching for coaches" },
                { key: "audience", label: "Your Audience",       placeholder: "e.g. Online coaches under $5k/mo" },
                { key: "result",   label: "The Promised Result", placeholder: "e.g. $10k months in 90 days" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">{label}</label>
                  <textarea value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder} rows={2}
                    className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50 resize-none" />
                </div>
              ))}
            </div>

            {activeGen === "offer_ladder" && (
              <div>
                <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">Price Range (optional)</label>
                <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. $97 low, $997 mid, $5,000+ high"
                  className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50" />
              </div>
            )}

            {activeGen === "improve_funnel" && (
              <div>
                <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">Describe Your Existing Funnel (optional)</label>
                <textarea value={form.existing_funnel} onChange={e => setForm({ ...form, existing_funnel: e.target.value })}
                  placeholder="e.g. Landing page with opt-in for free guide, then email sequence, VSL page, call booking..."
                  rows={3}
                  className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50 resize-none" />
              </div>
            )}

            <Button onClick={generate} disabled={!form.offer || !form.audience || !form.result}
              className="w-full accent-gradient hover:opacity-90 text-white font-black text-lg py-6 rounded-xl">
              <Brain className="w-5 h-5 mr-2" />
              {GENERATORS.find(g => g.id === activeGen)?.label}
            </Button>
          </div>
        )}

        {/* Loading */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-foreground font-black text-xl">Running the AI...</p>
            <p className="text-muted-foreground text-sm">~30 seconds for full output.</p>
          </div>
        )}

        {/* Output */}
        {output && !isGenerating && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-primary font-black">✅ {GENERATORS.find(g => g.id === output.type)?.label} Ready</p>
              <Button onClick={() => setOutput(null)} variant="outline" className="border-border text-muted-foreground gap-2 text-sm">
                <RotateCcw className="w-4 h-4" /> Start Over
              </Button>
            </div>

            {output.type === "offer_ladder" && <OfferLadderOutput data={output.data} />}
            {output.type === "page_copy" && <PageCopyOutput data={output.data} />}
            {output.type === "email_sms" && <EmailSmsOutput data={output.data} />}
            {output.type === "improve_funnel" && <ImproveFunnelOutput data={output.data} />}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link to="/VSLBuilder">
                <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl text-sm">Build VSL Script →</Button>
              </Link>
              <Link to="/FunnelBuilder">
                <Button className="w-full accent-gradient hover:opacity-90 text-white font-bold py-3 rounded-xl text-sm">Open Funnel Studio →</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      </PullToRefresh>
      <AgentChatBubble
        title="Funnel Brain"
        systemPrompt="You are a funnel brain — an AI layer that generates offers, page copy, email sequences, and funnel rewrites. You think in direct-response frameworks and conversion optimization. Be direct, specific, and give a concrete next action."
        greeting="Hey! I'm your Funnel Brain. Ask me about offer ladders, page copy, email sequences, or funnel improvements — I'll use your saved business data."
        quickPrompts={["Build me an offer ladder", "Write my landing page headline", "What should my email sequence look like?", "How can I improve my funnel?"]}
      />
    </AppLayout>
  );
}

// ─── OUTPUT COMPONENTS ────────────────────────────────────────────────────────

function OfferLadderOutput({ data }) {
  const tierColors = { low: "border-emerald-300 text-emerald-600", mid: "border-amber-300 text-amber-600", high: "border-purple-300 text-purple-600" };
  return (
    <div className="space-y-4">
      {data.ladder?.map((tier, i) => (
        <CollapsibleBlock key={i} title={`${tier.tier?.toUpperCase()} TICKET — ${tier.name} (${tier.price_range})`}
          color={tierColors[tier.tier] || "border-border"} badge={tierColors[tier.tier]?.split(" ")[1] || "text-foreground"}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm uppercase font-bold mb-2">What's Included</p>
              <ul className="space-y-1">{tier.what_included?.map((item, j) => <li key={j} className="text-muted-foreground text-sm flex gap-2"><span className="text-primary">✓</span>{item}</li>)}</ul>
            </div>
            <div className="space-y-3">
              <div><p className="text-muted-foreground text-sm uppercase font-bold mb-1">Transformation</p><p className="text-foreground text-sm">{tier.transformation}</p></div>
              <div><p className="text-muted-foreground text-sm uppercase font-bold mb-1">Guarantee</p><p className="text-muted-foreground text-sm">{tier.guarantee}</p></div>
              <div><p className="text-muted-foreground text-sm uppercase font-bold mb-1">Who It's For</p><p className="text-muted-foreground text-sm">{tier.who_its_for}</p></div>
            </div>
          </div>
        </CollapsibleBlock>
      ))}
      {data.upsell_path && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-amber-600 text-sm font-bold uppercase mb-1">Ascension Path</p>
          <p className="text-muted-foreground text-sm">{data.upsell_path}</p>
        </div>
      )}
      {data.positioning_note && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-muted-foreground text-sm font-bold uppercase mb-1">Positioning Strategy</p>
          <p className="text-muted-foreground text-sm">{data.positioning_note}</p>
        </div>
      )}
    </div>
  );
}

function PageCopyOutput({ data }) {
  const sections = [
    { label: "Hero Headline", value: data.headline, big: true },
    { label: "Subheadline", value: data.subheadline },
    { label: "Hero Body", value: data.hero_body },
    { label: "Problem Heading", value: data.problem_section?.heading },
    { label: "Problem Copy", value: data.problem_section?.paragraphs?.join("\n\n") },
    { label: "Opportunity Shift", value: `${data.opportunity_shift?.heading}\n\n${data.opportunity_shift?.body}` },
    { label: "Urgency Bar", value: data.urgency_bar },
    { label: "Primary CTA", value: data.cta_primary, isBtn: true },
    { label: "Secondary CTA", value: data.cta_secondary },
  ].filter(s => s.value);

  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-muted-foreground text-sm font-bold uppercase">{s.label}</p>
            <CopyBtn text={s.value} />
          </div>
          <p className={`text-foreground whitespace-pre-wrap ${s.big ? "font-black text-xl" : s.isBtn ? "font-black text-lg text-primary" : "text-sm"}`}>{s.value}</p>
        </div>
      ))}
      {data.offer_stack && (
        <div className="p-5 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-amber-600 font-bold text-sm uppercase mb-3">{data.offer_stack.heading}</p>
          <ul className="space-y-2">{data.offer_stack.items?.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm"><span className="text-primary font-bold">✓</span><span className="text-foreground"><strong>{item.name}</strong> — {item.value_statement}</span></li>
          ))}</ul>
        </div>
      )}
      {data.faq && (
        <div className="p-5 rounded-xl border border-border bg-card">
          <p className="text-muted-foreground font-bold text-sm uppercase mb-3">FAQ ({data.faq.length} questions)</p>
          <div className="space-y-3">{data.faq.map((f, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary">
              <p className="text-primary font-bold text-sm mb-1">Q: {f.question}</p>
              <p className="text-muted-foreground text-sm">{f.answer}</p>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}

function EmailSmsOutput({ data }) {
  return (
    <div className="space-y-4">
      {data.sequence_strategy && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
          <p className="text-blue-600 text-sm font-bold uppercase mb-1">Sequence Strategy</p>
          <p className="text-muted-foreground text-sm">{data.sequence_strategy}</p>
        </div>
      )}
      <p className="text-foreground font-black">📧 Email Sequence ({data.email_sequence?.length || 0} emails)</p>
      {data.email_sequence?.map((email, i) => (
        <div key={i} className="p-5 rounded-xl border border-indigo-200 bg-indigo-50">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Badge className="bg-indigo-100 text-indigo-700 text-sm mb-1">Day {email.day}</Badge>
              <p className="text-foreground font-bold">{email.subject}</p>
              <p className="text-muted-foreground text-sm">Preview: {email.preview_text}</p>
            </div>
            <CopyBtn text={`Subject: ${email.subject}\n\n${email.body}\n\n${email.cta_text}`} />
          </div>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{email.body}</p>
          <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-primary text-sm font-bold">CTA: {email.cta_text}</p>
          </div>
        </div>
      ))}

      <p className="text-foreground font-black pt-2">📱 SMS Sequence ({data.sms_sequence?.length || 0} messages)</p>
      {data.sms_sequence?.map((sms, i) => (
        <div key={i} className="p-4 rounded-xl border border-pink-200 bg-pink-50">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge className="bg-pink-100 text-pink-700 text-sm">{sms.timing}</Badge>
            <CopyBtn text={sms.message} />
          </div>
          <p className="text-foreground text-sm">{sms.message}</p>
          <p className="text-muted-foreground text-sm mt-1">Purpose: {sms.purpose}</p>
        </div>
      ))}
    </div>
  );
}

function ImproveFunnelOutput({ data }) {
  return (
    <div className="space-y-4">
      {data.funnel_score && (
        <div className="flex items-center gap-4 p-5 rounded-xl border border-amber-200 bg-amber-50">
          <div className="w-16 h-16 bg-primary text-white rounded-xl flex flex-col items-center justify-center font-black">
            <span className="text-2xl">{data.funnel_score}</span>
            <span className="text-sm">/10</span>
          </div>
          <div>
            <p className="text-amber-600 font-black">Funnel Health Score</p>
            <p className="text-muted-foreground text-sm">{data.score_reasoning}</p>
          </div>
        </div>
      )}

      {data.quick_wins && (
        <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50">
          <p className="text-emerald-600 font-black text-sm uppercase mb-3">⚡ Quick Wins — Do These First</p>
          <ul className="space-y-2">{data.quick_wins.map((w, i) => (
            <li key={i} className="flex gap-2 text-sm"><span className="text-emerald-600 font-bold">{i + 1}.</span><span className="text-foreground">{w}</span></li>
          ))}</ul>
        </div>
      )}

      {data.rewrites?.map((r, i) => (
        <div key={i} className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <Badge className="bg-secondary text-muted-foreground text-sm mb-1">{r.section}</Badge>
              <p className="text-rose-600 text-sm mb-2">Problem: {r.problem}</p>
            </div>
            <CopyBtn text={r.improved_copy} />
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-emerald-600 text-sm font-bold uppercase mb-1">Improved Copy</p>
            <p className="text-foreground text-sm whitespace-pre-wrap">{r.improved_copy}</p>
          </div>
          <p className="text-muted-foreground text-sm mt-2">Why it converts: {r.why_it_converts}</p>
        </div>
      ))}

      {data.a_b_tests && (
        <div className="p-5 rounded-xl border border-purple-200 bg-purple-50">
          <p className="text-purple-600 font-black text-sm uppercase mb-3">A/B Tests to Run</p>
          <div className="space-y-3">{data.a_b_tests.map((t, i) => (
            <div key={i} className="p-3 rounded-lg bg-card">
              <p className="text-foreground font-bold text-sm">{t.hypothesis}</p>
              <p className="text-muted-foreground text-sm mt-1">Measure: {t.what_to_measure}</p>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}