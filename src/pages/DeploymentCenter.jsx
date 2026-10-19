import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertCircle, Copy, CheckCheck, ExternalLink, Code2 } from "lucide-react";
import GHLDeployer from "@/components/deployment/GHLDeployer";
import FunnelPageExporter from "@/components/deployment/FunnelPageExporter";
import { accountStorage } from "@/lib/account-storage";

function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Button onClick={copy} variant="outline" className={`border-border text-sm h-auto py-2 px-4 ${copied ? 'text-emerald-600 border-emerald-300' : 'text-muted-foreground hover:text-foreground'}`}>
      {copied ? <CheckCheck className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}

const PLATFORMS = [
  {
    id: "gohighlevel",
    name: "Go High Level",
    icon: "🔶",
    color: "border-orange-300",
    accent: "text-orange-600",
    badge: "bg-orange-50 text-orange-600 border-orange-200",
    steps: [
      "Log in to your GHL account and navigate to Sites → Funnels.",
      "Click 'Add Funnel' and name it after your offer.",
      "Use the page copy below to build each funnel step.",
      "Add your form fields and connect to your pipeline.",
      "Set up the automation workflow with the email sequence copy.",
      "Add tags for each stage: lead, prospect, buyer.",
      "Connect your calendar for booking funnels.",
      "Preview and publish your funnel.",
    ],
    url: "https://gohighlevel.com"
  },
  {
    id: "base44",
    name: "Hosted in the app",
    icon: "🔵",
    color: "border-blue-300",
    accent: "text-blue-600",
    badge: "bg-blue-50 text-blue-600 border-blue-200",
    steps: [
      "Open Funnel Studio and choose your goal: freebie, paid product, booking, webinar, or application.",
      "Confirm your offer, brand, call to action, and delivery destination.",
      "Generate the funnel, then edit every page in the native Funnel Creator.",
      "Connect an external checkout link for paid offers or a calendar link for bookings.",
      "Publish the funnel directly in the app and copy its public sharing URL.",
      "All form submissions are saved to the account-protected Lead Dashboard.",
      "Open Payments & Delivery to manage your default checkout and fulfillment links.",
      "Return to Funnel Creator whenever you need to update page copy or connections.",
    ],
    url: null
  },
  {
    id: "taxnitro",
    name: "Tax Nitro",
    icon: "🟢",
    color: "border-emerald-300",
    accent: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
    steps: [
      "Open Tax Nitro and navigate to your office landing page.",
      "Copy the hero section copy below and paste into your page header.",
      "Add the lead capture form with the fields: Name, Email, Phone.",
      "Use the Refund Estimate CTA to drive urgency.",
      "Add the Appointment CTA for consultation bookings.",
      "If selling a tax course, use the mid-ticket offer copy for your sales section.",
      "Embed the client intake funnel by copying the embed code below.",
      "Test your funnel on mobile before going live.",
    ],
    url: null
  },
  {
    id: "export",
    name: "Copy & Paste Export",
    icon: "📄",
    color: "border-gray-300",
    accent: "text-gray-600",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    steps: [
      "Copy the funnel copy sections below.",
      "Paste into any page builder: Wix, Squarespace, Webflow, WordPress.",
      "Use the email sequence copy in your email provider (Mailchimp, ActiveCampaign, etc.).",
      "Copy the SMS sequence into your SMS platform.",
      "The offer copy is ready to paste into any order form.",
      "All content is formatted for easy use — no reformatting needed.",
    ],
    url: null
  },
];

export default function DeploymentCenter() {
  const [data, setData] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [activePlatform, setActivePlatform] = useState("gohighlevel");

  const loadStoredData = () => {
    const stored = accountStorage.getItem("launchSystem");
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed.result);
      if (parsed.intake?.platform) setActivePlatform(parsed.intake.platform);
    }
    const funnelStored = accountStorage.getItem("generatedFunnel");
    if (funnelStored) {
      try { setFunnel(JSON.parse(funnelStored)); } catch {}
    }
  };

  useEffect(() => { loadStoredData(); }, []);

  const platform = PLATFORMS.find(p => p.id === activePlatform) || PLATFORMS[0];

  const exportCopy = data ? `
=== OFFER LADDER ===

LOW TICKET: ${data.offer_ladder?.low_ticket?.name} | ${data.offer_ladder?.low_ticket?.price}
${data.offer_ladder?.low_ticket?.whats_included?.join('\n')}

MID TICKET: ${data.offer_ladder?.mid_ticket?.name} | ${data.offer_ladder?.mid_ticket?.price}
${data.offer_ladder?.mid_ticket?.whats_included?.join('\n')}

HIGH TICKET: ${data.offer_ladder?.high_ticket?.name} | ${data.offer_ladder?.high_ticket?.price}
${data.offer_ladder?.high_ticket?.whats_included?.join('\n')}

=== FUNNEL MAP ===
Type: ${data.funnel_map?.funnel_type}
${data.funnel_map?.steps?.map((s, i) => `Step ${i+1}: ${s.page}\nHeadline: ${s.headline}\nSubheadline: ${s.subheadline}\nCTA: ${s.cta}`).join('\n\n')}

=== LAUNCH PLAN ===
${data.launch_plan?.map(d => `Day ${d.day}: ${d.theme}\nHook: ${d.hook}\nCTA: ${d.cta}`).join('\n\n')}

=== SALES SCRIPTS ===
DISCOVERY CALL:
${data.sales_system?.discovery_call_script}

DM SCRIPT:
${data.sales_system?.dm_script}

CLOSE:
${data.sales_system?.closing_statement}
  `.trim() : "";

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadStoredData}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto hero-radial min-h-screen">
        <div className="mb-8">
          <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">DEPLOYMENT CENTER</Badge>
          <h1 className="font-display text-3xl font-black text-foreground mb-2">Deploy Your Funnel</h1>
          <p className="text-muted-foreground">Choose your platform and follow the step-by-step deployment guide.</p>
        </div>

        {!data && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-foreground font-bold text-xl mb-2">No Launch System Found</h2>
            <Link to="/IdeaIntake"><Button className="accent-gradient text-white font-bold mt-4 hover:opacity-90">Start Idea Intake</Button></Link>
          </div>
        )}

        {data && (
          <>
            {/* Platform Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setActivePlatform(p.id)}
                  className={`p-4 rounded-2xl border text-center transition-all ${activePlatform === p.id ? `${p.color} bg-secondary` : 'border-border bg-card hover:border-primary/30'}`}>
                  <div className="text-3xl mb-2">{p.icon}</div>
                  <p className={`text-sm font-bold ${activePlatform === p.id ? p.accent : 'text-muted-foreground'}`}>{p.name}</p>
                </button>
              ))}
            </div>

            {/* Active Platform Guide */}
            {activePlatform === "gohighlevel" ? (
              <div className="mb-6 space-y-6">
                <GHLDeployer data={data} />
                {funnel ? (
                  <FunnelPageExporter funnel={funnel} />
                ) : (
                  <div className="light-card rounded-2xl border border-orange-300/50 p-6 text-center">
                    <Code2 className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                    <h3 className="text-foreground font-bold mb-1">No Funnel Pages Generated Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">Build your funnel in Funnel Studio first — then come back here to export ready-to-paste HTML for each generated GHL funnel page.</p>
                    <Link to="/FunnelBuilder"><Button className="accent-gradient text-white font-bold">Build My Funnel</Button></Link>
                  </div>
                )}
              </div>
            ) : (
              <div className={`light-card rounded-2xl border ${platform.color} p-6 md:p-8 mb-6`}>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{platform.icon}</span>
                    <div>
                      <Badge className={`${platform.badge} border font-bold mb-1`}>{platform.name}</Badge>
                      <h2 className="text-foreground font-display font-bold text-xl">Deployment Guide</h2>
                    </div>
                  </div>
                  {platform.url && (
                    <a href={platform.url} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground h-auto py-2 px-4">
                        <ExternalLink className="w-4 h-4 mr-2" /> Open {platform.name}
                      </Button>
                    </a>
                  )}
                </div>
                <div className="space-y-3">
                  {platform.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-secondary">
                      <div className="w-7 h-7 rounded-lg accent-gradient text-white flex items-center justify-center font-black text-sm flex-shrink-0">{i + 1}</div>
                      <p className="text-foreground text-sm">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Funnel Copy Export */}
            <div className="light-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-bold text-lg">Full Funnel Copy Export</h3>
                <CopyBtn text={exportCopy} label="Copy All Copy" />
              </div>
              <p className="text-muted-foreground text-sm mb-4">Copy everything — offer stack, funnel steps, launch plan, and sales scripts — ready to paste anywhere.</p>
              <div className="bg-secondary rounded-xl p-4 max-h-80 overflow-y-auto">
                <pre className="text-muted-foreground text-sm whitespace-pre-wrap font-mono">{exportCopy}</pre>
              </div>
            </div>

            {/* Offer Quick Reference */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {[
                { key: "low_ticket", label: "LOW TICKET", color: "border-blue-200 text-blue-600" },
                { key: "mid_ticket", label: "MID TICKET", color: "border-primary/20 text-primary" },
                { key: "high_ticket", label: "HIGH TICKET", color: "border-purple-200 text-purple-600" },
              ].map(({ key, label, color }) => {
                const offer = data.offer_ladder?.[key];
                if (!offer) return null;
                const [borderCls, textCls] = color.split(' ');
                return (
                  <div key={key} className={`light-card rounded-xl border ${borderCls} p-4`}>
                    <Badge className={`bg-secondary ${textCls} text-sm mb-2`}>{label}</Badge>
                    <p className="text-foreground font-bold mb-1">{offer.name}</p>
                    <p className={`font-black text-xl ${textCls}`}>{offer.price}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}