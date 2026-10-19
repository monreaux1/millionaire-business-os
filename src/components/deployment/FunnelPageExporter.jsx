import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Code2, Layout, ShoppingCart, TrendingUp, PartyPopper } from "lucide-react";

function buildLandingHTML(page, brand, funnelName) {
  const primary = brand?.primary_color || "#ff5722";
  const secondary = brand?.secondary_color || "#1a1a2e";
  const hFont = brand?.headline_font || "Inter, sans-serif";
  const bFont = brand?.body_font || "Inter, sans-serif";

  const bullets = (page.benefit_bullets || []).map(b => `<li style="margin-bottom:10px;font-size:17px;color:#333;">✅ ${b}</li>`).join("");
  const pains = (page.pain_points || []).map(p => `<li style="margin-bottom:8px;font-size:16px;color:#666;">❌ ${p}</li>`).join("");
  const stack = (page.offer_stack || []).map(o => `<li style="margin-bottom:8px;font-size:16px;color:#333;">✓ ${o}</li>`).join("");
  const sections = (page.sections || []).map(s => `
    <div style="margin-bottom:32px;">
      <h3 style="font-size:22px;font-weight:800;color:${secondary};margin-bottom:10px;font-family:${hFont};">${s.name}</h3>
      <p style="font-size:16px;color:#555;line-height:1.7;font-family:${bFont};">${s.copy}</p>
    </div>`).join("");

  return `<!-- ${funnelName || "Landing Page"} — Landing Page -->
<div style="font-family:${bFont};max-width:800px;margin:0 auto;padding:20px;">
  <!-- HERO -->
  <div style="text-align:center;padding:40px 20px;">
    <h1 style="font-size:38px;font-weight:900;color:${secondary};line-height:1.2;margin-bottom:16px;font-family:${hFont};">${page.headline || ""}</h1>
    <p style="font-size:20px;color:#555;margin-bottom:28px;font-family:${bFont};">${page.subhead || ""}</p>
    <a href="#optin" style="display:inline-block;background:${primary};color:#fff;font-size:20px;font-weight:800;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;">${page.cta_text || "Get Started"}</a>
  </div>

  ${pains ? `<!-- PAIN POINTS -->
  <div style="background:#fff5f5;border-radius:16px;padding:28px;margin-bottom:32px;">
    <h2 style="font-size:24px;font-weight:800;color:#c0392b;margin-bottom:16px;font-family:${hFont};">Sound familiar?</h2>
    <ul style="list-style:none;padding:0;">${pains}</ul>
  </div>` : ""}

  ${bullets ? `<!-- BENEFITS -->
  <div style="background:#f0fdf4;border-radius:16px;padding:28px;margin-bottom:32px;">
    <h2 style="font-size:24px;font-weight:800;color:#16a34a;margin-bottom:16px;font-family:${hFont};">Here's what changes</h2>
    <ul style="list-style:none;padding:0;">${bullets}</ul>
  </div>` : ""}

  ${stack ? `<!-- OFFER STACK -->
  <div style="border:2px solid ${primary};border-radius:16px;padding:28px;margin-bottom:32px;">
    <h2 style="font-size:24px;font-weight:800;color:${primary};margin-bottom:16px;font-family:${hFont};">Everything you get</h2>
    <ul style="list-style:none;padding:0;">${stack}</ul>
    ${page.price_anchor ? `<p style="font-size:18px;color:#888;text-decoration:line-through;margin-top:16px;">${page.price_anchor}</p>` : ""}
  </div>` : ""}

  ${page.social_proof ? `<!-- SOCIAL PROOF -->
  <div style="background:${secondary};color:#fff;border-radius:16px;padding:28px;margin-bottom:32px;">
    <p style="font-size:18px;font-style:italic;line-height:1.6;">"${page.social_proof}"</p>
  </div>` : ""}

  ${page.guarantee ? `<!-- GUARANTEE -->
  <div style="text-align:center;background:#fffbeb;border:1px solid #fcd34d;border-radius:16px;padding:24px;margin-bottom:32px;">
    <p style="font-size:18px;font-weight:700;color:#92400e;">🛡️ ${page.guarantee}</p>
  </div>` : ""}

  ${page.urgency_block ? `<!-- URGENCY -->
  <div style="text-align:center;background:${primary};color:#fff;border-radius:16px;padding:20px;margin-bottom:32px;">
    <p style="font-size:18px;font-weight:800;">⏰ ${page.urgency_block}</p>
  </div>` : ""}

  <!-- OPT-IN FORM -->
  <div id="optin" style="background:${secondary};border-radius:20px;padding:40px;text-align:center;">
    <h2 style="font-size:28px;font-weight:900;color:#fff;margin-bottom:8px;font-family:${hFont};">${page.headline || ""}</h2>
    <p style="font-size:16px;color:#ccc;margin-bottom:24px;">${page.subhead || ""}</p>
    <form style="max-width:400px;margin:0 auto;">
      <input type="text" placeholder="First Name" style="width:100%;padding:14px;border-radius:10px;border:none;margin-bottom:12px;font-size:16px;" />
      <input type="email" placeholder="Email Address" style="width:100%;padding:14px;border-radius:10px;border:none;margin-bottom:12px;font-size:16px;" />
      <button type="submit" style="width:100%;background:${primary};color:#fff;font-size:20px;font-weight:800;padding:16px;border:none;border-radius:10px;cursor:pointer;">${page.cta_text || "Get Access Now"}</button>
    </form>
  </div>

  ${sections}
</div>`;
}

function buildOrderHTML(page, brand, funnelName) {
  const primary = brand?.primary_color || "#ff5722";
  const secondary = brand?.secondary_color || "#1a1a2e";
  const hFont = brand?.headline_font || "Inter, sans-serif";
  const bFont = brand?.body_font || "Inter, sans-serif";

  return `<!-- ${funnelName || "Order Page"} — Order Page -->
<div style="font-family:${bFont};max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="font-size:32px;font-weight:900;color:${secondary};font-family:${hFont};">${page.headline || "Complete Your Order"}</h1>
  </div>
  <div style="border:2px solid ${primary};border-radius:16px;padding:28px;margin-bottom:24px;">
    <p style="font-size:18px;color:#333;line-height:1.7;margin-bottom:16px;">${page.order_summary || ""}</p>
    <p style="font-size:28px;font-weight:900;color:${primary};text-align:center;margin-bottom:16px;">${page.price_display || ""}</p>
    <p style="font-size:15px;color:#666;margin-bottom:20px;">${page.payment_options || ""}</p>
    <form style="max-width:400px;margin:0 auto;">
      <input type="text" placeholder="Card Number" style="width:100%;padding:14px;border-radius:10px;border:1px solid #ddd;margin-bottom:12px;font-size:16px;" />
      <div style="display:flex;gap:12px;">
        <input type="text" placeholder="MM/YY" style="flex:1;padding:14px;border-radius:10px;border:1px solid #ddd;margin-bottom:12px;font-size:16px;" />
        <input type="text" placeholder="CVC" style="flex:1;padding:14px;border-radius:10px;border:1px solid #ddd;margin-bottom:12px;font-size:16px;" />
      </div>
      <button type="submit" style="width:100%;background:${primary};color:#fff;font-size:20px;font-weight:800;padding:16px;border:none;border-radius:10px;cursor:pointer;">${page.cta_text || "Complete Purchase"}</button>
    </form>
  </div>
  ${page.guarantee_block ? `<div style="text-align:center;background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:16px;"><p style="font-size:15px;font-weight:700;color:#92400e;">🛡️ ${page.guarantee_block}</p></div>` : ""}
</div>`;
}

function buildUpsellHTML(page, brand, funnelName) {
  const primary = brand?.primary_color || "#ff5722";
  const secondary = brand?.secondary_color || "#1a1a2e";
  const hFont = brand?.headline_font || "Inter, sans-serif";
  const bFont = brand?.body_font || "Inter, sans-serif";

  return `<!-- ${funnelName || "Upsell Page"} — Upsell Page -->
<div style="font-family:${bFont};max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="background:${primary};color:#fff;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:1px;">WAIT — ONE TIME OFFER</span>
    <h1 style="font-size:30px;font-weight:900;color:${secondary};margin-top:16px;font-family:${hFont};">${page.headline || ""}</h1>
  </div>
  <div style="border:2px solid ${primary};border-radius:16px;padding:28px;margin-bottom:24px;">
    <p style="font-size:18px;color:#333;line-height:1.7;margin-bottom:16px;">${page.offer || ""}</p>
    <p style="font-size:14px;color:#888;margin-bottom:8px;">${page.reason_why || ""}</p>
    <p style="font-size:28px;font-weight:900;color:${primary};text-align:center;margin-bottom:20px;">${page.price || ""}</p>
    <button style="width:100%;background:${primary};color:#fff;font-size:20px;font-weight:800;padding:16px;border:none;border-radius:10px;cursor:pointer;">${page.cta_text || "Yes! Add This to My Order"}</button>
  </div>
  <p style="text-align:center;font-size:14px;color:#999;"><a href="#" style="color:#999;">No thanks, I'll skip this offer</a></p>
</div>`;
}

function buildThankYouHTML(page, brand, funnelName) {
  const primary = brand?.primary_color || "#ff5722";
  const secondary = brand?.secondary_color || "#1a1a2e";
  const hFont = brand?.headline_font || "Inter, sans-serif";
  const bFont = brand?.body_font || "Inter, sans-serif";

  const steps = (page.next_steps || []).map((s, i) => `<li style="margin-bottom:12px;font-size:17px;color:#333;"><strong style="color:${primary};">${i + 1}.</strong> ${s}</li>`).join("");

  return `<!-- ${funnelName || "Thank You Page"} — Thank You Page -->
<div style="font-family:${bFont};max-width:600px;margin:0 auto;padding:20px;text-align:center;">
  <div style="font-size:60px;margin-bottom:16px;">🎉</div>
  <h1 style="font-size:34px;font-weight:900;color:${secondary};margin-bottom:16px;font-family:${hFont};">${page.headline || "You're In!"}</h1>
  ${steps ? `<div style="text-align:left;background:#f9fafb;border-radius:16px;padding:28px;margin-bottom:24px;"><h2 style="font-size:20px;font-weight:800;color:${secondary};margin-bottom:16px;">Next Steps</h2><ol style="list-style:none;padding:0;">${steps}</ol></div>` : ""}
  ${page.onboarding_instructions ? `<p style="font-size:16px;color:#555;line-height:1.7;margin-bottom:24px;">${page.onboarding_instructions}</p>` : ""}
  ${page.community_link ? `<a href="${page.community_link}" style="display:inline-block;background:${primary};color:#fff;font-size:18px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">Join Our Community</a>` : ""}
</div>`;
}

const PAGES = [
  { key: "landing_page", label: "Landing Page", icon: Layout, builder: buildLandingHTML },
  { key: "order_page", label: "Order Page", icon: ShoppingCart, builder: buildOrderHTML },
  { key: "upsell_page", label: "Upsell Page", icon: TrendingUp, builder: buildUpsellHTML },
  { key: "thank_you_page", label: "Thank-You Page", icon: PartyPopper, builder: buildThankYouHTML },
];

export default function FunnelPageExporter({ funnel }) {
  const [activePage, setActivePage] = useState("landing_page");
  const [view, setView] = useState("code"); // code | preview
  const [copied, setCopied] = useState(false);

  const availablePages = PAGES.filter(p => funnel?.[p.key]);
  const pageConfig = PAGES.find(p => p.key === activePage) || availablePages[0];

  if (availablePages.length === 0) {
    return (
      <div className="light-card rounded-2xl border border-orange-300/50 p-6 text-center">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-3">
          <Code2 className="w-4 h-4 text-orange-600" />
        </div>
        <h3 className="text-foreground font-bold mb-1">No Funnel Pages to Export</h3>
        <p className="text-muted-foreground text-sm mb-4">This draft does not include a complete generated page yet. Open Funnel Studio, choose the correct funnel goal, and generate the pages before exporting them.</p>
        <a href="/FunnelBuilder"><Button className="accent-gradient text-white font-bold">Open Funnel Studio</Button></a>
      </div>
    );
  }

  if (!pageConfig || !funnel?.[pageConfig.key]) return null;

  const html = pageConfig.builder(funnel[pageConfig.key], funnel.brand_system, funnel.funnel_name);
  const copy = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="light-card rounded-2xl border border-orange-300/50 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
          <Code2 className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h3 className="text-foreground font-bold">Funnel Page HTML Export</h3>
          <p className="text-muted-foreground text-sm">Paste each page's HTML into a GHL "Custom HTML" element — no manual copywriting needed.</p>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {availablePages.map(p => {
          const PI = p.icon;
          return (
            <button key={p.key} onClick={() => { setActivePage(p.key); setView("code"); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activePage === p.key ? "accent-gradient text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <PI className="w-3.5 h-3.5" />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* View toggle + copy */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          <button onClick={() => setView("code")} aria-pressed={view === "code"} className={`min-h-[44px] px-4 rounded-md text-sm font-semibold ${view === "code" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Code</button>
          <button onClick={() => setView("preview")} aria-pressed={view === "preview"} className={`min-h-[44px] px-4 rounded-md text-sm font-semibold ${view === "preview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Preview</button>
        </div>
        <Button onClick={copy} variant="outline" className={`h-auto py-2 px-4 text-sm ${copied ? "text-emerald-600 border-emerald-300" : "text-muted-foreground hover:text-foreground"}`}>
          {copied ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy HTML</>}
        </Button>
      </div>

      {/* Content */}
      {view === "code" ? (
        <div className="bg-gray-900 rounded-xl p-4 max-h-96 overflow-y-auto">
          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">{html}</pre>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <iframe srcDoc={html} className="w-full h-96 bg-white" title="Page Preview" />
        </div>
      )}

      <div className="mt-5 p-4 rounded-xl bg-orange-50 border border-orange-200">
        <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-black">!</span>
          How to upload this page to your GoHighLevel account
        </h4>
        <ol className="space-y-2.5 text-sm text-orange-900">
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-sm font-bold">1</span>
            <span>Log in to <strong>GoHighLevel</strong> → click <strong>Sites</strong> in the left sidebar → select <strong>Funnels</strong>.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-sm font-bold">2</span>
            <span>Click <strong>+ Add Funnel</strong> → name it (e.g. "{funnel?.funnel_name || "New Funnel"}") → choose a blank template → click <strong>Save</strong>.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-sm font-bold">3</span>
            <span>Inside the funnel, click <strong>+ Add Step</strong> → select <strong>Blank Page</strong> → name it (e.g. "{pageConfig.label}") → click <strong>Save</strong>.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-sm font-bold">4</span>
            <span>Click <strong>Edit</strong> on the new step → in the page builder, click <strong>+ Add Element</strong> → drag a <strong>Custom HTML/Code</strong> element onto the page.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-sm font-bold">5</span>
            <span>Click <strong>Copy HTML</strong> above → paste it into the Custom HTML element's code box → click <strong>Save</strong>.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-sm font-bold">6</span>
            <span>Repeat steps 3–5 for each page tab above (Landing → Order → Upsell → Thank-You), creating a new funnel step for each.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-sm font-bold">7</span>
            <span>Connect each step's opt-in form to your GHL integration: click the form → <strong>Integrations</strong> tab → select your form/trigger → <strong>Save</strong>. Then click <strong>Update</strong> to publish.</span>
          </li>
        </ol>
        <div className="mt-3 pt-3 border-t border-orange-200 text-sm text-orange-700">
          💡 <strong>Tip:</strong> The forms in the HTML are visual only — you must connect them to GHL's native form builder (step 7) for lead capture to work.
        </div>
      </div>
    </div>
  );
}