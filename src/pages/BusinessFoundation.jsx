import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { getBrandCompletion, getBrandProfileForBusiness } from "@/lib/brand-profile";
import {
  ArrowRight,
  Building2,
  Check,
  CircleDollarSign,
  Loader2,
  Palette,
  Settings2,
  Sparkles,
} from "lucide-react";

const businessFields = ["business_name", "industry", "target_avatar", "core_service"];

export default function BusinessFoundation() {
  const [business, setBusiness] = useState(null);
  const [brand, setBrand] = useState(null);
  const [moneyModel, setMoneyModel] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadFoundation = async () => {
    try {
      const businesses = await base44.entities.Business.list("-updated_date", 1);
      const latestBusiness = businesses?.[0] || null;
      setBusiness(latestBusiness);

      if (latestBusiness) {
        const [brandProfile, models] = await Promise.all([
          getBrandProfileForBusiness(latestBusiness.id),
          base44.entities.MoneyModel.filter({ business_id: latestBusiness.id }, "-updated_date", 1),
        ]);
        setBrand(brandProfile);
        setMoneyModel(models?.[0] || null);
      }
    } catch (error) {
      console.warn("Business foundation status could not be loaded:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFoundation(); }, []);

  const businessScore = useMemo(() => {
    if (!business) return 0;
    const completed = businessFields.filter((field) => String(business[field] || "").trim()).length;
    return Math.round((completed / businessFields.length) * 100);
  }, [business]);

  const brandScore = getBrandCompletion(brand);
  const businessReady = businessScore === 100;
  const brandReady = brandScore >= 75;
  const modelReady = moneyModel?.status === "complete";
  const completedSteps = [businessReady, brandReady, modelReady].filter(Boolean).length;
  const overallProgress = Math.round((completedSteps / 3) * 100);

  const steps = [
    {
      number: "01",
      title: "Business Intelligence",
      description: "Define what you sell, who you serve, the result you create, and the revenue target.",
      path: "/BusinessSetup",
      icon: Building2,
      ready: businessReady,
      status: business ? businessScore + "% complete" : "Not started",
      action: business ? "Review profile" : "Create profile",
    },
    {
      number: "02",
      title: "Brand Intelligence",
      description: "Add your logos, colors, voice, visual style, contact details, and proof.",
      path: business ? "/BrandProfile" : "/BusinessSetup",
      icon: Palette,
      ready: brandReady,
      status: brand ? brandScore + "% complete" : business ? "Ready to start" : "Complete step 1 first",
      action: brand ? "Review brand" : "Build brand kit",
      locked: !business,
    },
    {
      number: "03",
      title: "Money Model",
      description: "Turn your business and brand intelligence into offers, pricing, ascension, and execution.",
      path: businessReady ? "/MoneyModelBuilder" : "/BusinessSetup",
      icon: CircleDollarSign,
      ready: modelReady,
      status: modelReady ? "Strategy complete" : businessReady ? "Ready to build" : "Complete step 1 first",
      action: modelReady ? "Open strategy" : "Build money model",
      locked: !businessReady,
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadFoundation}>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          <div className="rounded-[28px] bg-[#111111] text-white overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.16)] mb-10">
            <div className="relative p-7 md:p-11">
              <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-primary/20 blur-[100px]" />
              <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-primary mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-black tracking-[0.22em] uppercase">Business Foundation</span>
                  </div>
                  <h1 className="font-display text-3xl md:text-5xl font-black tracking-tight mb-4">
                    Teach the system your business once.
                  </h1>
                  <p className="text-white/60 text-base md:text-lg leading-relaxed">
                    Complete these three steps and every strategist, generator, funnel, and asset can work from the same intelligence.
                  </p>
                </div>
                <div className="min-w-[220px] rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-sm font-bold text-white/50 uppercase tracking-wider">Foundation</span>
                    <span className="font-display text-3xl font-black text-primary">{overallProgress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: overallProgress + "%" }} />
                  </div>
                  <p className="text-sm text-white/45 mt-3">{completedSteps} of 3 stages complete</p>
                </div>
              </div>
            </div>
          </div>

          {business && (
            <div className="flex items-center justify-between gap-4 mb-6 px-1">
              <div>
                <p className="text-sm font-black tracking-[0.2em] uppercase text-primary">Active Business</p>
                <h2 className="font-display font-extrabold text-xl text-foreground mt-1">{business.business_name}</h2>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Settings2 className="w-4 h-4" />
                Shared across the operating system
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 border-t border-l border-border bg-card shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            {steps.map(({ number, title, description, path, icon: Icon, ready, status, action, locked }) => (
              <article key={number} className="relative min-h-[330px] p-7 border-r border-b border-border flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-12">
                  <div>
                    <p className="text-sm font-black tracking-[0.2em] text-primary mb-2">STAGE {number}</p>
                    <p className={"text-sm font-bold " + (ready ? "text-emerald-600" : "text-muted-foreground")}>
                      {ready ? "COMPLETE" : status.toUpperCase()}
                    </p>
                  </div>
                  <div className={"w-11 h-11 rounded-full flex items-center justify-center border " + (ready ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400" : "border-border text-muted-foreground")}>
                    {ready ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" strokeWidth={1.8} />}
                  </div>
                </div>
                <div className="mt-auto">
                  <h3 className="font-display text-xl font-extrabold text-foreground mb-3">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{description}</p>
                  <Link to={path}>
                    <Button disabled={locked} className={ready ? "w-full bg-black text-white hover:bg-black/85" : "w-full accent-gradient text-white"}>
                      {action}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Your original tools remain available. This foundation simply gives them one reliable source of business intelligence.
          </p>
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}