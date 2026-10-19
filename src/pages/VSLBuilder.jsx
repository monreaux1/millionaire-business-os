import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { accountStorage } from "@/lib/account-storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Video, Loader2, RotateCcw, ArrowRight, Layout, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import PullToRefresh from "@/components/PullToRefresh";
import VSLScript from "@/components/vsl/VSLScript";
import VSLPageLayout from "@/components/vsl/VSLPageLayout";

const TABS = [
  { id: "script",  label: "🎬 VSL Script",     icon: FileText },
  { id: "layout",  label: "📐 Page Layout",     icon: Layout },
];

export default function VSLBuilder() {
  const [form, setForm]               = useState({ offer: "", audience: "", result: "", price_point: "high", cta_type: "book_call" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput]           = useState(null);
  const [activeTab, setActiveTab]     = useState("script");

  const loadDraft = () => {
    try {
      const stored = accountStorage.getItem("vslBuilderDraft");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.form) setForm((current) => ({ ...current, ...parsed.form }));
        if (parsed.output) setOutput(parsed.output);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
      }
    } catch (error) {
      console.warn("Saved VSL draft could not be loaded:", error);
    }
  };

  useEffect(() => { loadDraft(); }, []);

  useEffect(() => {
    accountStorage.setItem("vslBuilderDraft", JSON.stringify({ form, output, activeTab }));
  }, [form, output, activeTab]);

  const generate = async () => {
    setIsGenerating(true);
    setOutput(null);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a world-class VSL copywriter and funnel architect. Create a complete, high-converting VSL (Video Sales Letter) package.

Offer: ${form.offer}
Audience: ${form.audience}
Desired Result: ${form.result}
Price Point: ${form.price_point}
CTA Type: ${form.cta_type === "book_call" ? "Book a Free Strategy Call" : "Buy Now / Checkout"}

Return a JSON object with:

1. vsl_script: object with these sections (each must be FULL written copy — conversational, not placeholder):
   - hook: 3-4 sentences that grab attention immediately. Start with a bold statement, painful truth, or shocking question.
   - problem: 2-3 paragraphs calling out exact pain points, making the viewer feel seen and understood
   - story: 3-4 paragraphs — a relatable story or credibility moment that builds connection and authority
   - solution: 2-3 paragraphs introducing the new approach/method, shifting belief from "this is hard" to "this is possible"
   - offer_breakdown: 2-3 paragraphs explaining what they get, the transformation, and bonuses
   - proof: 2-3 paragraphs presenting social proof, results, testimonials, data
   - cta: 2 paragraphs — a crystal-clear call to action with urgency, followed by FAQ handling (3 objections answered inline)

2. page_sections: array of page section objects for the VSL landing page. Each: 
   section_name, headline, subheadline (optional), body_copy, cta_text (optional), design_notes

3. headlines: array of 8 alternative headline options for the VSL page (strong, outcome-focused)

4. faq: array of 6 FAQ objects: question, answer (2-3 sentences each)

5. urgency_elements: array of 4 urgency/scarcity ideas specific to this offer

6. funnel_flow: array of 4 page objects describing the full funnel: page_name, purpose, headline, key_elements (array of strings)`,
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          vsl_script: {
            type: "object",
            properties: {
              hook:            { type: "string" },
              problem:         { type: "string" },
              story:           { type: "string" },
              solution:        { type: "string" },
              offer_breakdown: { type: "string" },
              proof:           { type: "string" },
              cta:             { type: "string" },
            }
          },
          page_sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                section_name:  { type: "string" },
                headline:      { type: "string" },
                subheadline:   { type: "string" },
                body_copy:     { type: "string" },
                cta_text:      { type: "string" },
                design_notes:  { type: "string" },
              }
            }
          },
          headlines:         { type: "array", items: { type: "string" } },
          faq: {
            type: "array",
            items: {
              type: "object",
              properties: { question: { type: "string" }, answer: { type: "string" } }
            }
          },
          urgency_elements:  { type: "array", items: { type: "string" } },
          funnel_flow: {
            type: "array",
            items: {
              type: "object",
              properties: {
                page_name:    { type: "string" },
                purpose:      { type: "string" },
                headline:     { type: "string" },
                key_elements: { type: "array", items: { type: "string" } },
              }
            }
          }
        }
      }
    });

    setOutput(result);
    setIsGenerating(false);
  };

  const reset = () => { setOutput(null); setActiveTab("script"); };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadDraft}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto hero-radial min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-3 bg-rose-50 text-rose-600 border border-rose-200 text-sm font-semibold tracking-wider px-3 py-1">VSL FUNNEL BUILDER</Badge>
          <h1 className="font-display text-3xl font-black text-foreground mb-2">Build My VSL Funnel</h1>
          <p className="text-muted-foreground">Generates your full Video Sales Letter script + complete landing page layout in one click.</p>
        </div>

        {/* Input Form */}
        {!output && !isGenerating && (
          <div className="space-y-6 mb-8">
            {/* Philosophy Banner */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl border border-border bg-card">
              {[
                { label: "One Goal Only", desc: "Every page does ONE thing" },
                { label: "Hook Is Everything", desc: "Your headline carries the funnel" },
                { label: "Proof Over Persuasion", desc: "Results beat claims every time" },
              ].map(({ label, desc }) => (
                <div key={label} className="text-center">
                  <p className="text-primary font-black text-sm uppercase">{label}</p>
                  <p className="text-muted-foreground text-sm mt-0.5">{desc}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { key: "offer",    label: "What is your offer?",      placeholder: "e.g. 90-day business coaching program for coaches" },
                { key: "audience", label: "Who is your audience?",    placeholder: "e.g. Online coaches making under $5k/mo" },
                { key: "result",   label: "What result do they get?", placeholder: "e.g. Hit $10k months in 90 days" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">{label}</label>
                  <textarea
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">Price Point</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: "low", label: "Low Ticket", sub: "<$500" }, { id: "mid", label: "Mid Ticket", sub: "$500–$3k" }, { id: "high", label: "High Ticket", sub: "$3k+" }].map(p => (
                    <button key={p.id} onClick={() => setForm({ ...form, price_point: p.id })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${form.price_point === p.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
                      <p className={`font-bold text-sm ${form.price_point === p.id ? 'text-primary' : 'text-foreground'}`}>{p.label}</p>
                      <p className="text-muted-foreground text-sm">{p.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">Primary CTA</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ id: "book_call", label: "📞 Book a Call", sub: "High ticket" }, { id: "buy_now", label: "💳 Buy Now", sub: "Direct sale" }].map(c => (
                    <button key={c.id} onClick={() => setForm({ ...form, cta_type: c.id })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${form.cta_type === c.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
                      <p className={`font-bold text-sm ${form.cta_type === c.id ? 'text-primary' : 'text-foreground'}`}>{c.label}</p>
                      <p className="text-muted-foreground text-sm">{c.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={!form.offer || !form.audience || !form.result}
              className="w-full accent-gradient hover:opacity-90 text-white font-black text-lg py-6 rounded-xl"
            >
              <Video className="w-5 h-5 mr-2" />BUILD MY VSL FUNNEL
            </Button>
          </div>
        )}

        {/* Generating */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-foreground font-black text-xl">Building Your VSL Funnel...</p>
            <p className="text-muted-foreground text-sm">Writing script, page copy, headlines, and funnel flow. ~30 seconds.</p>
          </div>
        )}

        {/* Output */}
        {output && !isGenerating && (
          <div className="space-y-6">
            {/* Ready Banner */}
            <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-rose-600 font-black text-lg">🎬 Your VSL Funnel Is Ready</p>
                <p className="text-muted-foreground text-sm mt-1">Script + Page layout + Headlines + FAQ + Funnel flow</p>
              </div>
              <Button onClick={reset} variant="outline" className="border-border text-muted-foreground hover:text-foreground gap-2">
                <RotateCcw className="w-4 h-4" /> Start Over
              </Button>
            </div>

            {/* Funnel Flow Overview */}
            {output.funnel_flow && (
              <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50">
                <p className="text-amber-600 font-black text-sm uppercase mb-4 tracking-wider">Your Complete Funnel Flow</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {output.funnel_flow.map((page, i) => (
                    <React.Fragment key={i}>
                      <div className="flex-shrink-0 w-52 p-4 rounded-xl bg-card border border-border">
                        <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm mb-2">{i + 1}</div>
                        <p className="text-primary font-black text-sm uppercase mb-1">{page.page_name}</p>
                        <p className="text-muted-foreground text-sm mb-2">{page.purpose}</p>
                        <p className="text-foreground text-sm font-semibold italic mb-2">"{page.headline}"</p>
                        <ul className="space-y-1">
                          {page.key_elements?.slice(0, 3).map((el, j) => (
                            <li key={j} className="text-muted-foreground text-sm flex gap-1"><span className="text-primary">•</span>{el}</li>
                          ))}
                        </ul>
                      </div>
                      {i < output.funnel_flow.length - 1 && (
                        <div className="flex items-center flex-shrink-0"><ArrowRight className="w-5 h-5 text-muted-foreground" /></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === t.id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === "script"  && <VSLScript script={output.vsl_script} headlines={output.headlines} urgency={output.urgency_elements} faq={output.faq} />}
            {activeTab === "layout"  && <VSLPageLayout sections={output.page_sections} />}

            {/* Next Step */}
            <Link to="/FunnelBuilder">
              <Button className="w-full accent-gradient hover:opacity-90 text-white font-black text-base py-4 rounded-xl">
                Build This Into My Full Funnel <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}