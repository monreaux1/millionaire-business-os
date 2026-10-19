import React from "react";
import { Copy, CheckCheck } from "lucide-react";
import { useState } from "react";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0">
      {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

const SECTION_COLORS = [
  "border-rose-300 bg-rose-50",
  "border-orange-300 bg-orange-50",
  "border-amber-300 bg-amber-50",
  "border-emerald-300 bg-emerald-50",
  "border-blue-300 bg-blue-50",
  "border-purple-300 bg-purple-50",
  "border-pink-300 bg-pink-50",
  "border-cyan-300 bg-cyan-50",
];

export default function VSLPageLayout({ sections }) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Complete page-by-page layout with copy for each section of your VSL landing page.</p>

      {sections.map((sec, i) => {
        const colorClass = SECTION_COLORS[i % SECTION_COLORS.length];
        const copyText = [sec.section_name, sec.headline, sec.subheadline, sec.body_copy, sec.cta_text].filter(Boolean).join("\n\n");

        return (
          <div key={i} className={`rounded-2xl border ${colorClass} p-5`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center font-black text-foreground text-sm flex-shrink-0">{i + 1}</div>
                <div>
                  <p className="text-muted-foreground text-sm font-bold uppercase">{sec.section_name}</p>
                </div>
              </div>
              <CopyBtn text={copyText} />
            </div>

            <div className="mb-3">
              <p className="text-foreground font-black text-lg leading-tight">{sec.headline}</p>
              {sec.subheadline && <p className="text-muted-foreground text-sm mt-1">{sec.subheadline}</p>}
            </div>

            {sec.body_copy && (
              <div className="mb-3 p-3 rounded-lg bg-card/60 border border-border">
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{sec.body_copy}</p>
              </div>
            )}

            {sec.cta_text && (
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2.5 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-primary text-sm font-bold uppercase mb-0.5">CTA Button</p>
                  <p className="text-foreground font-bold text-sm">{sec.cta_text}</p>
                </div>
                <CopyBtn text={sec.cta_text} />
              </div>
            )}

            {sec.design_notes && (
              <div className="mt-3 p-2.5 rounded-lg bg-card/60 border border-border">
                <p className="text-muted-foreground text-sm font-bold uppercase mb-1">Design Notes</p>
                <p className="text-muted-foreground text-sm">{sec.design_notes}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}