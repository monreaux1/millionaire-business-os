import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Lightbulb, Layers, Gift, Map, Rocket,
  FileText, Mic2, Send, ChevronLeft, ChevronRight, Bot, Zap, Video, Brain, LogOut, TrendingUp, GitBranch, Settings, Calendar, Mail, CircleDollarSign, Users, CreditCard, BadgeCheck, Palette } from "lucide-react";
import BottomTabBar from "./BottomTabBar";
import PageTransition from "./PageTransition";
import ThemeToggle from "./ThemeToggle";
import DeleteAccountButton from "./DeleteAccountButton";

const NAV = [
  { label: "Dashboard",         path: "/",                    icon: LayoutDashboard },
  { label: "Build My Money Model", path: "/MoneyModelBuilder", icon: CircleDollarSign },
  { label: "Business Foundation", path: "/BusinessFoundation", icon: Settings },
  { label: "Brand Board",         path: "/BrandProfile",       icon: Palette },
  { label: "Lead Dashboard",      path: "/Leads",              icon: Users },
  { label: "Payments & Delivery", path: "/PaymentFulfillment",  icon: CreditCard },
  { label: "Strategy Generator",path: "/StrategyGenerator",    icon: Brain },
  { label: "Launch Calendar",   path: "/LaunchCalendar",       icon: Calendar },
  { label: "Launch Partner",    path: "/LaunchPartner",        icon: Rocket },
  { label: "Daily Briefing",    path: "/EmailBriefing",        icon: Mail },
  { label: "1. Idea Intake",    path: "/IdeaIntake",          icon: Lightbulb },
  { label: "2. Offer Builder",  path: "/FunnelBrain",         icon: Brain },
  { label: "3. Offer Ladder",   path: "/OfferLadder",         icon: Layers },
  { label: "4. Asset Creator",  path: "/ClientMagnetBuilder", icon: Gift },
  { label: "5. Funnel Studio",  path: "/FunnelBuilder",       icon: Map },
  { label: "6. VSL Generator",  path: "/VSLBuilder",          icon: Video },
  { label: "7. Ad Engine",      path: "/AdEngine",            icon: Zap },
  { label: "Launch Battle Plan",path: "/LaunchBattlePlan",    icon: Rocket },
  { label: "Content Generator", path: "/ContentGenerator",    icon: FileText },
  { label: "Sales Scripts",     path: "/SalesScripts",        icon: Mic2 },
  { label: "Deployment Center", path: "/DeploymentCenter",    icon: Send },
  { label: "Offer Agent",        path: "/OfferAgent",          icon: Zap },
  { label: "Pricing Agent",      path: "/PricingAgent",         icon: TrendingUp },
  { label: "Launch Sequence",    path: "/LaunchSequenceAgent",  icon: Rocket },
  { label: "Funnel Acquisition", path: "/FunnelAcquisitionAgent", icon: GitBranch },
  { label: "Business Strategist", path: "/HormoziBot",          icon: Bot },
  { label: "My Plan & Billing",  path: "/billing",             icon: BadgeCheck },
];

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const TAB_ROOTS = ["/", "/MoneyModelBuilder", "/FunnelBuilder"];
  const isHome = TAB_ROOTS.includes(location.pathname);
  const activeTabRoot = TAB_ROOTS.find((p) => p !== "/" && location.pathname.startsWith(p)) || "/";
  const current = NAV.find((n) => location.pathname === n.path || (n.path !== "/" && location.pathname.startsWith(n.path)));
  const pageTitle = current?.label || "Millionaire Business OS";

  const goBack = () => {
    // Fall back to the bottom-tab root when there is no in-app history to go back to.
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(activeTabRoot);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — hidden on mobile, visible md+ */}
      <aside className={`hidden md:flex flex-shrink-0 flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} border-r border-border bg-card`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-border ${collapsed ? 'justify-center' : ''}`}>
          {collapsed ? (
            <img
              src="https://media.base44.com/images/public/68b3ceea8626205b99d31641/5489f7c4c_mbsymbol.png"
              alt="MB Logo"
              className="w-8 h-8 rounded-lg flex-shrink-0 object-cover"
            />
          ) : (
            <img
              src="https://media.base44.com/images/public/68b3ceea8626205b99d31641/8da510d05_mblogo.png"
              alt="Millionaire Business OS"
              className="h-10 w-auto flex-shrink-0 rounded-md"
            />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto px-2">
          {NAV.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
                  ${active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-foreground/10 border border-transparent'}
                  ${collapsed ? 'justify-center' : ''}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                {!collapsed && (
                  <span className={`text-sm font-medium ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Session */}
        <div className="px-3 pb-2 border-t border-border pt-3 hidden md:block">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
            <ThemeToggle />
          </div>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors text-sm font-semibold select-none"
            onClick={() => {
              if (window.confirm("Sign out of Millionaire Business OS?")) {
                import("@/api/base44Client").then(({ base44 }) => base44.auth.logout());
              }
            }}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && "Sign Out"}
          </button>
          <DeleteAccountButton
            className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors text-sm font-semibold select-none"
          >
            {!collapsed && "Delete Account"}
          </DeleteAccountButton>
        </div>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-border hidden md:block">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors select-none">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 overflow-auto overscroll-y-none min-h-screen pb-[64px] md:pb-0"
      >
        {/* Mobile navigation header */}
        <header className="md:hidden sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-2 px-3 h-14">
            {isHome ? (
              <img
                src="https://media.base44.com/images/public/68b3ceea8626205b99d31641/5489f7c4c_mbsymbol.png"
                alt="MB Logo"
                className="w-7 h-7 rounded-lg flex-shrink-0 object-cover"
              />
            ) : (
              <button
                onClick={goBack}
                className="flex items-center justify-center gap-1 -ml-1 min-h-[44px] min-w-[44px] rounded-lg hover:bg-foreground/10 text-foreground select-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <span className="font-display font-bold text-sm text-foreground truncate">{pageTitle}</span>
          </div>
        </header>

        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}