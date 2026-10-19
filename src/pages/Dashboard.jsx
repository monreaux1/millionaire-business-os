import React from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Lightbulb, Layers, Gift, Map, Rocket,
  FileText, Mic2, Send, ArrowRight, Zap, TrendingUp, DollarSign,
  Sparkles, Bot, GitBranch
} from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import { getLatestBusinessProfile, restoreLaunchSystemFromProfile } from "@/lib/business-profile";
import { accountStorage } from "@/lib/account-storage";

const ACTIONS = [
  { number: "01", label: "Idea Intake", desc: "Clarify the opportunity and define the business", path: "/IdeaIntake", icon: Lightbulb, category: "Foundation" },
  { number: "02", label: "Offer Ladder", desc: "Engineer low, mid, and high ticket offers", path: "/OfferLadder", icon: Layers, category: "Monetization" },
  { number: "03", label: "Asset Creator", desc: "Build branded freebies, products, and client assets", path: "/ClientMagnetBuilder", icon: Gift, category: "Assets" },
  { number: "04", label: "Funnel Studio", desc: "Generate, edit, connect, and publish a complete native funnel", path: "/FunnelBuilder", icon: Map, category: "Acquisition" },
  { number: "05", label: "Launch Plan", desc: "Create a focused 7 to 30 day execution plan", path: "/LaunchBattlePlan", icon: Rocket, category: "Execution" },
  { number: "06", label: "Content Generator", desc: "Produce hooks, scripts, and authority content", path: "/ContentGenerator", icon: FileText, category: "Marketing" },
  { number: "07", label: "Sales Scripts", desc: "Handle calls, DMs, follow up, and objections", path: "/SalesScripts", icon: Mic2, category: "Conversion" },
  { number: "08", label: "Deployment Center", desc: "Publish in the app, push to GHL, or export", path: "/DeploymentCenter", icon: Send, category: "Launch" },
];

const AGENTS = [
  { number: "01", label: "Offer Architect", desc: "Build the offer customers feel foolish refusing", path: "/OfferAgent", icon: Zap },
  { number: "02", label: "Pricing Strategist", desc: "Position price around value, margin, and growth", path: "/PricingAgent", icon: TrendingUp },
  { number: "03", label: "Launch Director", desc: "Sequence the campaign from warm up to close", path: "/LaunchSequenceAgent", icon: Rocket },
  { number: "04", label: "Funnel Strategist", desc: "Design acquisition paths that turn traffic into buyers", path: "/FunnelAcquisitionAgent", icon: GitBranch },
];

const STATS = [
  { label: "Core Workspaces", value: "8", icon: Zap, sub: "One connected system" },
  { label: "Offer Tiers", value: "3", icon: Layers, sub: "Low · Mid · High" },
  { label: "Deploy Options", value: "4", icon: Send, sub: "In-app, GHL, TaxNitro, Export" },
  { label: "Revenue System", value: "1", icon: DollarSign, sub: "Idea → Full Launch" },
];

export default function Dashboard() {
  const refreshLaunchSystem = async () => {
    const business = await getLatestBusinessProfile();
    const restored = business ? restoreLaunchSystemFromProfile(business) : null;
    if (restored) accountStorage.setItem("launchSystem", JSON.stringify(restored));
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={refreshLaunchSystem}>
      <div className="min-h-screen hero-radial">
        <div className="p-6 md:p-12 max-w-7xl mx-auto">
          {/* Hero */}
          <div className="mb-12">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary text-sm font-bold tracking-wider">AI BUSINESS PARTNER</span>
                </div>
                <img
                  src="https://media.base44.com/images/public/68b3ceea8626205b99d31641/8da510d05_mblogo.png"
                  alt="Millionaire Business OS"
                  className="h-20 md:h-28 w-auto mb-4 rounded-lg"
                />
                <p className="text-muted-foreground text-lg md:text-xl max-w-xl leading-relaxed">
                  Turn any business idea into a complete revenue system — offers, funnels, content, scripts, and deployment in minutes.
                </p>
              </div>
              <Link to="/MoneyModelBuilder">
                <Button className="accent-gradient text-white font-bold text-base px-6 py-3 h-auto rounded-xl shadow-lg hover:opacity-90 transition-all hover:scale-[1.02]">
                  <Zap className="w-5 h-5 mr-2" />
                  Build My Money Model
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Row — glassmorphic cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {STATS.map(({ label, value, icon: Icon, sub }) => (
              <div key={label} className="light-card rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-4xl font-black text-foreground font-display">{value}</span>
                </div>
                <p className="text-foreground font-bold text-sm">{label}</p>
                <p className="text-muted-foreground text-sm mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="mb-10 rounded-3xl overflow-hidden relative accent-gradient text-white">
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
            <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <p className="text-white/80 font-bold text-sm tracking-wider mb-2">LAUNCH PARTNER MODE</p>
                <h2 className="font-display font-black text-3xl md:text-4xl mb-2 tracking-tight">
                  One idea. Complete revenue system.
                </h2>
                <p className="text-white/90">Answer 6 questions → Get offers, freebie, funnel, launch plan, content & sales scripts instantly.</p>
              </div>
              <Link to="/MoneyModelBuilder">
                <Button className="bg-white text-primary font-black text-lg px-8 py-4 h-auto rounded-2xl shadow-xl hover:bg-white/95 hover:scale-[1.02] transition-all whitespace-nowrap">
                  Build My Money Model →
                </Button>
              </Link>
            </div>
          </div>

          {/* AI Agents */}
          <section className="mb-14">
            <div className="flex items-end justify-between gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <p className="text-sm font-black tracking-[0.22em] uppercase text-primary">Executive Intelligence</p>
                </div>
                <h2 className="text-foreground font-display font-black text-2xl md:text-3xl tracking-tight">AI Strategy Team</h2>
              </div>
              <p className="hidden md:block text-sm text-muted-foreground max-w-sm text-right">Specialized advisors for the decisions that move revenue.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-2xl border border-border bg-foreground shadow-[0_24px_70px_rgba(0,0,0,0.14)]">
              {AGENTS.map(({ number, label, desc, path, icon: Icon }) => (
                <Link key={path} to={path} className="group min-h-[230px] border-b sm:border-r border-background/10 last:border-0">
                  <article className="relative h-full p-6 md:p-7 flex flex-col overflow-hidden transition-colors duration-300 hover:bg-background/[0.055]">
                    <div className="absolute top-0 left-0 h-[3px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                    <div className="flex items-center justify-between mb-12">
                      <span className="text-sm font-bold tracking-[0.18em] text-background/35">AGENT {number}</span>
                      <Icon className="w-5 h-5 text-primary" strokeWidth={1.8} />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-background font-display text-lg font-extrabold mb-2">{label}</h3>
                      <p className="text-background/55 text-sm leading-relaxed">{desc}</p>
                      <div className="mt-5 flex items-center gap-2 text-sm font-bold text-background group-hover:text-primary transition-colors">
                        Open advisor
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          {/* Tools Grid */}
          <section>
            <div className="flex items-end justify-between gap-6 mb-6">
              <div>
                <p className="text-sm font-black tracking-[0.22em] uppercase text-primary mb-2">Operating System</p>
                <h2 className="text-foreground font-display font-black text-2xl md:text-3xl tracking-tight">Build and Execute</h2>
              </div>
              <p className="hidden md:block text-sm text-muted-foreground max-w-sm text-right">Eight focused workspaces. One complete revenue system.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 border-t border-l border-border bg-card shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
              {ACTIONS.map(({ number, label, desc, path, icon: Icon, category }) => (
                <Link key={path} to={path} className="group">
                  <article className="relative min-h-[190px] p-6 md:p-7 border-r border-b border-border bg-card transition-all duration-300 hover:z-10 hover:bg-muted hover:shadow-[inset_3px_0_0_#ff5a1f]">
                    <div className="flex items-start justify-between gap-4 mb-9">
                      <div>
                        <p className="text-sm font-black tracking-[0.18em] uppercase text-primary mb-2">{category}</p>
                        <span className="text-sm font-semibold text-muted-foreground">MODULE {number}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground/70 transition-all duration-300 group-hover:bg-foreground group-hover:text-background group-hover:border-foreground">
                        <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h3 className="text-foreground font-display font-extrabold text-lg mb-1.5">{label}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground mb-1 transition-all group-hover:text-primary group-hover:translate-x-1" />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          {/* Framework Footer */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { n: "01", t: "OFFER", d: "Make it irresistible" },
              { n: "02", t: "LEADS", d: "Get attention at scale" },
              { n: "03", t: "SALES", d: "Convert to cash" },
              { n: "04", t: "DELIVERY", d: "Overdeliver & retain" },
            ].map(({ n, t, d }) => (
              <div key={n} className="rounded-2xl p-4 text-center bg-card border border-border">
                <p className="text-primary/60 text-sm font-black mb-1">{n}</p>
                <p className="text-foreground font-black text-sm font-display">{t}</p>
                <p className="text-muted-foreground text-sm">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground/70">
            Millionaire Business OS is an independent business strategy platform and is not sponsored by or affiliated with any third-party author, publisher, or business education brand.
          </p>
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}