import React, { useState } from "react";
import { Copy, CheckCheck } from "lucide-react";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0">
      {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function Section({ number, heading, children, copyText }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {number && (
            <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">{number}</span>
          )}
          <h3 className="text-foreground font-black text-lg">{heading}</h3>
        </div>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      {children}
    </div>
  );
}

function TitleBlock({ title, subtitle, what, color = "border-primary/40" }) {
  return (
    <div className={`p-6 rounded-2xl border ${color} bg-card`}>
      <h2 className="text-foreground font-black text-2xl md:text-3xl mb-1">{title}</h2>
      {subtitle && <p className="text-muted-foreground text-base mb-3">{subtitle}</p>}
      {what && (
        <div className="p-3 rounded-lg bg-secondary border border-border">
          <p className="text-primary text-sm font-bold uppercase mb-1">What This Does</p>
          <p className="text-foreground text-sm">{what}</p>
        </div>
      )}
    </div>
  );
}

function CTABlock({ cta }) {
  if (!cta) return null;
  return (
    <div className="p-6 rounded-2xl text-center border border-primary/40 bg-primary/5">
      <p className="text-primary text-sm font-bold uppercase mb-2">Call To Action</p>
      <p className="text-foreground font-bold text-lg">{cta}</p>
    </div>
  );
}

function EbookOutput({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <TitleBlock title={data.title} subtitle={data.subtitle} color="border-purple-300" />
      {data.intro && (
        <Section heading="Introduction">
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{data.intro}</p>
        </Section>
      )}
      {data.toc && (
        <div className="p-5 rounded-2xl border border-border bg-secondary">
          <p className="text-muted-foreground text-sm font-bold uppercase mb-3">Table of Contents</p>
          <ol className="space-y-1">
            {data.toc.map((item, i) => (
              <li key={i} className="text-foreground text-sm flex gap-2"><span className="text-primary font-bold">{i + 1}.</span>{item}</li>
            ))}
          </ol>
        </div>
      )}
      {data.sections?.map((s, i) => (
        <Section key={i} number={i + 1} heading={s.heading} copyText={`${s.heading}\n\n${s.body}\n\nSteps:\n${s.steps?.join("\n")}\n\nExample: ${s.example}`}>
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap mb-4">{s.body}</p>
          {s.steps && (
            <div className="mb-3">
              <p className="text-primary text-sm font-bold uppercase mb-2">Action Steps</p>
              <ol className="space-y-1">
                {s.steps.map((step, j) => (
                  <li key={j} className="text-foreground text-sm flex gap-2"><span className="text-primary font-bold">{j + 1}.</span>{step}</li>
                ))}
              </ol>
            </div>
          )}
          {s.example && (
            <div className="p-3 rounded-lg border border-blue-300 bg-blue-50">
              <p className="text-blue-600 text-sm font-bold uppercase mb-1">Example</p>
              <p className="text-muted-foreground text-sm">{s.example}</p>
            </div>
          )}
        </Section>
      ))}
      {data.final_section && (
        <Section heading="Final Section">
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{data.final_section}</p>
        </Section>
      )}
      <CTABlock cta={data.cta} />
    </div>
  );
}

function ChecklistOutput({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <TitleBlock title={data.title} subtitle={data.subtitle} color="border-emerald-300" />
      {data.intro && (
        <Section heading="How to Use This Checklist">
          <p className="text-muted-foreground text-sm leading-relaxed">{data.intro}</p>
        </Section>
      )}
      {data.categories?.map((cat, i) => (
        <Section key={i} heading={cat.name} copyText={`${cat.name}\n\n${cat.items?.join("\n")}`}>
          <ul className="space-y-2">
            {cat.items?.map((item, j) => (
              <li key={j} className="flex items-start gap-3">
                <span className="w-5 h-5 border-2 border-emerald-500 rounded flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      ))}
      {data.quick_wins && (
        <div className="p-5 rounded-2xl border border-emerald-300 bg-emerald-50">
          <p className="text-emerald-600 font-bold text-sm uppercase mb-3">⚡ Quick Wins — Do These Today</p>
          <ul className="space-y-2">
            {data.quick_wins.map((w, i) => (
              <li key={i} className="text-foreground text-sm flex gap-2"><span className="text-emerald-600">→</span>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <CTABlock cta={data.cta} />
    </div>
  );
}

function PromptPackOutput({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <TitleBlock title={data.title} subtitle={data.subtitle} color="border-blue-300" />
      {data.intro && (
        <Section heading="How to Use These Prompts">
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{data.intro}</p>
        </Section>
      )}
      {data.categories?.map((cat, i) => (
        <Section key={i} heading={`${cat.name} (${cat.prompts?.length || 0} prompts)`} copyText={cat.prompts?.join("\n\n")}>
          <p className="text-muted-foreground text-sm mb-3">{cat.description}</p>
          <div className="space-y-2">
            {cat.prompts?.map((prompt, j) => (
              <div key={j} className="flex gap-3 p-3 rounded-lg bg-secondary border border-border">
                <span className="text-blue-600 font-bold text-sm mt-1 w-6 flex-shrink-0">{j + 1}.</span>
                <p className="text-muted-foreground text-sm flex-1">{prompt}</p>
                <CopyBtn text={prompt} />
              </div>
            ))}
          </div>
        </Section>
      ))}
      {data.usage_tips && (
        <div className="p-5 rounded-2xl border border-blue-300 bg-blue-50">
          <p className="text-blue-600 font-bold text-sm uppercase mb-3">Pro Tips for Using These Prompts</p>
          <ul className="space-y-2">
            {data.usage_tips.map((tip, i) => (
              <li key={i} className="text-muted-foreground text-sm flex gap-2"><span className="text-blue-600">•</span>{tip}</li>
            ))}
          </ul>
        </div>
      )}
      <CTABlock cta={data.cta} />
    </div>
  );
}

function TemplatesOutput({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <TitleBlock title={data.title} subtitle={data.subtitle} color="border-orange-300" />
      {data.intro && (
        <Section heading="How to Use These Templates">
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{data.intro}</p>
        </Section>
      )}
      {data.sections?.map((sec, i) => (
        <Section key={i} heading={sec.name}>
          <p className="text-muted-foreground text-sm mb-4">{sec.description}</p>
          <div className="space-y-3">
            {sec.items?.map((item, j) => (
              <div key={j} className="p-4 rounded-xl bg-secondary border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-orange-600 text-sm font-bold uppercase">{item.label}</p>
                  <CopyBtn text={item.content} />
                </div>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{item.content}</p>
              </div>
            ))}
          </div>
        </Section>
      ))}
      {data.daily_usage && (
        <Section heading="Daily Usage Guide">
          <p className="text-muted-foreground text-sm leading-relaxed">{data.daily_usage}</p>
        </Section>
      )}
      <CTABlock cta={data.cta} />
    </div>
  );
}

function WorkbookOutput({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <TitleBlock title={data.title} subtitle={data.subtitle} color="border-amber-300" />
      {data.intro && (
        <Section heading="Welcome to Your Workbook">
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{data.intro}</p>
        </Section>
      )}
      {data.sections?.map((sec, i) => (
        <Section key={i} number={i + 1} heading={`Section ${i + 1}: ${sec.name}`}>
          <p className="text-muted-foreground text-sm mb-4 italic">{sec.instructions}</p>
          <div className="space-y-3">
            {sec.exercises?.map((ex, j) => (
              <div key={j} className="p-4 rounded-xl bg-secondary border border-amber-300/50">
                <p className="text-amber-600 font-bold text-sm mb-2">✏️ {ex.prompt}</p>
                <div className="min-h-[60px] border border-dashed border-border rounded-lg p-3">
                  <p className="text-muted-foreground/60 text-sm italic">{ex.space_hint}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ))}
      {data.reflection_questions && (
        <div className="p-5 rounded-2xl border border-amber-300 bg-amber-50">
          <p className="text-amber-600 font-bold text-sm uppercase mb-3">Reflection Questions</p>
          <div className="space-y-3">
            {data.reflection_questions.map((q, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-amber-600 font-bold text-sm">{i + 1}.</span>
                <p className="text-muted-foreground text-sm">{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.final_message && (
        <Section heading="You've Got This">
          <p className="text-muted-foreground text-sm leading-relaxed">{data.final_message}</p>
        </Section>
      )}
      <CTABlock cta={data.cta} />
    </div>
  );
}

function MiniTrainingOutput({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <TitleBlock title={data.title} subtitle={data.subtitle} color="border-rose-300" />
      {data.intro && (
        <Section heading="Welcome to Your Mini Training">
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{data.intro}</p>
        </Section>
      )}
      {data.lessons?.map((lesson, i) => (
        <Section key={i} number={i + 1} heading={`Lesson ${i + 1}: ${lesson.title}`} copyText={`${lesson.title}\n\n${lesson.script}\n\nKey Takeaway: ${lesson.key_takeaway}`}>
          <p className="text-rose-600 text-sm font-bold uppercase mb-3">Objective: {lesson.objective}</p>
          <div className="mb-4">
            <p className="text-muted-foreground text-sm font-bold uppercase mb-2">Script / Talking Points</p>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{lesson.script}</p>
          </div>
          {lesson.example && (
            <div className="p-3 rounded-lg border border-blue-300 bg-blue-50 mb-3">
              <p className="text-blue-600 text-sm font-bold uppercase mb-1">Example</p>
              <p className="text-muted-foreground text-sm">{lesson.example}</p>
            </div>
          )}
          <div className="p-3 rounded-lg border border-rose-300 bg-rose-50">
            <p className="text-rose-600 text-sm font-bold uppercase mb-1">Key Takeaway</p>
            <p className="text-foreground font-bold text-sm">{lesson.key_takeaway}</p>
          </div>
        </Section>
      ))}
      {data.bonus_tips && (
        <div className="p-5 rounded-2xl border border-rose-300 bg-rose-50">
          <p className="text-rose-600 font-bold text-sm uppercase mb-3">🔥 Bonus Implementation Tips</p>
          <ul className="space-y-2">
            {data.bonus_tips.map((tip, i) => (
              <li key={i} className="text-muted-foreground text-sm flex gap-2"><span className="text-rose-600">→</span>{tip}</li>
            ))}
          </ul>
        </div>
      )}
      {data.transition && (
        <Section heading="Your Next Step">
          <p className="text-muted-foreground text-sm leading-relaxed">{data.transition}</p>
        </Section>
      )}
      <CTABlock cta={data.cta} />
    </div>
  );
}

export default function FreebieOutput({ type, data }) {
  if (!data) return null;
  switch (type) {
    case "ebook":         return <EbookOutput data={data} />;
    case "checklist":     return <ChecklistOutput data={data} />;
    case "prompt_pack":   return <PromptPackOutput data={data} />;
    case "templates":     return <TemplatesOutput data={data} />;
    case "workbook":      return <WorkbookOutput data={data} />;
    case "mini_training": return <MiniTrainingOutput data={data} />;
    default:
      return <pre className="text-muted-foreground text-sm whitespace-pre-wrap p-4 bg-secondary rounded-xl">{JSON.stringify(data, null, 2)}</pre>;
  }
}