import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Target, TrendingUp, Calendar, Map, Settings, Mail, Bot, Rocket } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Target,
  },
  {
    title: "Business Setup",
    url: createPageUrl("BusinessSetup"),
    icon: Settings,
  },
  {
    title: "Strategy Generator",
    url: createPageUrl("StrategyGenerator"),
    icon: TrendingUp,
  },
  {
    title: "Launch Calendar",
    url: createPageUrl("LaunchCalendar"),
    icon: Calendar,
  },
  {
    title: "Funnel Builder",
    url: createPageUrl("FunnelBuilder"),
    icon: Map,
  },
  {
    title: "Launch Partner",
    url: createPageUrl("LaunchPartner"),
    icon: Rocket,
  },
  {
    title: "Business Strategist",
    url: createPageUrl("HormoziBot"),
    icon: Bot,
  },
  {
    title: "Daily Briefing",
    url: createPageUrl("EmailBriefing"),
    icon: Mail,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: #1a1a1a;
          --secondary: #f59e0b;
          --accent: #ffffff;
          --success: #10b981;
          --background: #111827;
          --card: #1f2937;
          --border: #374151;
        }
        
        body {
          background: var(--background);
          color: var(--accent);
        }
        
        .gold-gradient {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        
        .dark-card {
          background: var(--card);
          border: 1px solid var(--border);
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gray-900">
        <Sidebar className="border-r border-gray-700 bg-gray-900">
          <SidebarHeader className="border-b border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gold-gradient rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-black font-bold" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white">MILLIONAIRE</h2>
                <p className="text-xs text-yellow-400 uppercase tracking-wider">Fusion Strategist</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-3">
                BUILD YOUR EMPIRE
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-yellow-400 hover:text-black transition-all duration-200 rounded-lg mb-2 font-semibold ${
                          location.pathname === item.url ? 'bg-yellow-400 text-black' : 'text-gray-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-bold">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-700 p-4">
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-yellow-400 font-bold text-sm mb-1">💎 NO FLUFF ZONE</p>
              <p className="text-gray-300 text-xs">Only frameworks that make money</p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-gray-900">
          <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200 text-white" />
              <h1 className="text-xl font-bold text-white">MILLIONAIRE BUSINESS OS</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}