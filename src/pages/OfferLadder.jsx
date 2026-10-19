import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import AgentChatBubble from "@/components/AgentChatBubble";
import OfferTierCard from "@/components/offerladder/OfferTierCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";
import { syncLaunchSystemSnapshot } from "@/lib/business-profile";
import { accountStorage } from "@/lib/account-storage";
import { useToast } from "@/components/ui/use-toast";
import PullToRefresh from "@/components/PullToRefresh";

const TIERS = [
  { key: "low_ticket", label: "LOW TICKET", sub: "Entry Point · Fast Win · Ecosystem Builder", badge: "bg-blue-50 text-blue-600 border border-blue-200", priceCls: "text-blue-600", border: "border-blue-200", glow: "hover:border-blue-400" },
  { key: "mid_ticket", label: "MID TICKET", sub: "Core Transformation · Main Revenue Driver", badge: "bg-primary/10 text-primary border border-primary/30", priceCls: "text-primary", border: "border-primary/20", glow: "hover:border-primary/40" },
  { key: "high_ticket", label: "HIGH TICKET", sub: "Premium DFY · Application Only · Max LTV", badge: "bg-purple-50 text-purple-600 border border-purple-200", priceCls: "text-purple-600", border: "border-purple-200", glow: "hover:border-purple-400" },
];

export default function OfferLadder() {
  const [data, setData] = useState(null);
  const { toast } = useToast();

  const loadLaunchData = () => {
    const stored = accountStorage.getItem("launchSystem");
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed.result);
    }
  };

  useEffect(() => { loadLaunchData(); }, []);

  const updateOffer = (key, updatedOffer) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, offer_ladder: { ...prev.offer_ladder, [key]: updatedOffer } };
      try {
        const raw = accountStorage.getItem("launchSystem");
        if (raw) {
          const parsed = JSON.parse(raw);
          const updatedLaunchSystem = { ...parsed, result: next };
          accountStorage.setItem("launchSystem", JSON.stringify(updatedLaunchSystem));
          syncLaunchSystemSnapshot(updatedLaunchSystem).catch((syncError) => {
            console.warn("Offer edit saved locally but profile sync was unavailable:", syncError);
            toast({
              title: "Saved on this device",
              description: "We couldn't sync this edit to your account. It will sync next time you're online.",
            });
          });
        }
      } catch (_) {}
      return next;
    });
  };

  if (!data) {
    return (
      <AppLayout>
        <div className="p-10 max-w-2xl mx-auto text-center hero-radial min-h-screen flex flex-col justify-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-foreground font-bold text-xl mb-2">No Launch System Found</h2>
          <p className="text-muted-foreground mb-6">Start by completing the Idea Intake to generate your offer ladder.</p>
          <Link to="/IdeaIntake"><Button className="accent-gradient text-white font-bold hover:opacity-90">Go to Idea Intake</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const ladder = data.offer_ladder;

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadLaunchData}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto hero-radial min-h-screen">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">OFFER LADDER</Badge>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">Your 3-Tier Offer Stack</h1>
            <p className="text-muted-foreground">Every tier feeds the next. Low → Mid → High. Tap the pencil on any tier to edit it.</p>
          </div>
          <Link to="/FreebieBuilder">
            <Button className="accent-gradient text-white font-bold px-5 py-2.5 h-auto rounded-xl hover:opacity-90">
              Next: Freebie Builder <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Ascension Visual */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {TIERS.map((tier, i) => (
            <React.Fragment key={tier.key}>
              <div className={`flex-1 min-w-[120px] p-3 rounded-xl border ${tier.border} bg-card text-center`}>
                <Badge className={`${tier.badge} text-sm mb-1`}>{tier.label}</Badge>
                <p className={`font-black text-lg ${tier.priceCls}`}>{ladder[tier.key]?.price || "—"}</p>
              </div>
              {i < TIERS.length - 1 && <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-6">
          {TIERS.map((tier) => {
            const offer = ladder[tier.key];
            if (!offer) return null;
            return (
              <OfferTierCard
                key={tier.key}
                tier={tier}
                offer={offer}
                onChange={(updated) => updateOffer(tier.key, updated)}
              />
            );
          })}
        </div>
      </div>
      </PullToRefresh>
      <AgentChatBubble
        title="Pricing Agent"
        systemPrompt="You are an elite pricing strategist and premium business consultant. You help the user architect aggressive, psychology-driven pricing for their offer. Cover: anchor pricing, tier architecture, value-based pricing, psychological levers, competitor positioning, and revenue projections. Be direct, specific, and give a concrete next action."
        greeting="Hey! I'm your Pricing Agent. Ask me about pricing your offer tiers, anchoring, or beating cheaper competitors — I'll use your saved business data."
        quickPrompts={["How should I price my offer tiers?", "What's a good anchor price?", "How do I beat cheaper competitors?", "What pricing psychology should I use?"]}
      />
    </AppLayout>
  );
}