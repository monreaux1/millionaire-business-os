import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, LayoutDashboard, Lightbulb, Brain, Layers, Gift, Map, Video, Zap, Rocket, FileText, Mic2, Send, Bot, LogOut, CircleDollarSign, Palette, Settings, CreditCard, Users, Calendar, Mail, TrendingUp, BadgeCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import { useToast } from "@/components/ui/use-toast";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { label: "Dashboard",         path: "/",                    icon: LayoutDashboard },
  { label: "Build My Money Model", path: "/MoneyModelBuilder", icon: CircleDollarSign },
  { label: "Business Foundation", path: "/BusinessFoundation",  icon: Settings },
  { label: "Strategy Generator", path: "/StrategyGenerator",   icon: TrendingUp },
  { label: "Launch Calendar",   path: "/LaunchCalendar",       icon: Calendar },
  { label: "Launch Partner",    path: "/LaunchPartner",        icon: Rocket },
  { label: "Daily Briefing",    path: "/EmailBriefing",         icon: Mail },
  { label: "Brand Profile",     path: "/BrandProfile",         icon: Palette },
  { label: "Idea Intake",       path: "/IdeaIntake",          icon: Lightbulb },
  { label: "Offer Builder",     path: "/FunnelBrain",         icon: Brain },
  { label: "Offer Ladder",      path: "/OfferLadder",         icon: Layers },
  { label: "Asset Creator",     path: "/ClientMagnetBuilder", icon: Gift },
  { label: "Funnel Studio",     path: "/FunnelBuilder",       icon: Map },
  { label: "Leads",             path: "/Leads",               icon: Users },
  { label: "Payments & Delivery", path: "/PaymentFulfillment", icon: CreditCard },
  { label: "VSL Generator",     path: "/VSLBuilder",          icon: Video },
  { label: "Ad Engine",         path: "/AdEngine",            icon: Zap },
  { label: "Launch Battle Plan",path: "/LaunchBattlePlan",    icon: Rocket },
  { label: "Content Generator", path: "/ContentGenerator",    icon: FileText },
  { label: "Sales Scripts",     path: "/SalesScripts",        icon: Mic2 },
  { label: "Deployment Center", path: "/DeploymentCenter",    icon: Send },
  { label: "Business Strategist", path: "/HormoziBot",          icon: Bot },
  { label: "My Plan & Billing",  path: "/billing",             icon: BadgeCheck },
];

export default function MobileMenu({ onClose }) {
  const location = useLocation();
  const { toast } = useToast();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  async function handleSignOut() {
    if (!confirmSignOut) { setConfirmSignOut(true); return; }
    try {
      await base44.auth.logout();
    } catch (error) {
      console.warn("Sign out failed", error);
      toast({ title: "Sign out failed", description: "Please try again.", variant: "destructive" });
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* Drawer */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-border overflow-hidden bg-card"
          style={{ paddingBottom: "env(safe-area-inset-bottom)", maxHeight: "85vh" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg accent-gradient flex items-center justify-center">
                <span className="text-white font-black text-sm">MB</span>
              </div>
              <div>
                <p className="text-foreground font-black text-sm">MILLIONAIRE BUSINESS OS</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close menu" className="w-11 h-11 grid place-items-center rounded-lg hover:bg-foreground/10 text-muted-foreground select-none" style={{ WebkitTapHighlightColor: "transparent" }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav list */}
          <div className="overflow-y-auto" style={{ maxHeight: "55vh" }}>
            <div className="px-3 py-3 space-y-0.5">
              {NAV.map(({ label, path, icon: Icon }) => {
                const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all select-none ${active ? "bg-primary/10 border border-primary/20 text-primary" : "text-muted-foreground border border-transparent hover:bg-foreground/10"}`}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Settings / Profile */}
          <div className="px-5 py-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Account</p>
              <ThemeToggle />
            </div>
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all select-none text-sm font-semibold ${confirmSignOut ? "bg-red-500/20 border-red-500/50 text-red-600" : "bg-secondary border-border text-muted-foreground hover:border-red-500/30 hover:text-red-600"}`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <LogOut className="w-4 h-4" />
              {confirmSignOut ? "Tap again to sign out" : "Sign Out"}
            </button>
            <DeleteAccountButton className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary text-muted-foreground hover:border-red-500/30 hover:text-red-600 transition-all select-none text-sm font-semibold mt-2" />
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}