import React, { useState } from "react";
import { Copy, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";

function CopyBtn({ text, label = "" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">
      {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
      {label && <span>{copied ? "Copied!" : label}</span>}
    </button>
  );
}

const SCRIPT_SECTIONS = [
  { key: "hook",            label: "🎣 Hook",             color: "border-rose-300",    badge: "bg-rose-100 text-rose-700",    tip: "First 5 seconds. This determines if they keep watching." },
  { key: "problem",         label: "💥 Problem",          color: "border-orange-300",  badge: "bg-orange-100 text-orange-700", tip: "Make them feel seen. Name their exact pain." },
  { key: "story",           label: "📖 Story / Credibility", color: "border-amber-300", badge: "bg-amber-100 text-amber-700", tip: "Build connection and authority through narrative." },
  { key: "solution",        label: "🔥 Solution",         color: "border-emerald-300", badge: "bg-emerald-100 text-emerald-700", tip: "The belief shift. New method, new possibility." },
  { key: "offer_breakdown", label: "📦 Offer Breakdown",  color: "border-blue-300",    badge: "bg-blue-100 text-blue-700",    tip: "Stack the value. What exactly do they get?" },
  { key: "proof",           label: "🧾 Proof Stack",      color: "border-purple-300",  badge: "bg-purple-100 text-purple-700", tip: "Proof beats persuasion. Let the results speak." },
  { key: "cta",             label: "💰 CTA + FAQ",        color: "border-primary/40",  badge: "bg-primary/10 text-primary",   tip: "Clear action. Handle objections inline." },
];

function ScriptBlock({ label, content, color, badge, tip }) {
  const [open, setOpen] = useState(true);
  if (!content) return null;
  return (
    <div className={`rounded-2xl border ${color} bg-card overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-sm font-bold ${badge}`}>{label}</span>
          <span className="text-muted-foreground text-sm hidden md:block">{tip}</span>
        </div>
        <div className="flex items-center gap-2">
          <CopyBtn text={content} />
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      )}
    </div>
  );
}

export default function VSLScript({ script, headlines, urgency, faq }) {
  const [showHeadlines, setShowHeadlines] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  const fullScript = script
    ? Object.entries(script).map(([k, v]) => `=== ${k.toUpperCase()} ===\n\n${v}`).join("\n\n")
    : "";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CopyBtn text={fullScript} label="Copy Full Script" />
      </div>

      {SCRIPT_SECTIONS.map(s => (
        <ScriptBlock key={s.key} content={script?.[s.key]} {...s} />
      ))}

      {headlines && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <button onClick={() => setShowHeadlines(!showHeadlines)} className="w-full flex items-center justify-between p-5 text-left">
            <p className="text-foreground font-black text-sm">🎯 Alternative Headlines ({headlines.length})</p>
            {showHeadlines ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showHeadlines && (
            <div className="px-5 pb-5 space-y-2">
              {headlines.map((h, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary border border-border">
                  <span className="text-primary font-bold text-sm mt-0.5">{i + 1}</span>
                  <p className="text-foreground text-sm flex-1">{h}</p>
                  <CopyBtn text={h} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {urgency && (
        <div className="p-5 rounded-2xl border border-rose-300 bg-rose-50">
          <p className="text-rose-600 font-black text-sm uppercase mb-3 tracking-wider">⏳ Urgency & Scarcity Elements</p>
          <ul className="space-y-2">
            {urgency.map((u, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-rose-600 font-bold text-sm mt-0.5">→</span>
                <p className="text-muted-foreground text-sm flex-1">{u}</p>
                <CopyBtn text={u} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {faq && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <button onClick={() => setShowFaq(!showFaq)} className="w-full flex items-center justify-between p-5 text-left">
            <p className="text-foreground font-black text-sm">❓ FAQ / Objection Handling ({faq.length} questions)</p>
            {showFaq ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showFaq && (
            <div className="px-5 pb-5 space-y-3">
              {faq.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-secondary border border-border">
                  <p className="text-primary font-bold text-sm mb-2">Q: {item.question}</p>
                  <p className="text-muted-foreground text-sm">{item.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}