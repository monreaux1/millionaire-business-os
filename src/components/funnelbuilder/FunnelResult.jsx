import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, ChevronDown, Copy, Check, Target, Mail,
  Users, ArrowRight, Download, ExternalLink, FileJson,
  Palette, Megaphone, Layout, ShoppingCart, TrendingUp, PartyPopper
} from "lucide-react";
import { Link } from "react-router-dom";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      aria-label="Copy to clipboard"
      className="min-h-[44px] min-w-[44px] grid place-items-center rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/5 transition-colors">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          {Icon && <Icon className="w-4 h-4 text-primary" />} <span>{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-border">{children}</div>}
    </div>
  );
}

function CopyBlock({ label, text }) {
  if (!text) return null;
  return (
    <div className="p-3 rounded-lg bg-secondary border border-border flex items-start justify-between gap-2">
      <div>
        <p className="text-sm font-bold text-muted-foreground uppercase mb-1">{label}</p>
        <p className="text-foreground text-sm">{text}</p>
      </div>
      <CopyBtn text={text} />
    </div>
  );
}

export default function FunnelResult({ funnel, onRegenerate, onRestart }) {
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(funnel, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${funnel.funnel_name || "funnel"}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportText = () => {
    let txt = `FUNNEL: ${funnel.funnel_name}\nType: ${funnel.funnel_type}\nVisual Mode: ${funnel.visual_mode}\n\n${funnel.funnel_summary}\n\n`;
    const pages = [["LANDING PAGE", funnel.landing_page], ["ORDER PAGE", funnel.order_page], ["UPSELL PAGE", funnel.upsell_page], ["THANK YOU PAGE", funnel.thank_you_page]];
    pages.forEach(([name, p]) => {
      if (p) { txt += `\n=== ${name} ===\n${JSON.stringify(p, null, 2)}\n`; }
    });
    if (funnel.ad_creative) txt += `\n=== AD CREATIVE ===\n${JSON.stringify(funnel.ad_creative, null, 2)}\n`;
    if (funnel.email_sequence?.length) {
      txt += "\n=== EMAIL SEQUENCE ===\n";
      funnel.email_sequence.forEach((e) => { txt += `\nDay ${e.day} — ${e.email_type}\nSubject: ${e.subject_line}\n${e.opening_line}\n${e.core_message}\nCTA: ${e.cta}\n`; });
    }
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${funnel.funnel_name || "funnel"}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="light-card rounded-2xl p-6 accent-border space-y-3 text-center">
        <Badge className="bg-primary/20 text-primary border-primary/30">Funnel Assets Ready</Badge>
        <h2 className="text-2xl font-display font-bold text-foreground">{funnel.funnel_name}</h2>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge className="bg-secondary text-muted-foreground border-border">{funnel.funnel_type}</Badge>
          {funnel.visual_mode && <Badge className="bg-primary/10 text-primary border border-primary/20">{funnel.visual_mode}</Badge>}
        </div>
        {funnel.funnel_summary && <p className="text-muted-foreground text-sm max-w-xl mx-auto pt-2">{funnel.funnel_summary}</p>}
      </div>

      {/* Export bar */}
      <div className="light-card rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-foreground">Export & Deploy</p>
            <p className="text-muted-foreground text-sm">Send your funnel to your platform of choice.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={exportJSON} className="border-border text-foreground hover:text-foreground"><FileJson className="w-4 h-4 mr-2" /> JSON</Button>
            <Button variant="outline" onClick={exportText} className="border-border text-foreground hover:text-foreground"><Download className="w-4 h-4 mr-2" /> Text</Button>
            <Link to="/FunnelCreator"><Button className="bg-black text-white hover:bg-black/85 font-bold"><Layout className="w-4 h-4 mr-2" /> Edit and Preview Pages</Button></Link>
            <Link to="/DeploymentCenter"><Button className="accent-gradient text-white font-bold"><ExternalLink className="w-4 h-4 mr-2" /> Deployment Center</Button></Link>
          </div>
        </div>
      </div>

      {/* Verdict */}
      {funnel.funnel_verdict && (
        <div className="rounded-xl p-4 border border-primary/30 bg-primary/5 flex items-start justify-between gap-3">
          <div>
            <p className="text-primary text-sm font-bold uppercase mb-1">Funnel Verdict</p>
            <p className="text-foreground text-sm leading-relaxed">{funnel.funnel_verdict}</p>
          </div>
          <CopyBtn text={funnel.funnel_verdict} />
        </div>
      )}

      {/* Brand System */}
      {funnel.brand_system && (
        <Section title="Brand System" icon={Palette} defaultOpen>
          <div className="grid md:grid-cols-2 gap-3 pt-2">
            {funnel.brand_system.primary_color && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                <div className="w-8 h-8 rounded-full border border-border" style={{ background: funnel.brand_system.primary_color }} />
                <div><p className="text-sm text-muted-foreground">Primary</p><p className="text-sm font-mono">{funnel.brand_system.primary_color}</p></div>
              </div>
            )}
            {funnel.brand_system.secondary_color && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                <div className="w-8 h-8 rounded-full border border-border" style={{ background: funnel.brand_system.secondary_color }} />
                <div><p className="text-sm text-muted-foreground">Secondary</p><p className="text-sm font-mono">{funnel.brand_system.secondary_color}</p></div>
              </div>
            )}
            {funnel.brand_system.accent_color && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                <div className="w-8 h-8 rounded-full border border-border" style={{ background: funnel.brand_system.accent_color }} />
                <div><p className="text-sm text-muted-foreground">Accent</p><p className="text-sm font-mono">{funnel.brand_system.accent_color}</p></div>
              </div>
            )}
            {funnel.brand_system.headline_font && (
              <div className="p-3 rounded-lg bg-secondary border border-border"><p className="text-sm text-muted-foreground">Headline Font</p><p className="text-sm font-semibold">{funnel.brand_system.headline_font}</p></div>
            )}
            {funnel.brand_system.body_font && (
              <div className="p-3 rounded-lg bg-secondary border border-border"><p className="text-sm text-muted-foreground">Body Font</p><p className="text-sm">{funnel.brand_system.body_font}</p></div>
            )}
            {funnel.brand_system.imagery_direction && (
              <div className="md:col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/20"><p className="text-sm font-bold text-primary uppercase mb-1">Imagery Direction</p><p className="text-sm text-foreground">{funnel.brand_system.imagery_direction}</p></div>
            )}
          </div>
        </Section>
      )}

      {/* Ad Creative */}
      {funnel.ad_creative && (
        <Section title="Ad Creative" icon={Megaphone} defaultOpen>
          <div className="space-y-3 pt-2">
            {funnel.ad_creative.format && <Badge className="bg-secondary text-muted-foreground border border-border">{funnel.ad_creative.format}</Badge>}
            <CopyBlock label="Headline" text={funnel.ad_creative.headline} />
            <CopyBlock label="Subhead" text={funnel.ad_creative.subhead} />
            <CopyBlock label="Visual Direction" text={funnel.ad_creative.visual_direction} />
            <CopyBlock label="CTA" text={funnel.ad_creative.cta_text} />
          </div>
        </Section>
      )}

      {/* Landing Page */}
      {funnel.landing_page && (
        <Section title="Landing Page" icon={Layout} defaultOpen>
          <div className="space-y-3 pt-2">
            <CopyBlock label="Headline" text={funnel.landing_page.headline} />
            <CopyBlock label="Subhead" text={funnel.landing_page.subhead} />
            <CopyBlock label="Hero Visual Direction" text={funnel.landing_page.hero_visual_direction} />
            {funnel.landing_page.pain_points?.length > 0 && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <p className="text-sm font-bold text-rose-600 uppercase mb-2">Pain Points</p>
                <ul className="space-y-1">{funnel.landing_page.pain_points.map((p, i) => <li key={i} className="text-sm text-foreground flex items-start gap-2"><ArrowRight className="w-3 h-3 text-rose-500 mt-1 flex-shrink-0" />{p}</li>)}</ul>
              </div>
            )}
            {funnel.landing_page.benefit_bullets?.length > 0 && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm font-bold text-emerald-600 uppercase mb-2">Benefit Bullets</p>
                <ul className="space-y-1">{funnel.landing_page.benefit_bullets.map((b, i) => <li key={i} className="text-sm text-foreground flex items-start gap-2"><ArrowRight className="w-3 h-3 text-emerald-500 mt-1 flex-shrink-0" />{b}</li>)}</ul>
              </div>
            )}
            {funnel.landing_page.offer_stack?.length > 0 && (
              <div className="p-3 rounded-lg bg-secondary border border-border">
                <p className="text-sm font-bold text-muted-foreground uppercase mb-2">Offer Stack (what's included)</p>
                <ul className="space-y-1">{funnel.landing_page.offer_stack.map((o, i) => <li key={i} className="text-sm text-foreground flex items-start gap-2"><span className="text-primary font-bold">✓</span>{o}</li>)}</ul>
              </div>
            )}
            <CopyBlock label="Social Proof" text={funnel.landing_page.social_proof} />
            <CopyBlock label="Price Anchor" text={funnel.landing_page.price_anchor} />
            <CopyBlock label="Guarantee" text={funnel.landing_page.guarantee} />
            <CopyBlock label="Urgency Block" text={funnel.landing_page.urgency_block} />
            <CopyBlock label="CTA" text={funnel.landing_page.cta_text} />
            {funnel.landing_page.sections?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-muted-foreground uppercase">Page Sections</p>
                {funnel.landing_page.sections.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary border border-border">
                    <p className="text-sm font-semibold text-foreground">{s.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{s.copy}</p>
                    {s.visual_direction && <p className="text-sm text-primary mt-1">🎨 {s.visual_direction}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Order Page */}
      {funnel.order_page && (
        <Section title="Order Page" icon={ShoppingCart}>
          <div className="space-y-3 pt-2">
            <CopyBlock label="Headline" text={funnel.order_page.headline} />
            <CopyBlock label="Order Summary" text={funnel.order_page.order_summary} />
            <CopyBlock label="Price Display" text={funnel.order_page.price_display} />
            <CopyBlock label="Payment Options" text={funnel.order_page.payment_options} />
            <CopyBlock label="Guarantee" text={funnel.order_page.guarantee_block} />
            <CopyBlock label="CTA" text={funnel.order_page.cta_text} />
          </div>
        </Section>
      )}

      {/* Upsell Page */}
      {funnel.upsell_page && (
        <Section title="Upsell Page" icon={TrendingUp}>
          <div className="space-y-3 pt-2">
            <CopyBlock label="Headline" text={funnel.upsell_page.headline} />
            <CopyBlock label="Offer" text={funnel.upsell_page.offer} />
            <CopyBlock label="Price" text={funnel.upsell_page.price} />
            <CopyBlock label="Reason Why" text={funnel.upsell_page.reason_why} />
            <CopyBlock label="CTA" text={funnel.upsell_page.cta_text} />
          </div>
        </Section>
      )}

      {/* Thank You Page */}
      {funnel.thank_you_page && (
        <Section title="Thank-You Page" icon={PartyPopper}>
          <div className="space-y-3 pt-2">
            <CopyBlock label="Headline" text={funnel.thank_you_page.headline} />
            {funnel.thank_you_page.next_steps?.length > 0 && (
              <div className="p-3 rounded-lg bg-secondary border border-border">
                <p className="text-sm font-bold text-muted-foreground uppercase mb-2">Next Steps</p>
                <ol className="space-y-1 list-decimal list-inside">{funnel.thank_you_page.next_steps.map((s, i) => <li key={i} className="text-sm text-foreground">{s}</li>)}</ol>
              </div>
            )}
            <CopyBlock label="Onboarding Instructions" text={funnel.thank_you_page.onboarding_instructions} />
            <CopyBlock label="Community Link" text={funnel.thank_you_page.community_link} />
          </div>
        </Section>
      )}

      {/* Traffic sources */}
      {funnel.traffic_sources?.length > 0 && (
        <Section title="Traffic Sources" icon={Users}>
          <div className="space-y-3 pt-2">
            {funnel.traffic_sources.map((src, i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-foreground font-bold text-sm">{src.channel}</p>
                  <Badge className="bg-card text-muted-foreground text-sm border border-border">{src.priority}</Badge>
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
            ))}
          </div>
        </Section>
      )}

      {/* Email sequence */}
      {funnel.email_sequence?.length > 0 && (
        <Section title="Nurture Email Sequence" icon={Mail}>
          <div className="space-y-2 pt-2">
            {funnel.email_sequence.map((email, i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-card text-muted-foreground text-sm border border-border">{email.email_type}</Badge>
                    <span className="text-muted-foreground text-sm">Day {email.day}</span>
                  </div>
                  <CopyBtn text={`Subject: ${email.subject_line}\n\n${email.opening_line}\n\n${email.core_message}\n\nCTA: ${email.cta}`} />
                </div>
                <p className="text-foreground font-semibold text-sm">Subject: {email.subject_line}</p>
                <p className="text-muted-foreground text-sm mt-1 italic">"{email.opening_line}"</p>
                <p className="text-muted-foreground text-sm mt-1">{email.core_message}</p>
                <p className="text-primary text-sm mt-1 font-medium">CTA: {email.cta}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* KPIs */}
      {funnel.kpis?.length > 0 && (
        <Section title="KPIs to Track" icon={Target}>
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

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onRestart} className="border-border text-foreground">Start Over</Button>
        <Button onClick={onRegenerate} className="accent-gradient text-white font-bold"><RefreshCw className="w-4 h-4 mr-2" /> Regenerate Funnel</Button>
      </div>
    </div>
  );
}