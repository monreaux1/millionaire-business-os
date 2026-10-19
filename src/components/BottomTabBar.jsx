import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, CircleDollarSign, Map, Menu } from "lucide-react";
import MobileMenu from "./MobileMenu";

const TABS = [
  { label: "Dashboard", path: "/",           icon: LayoutDashboard },
  { label: "Money Model", path: "/MoneyModelBuilder", icon: CircleDollarSign },
  { label: "Funnel", path: "/FunnelBuilder", icon: Map },
  { label: "More",       path: null,          icon: Menu },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  // Per-tab history stacks: tab root path -> array of visited pathnames
  const stacksRef = useRef({});

  const activeTab = TABS.find(
    ({ path }) => path && (location.pathname === path || (path !== "/" && location.pathname.startsWith(path)))
  );

  useEffect(() => {
    if (!activeTab) return;
    const stack = stacksRef.current[activeTab.path] || (stacksRef.current[activeTab.path] = [activeTab.path]);
    if (stack[stack.length - 1] !== location.pathname) stack.push(location.pathname);
  }, [location.pathname, activeTab]);

  const handleTabPress = (tab) => {
    if (tab.path === null) {
      setMenuOpen(true);
      return;
    }
    if (activeTab && activeTab.path === tab.path) {
      // Already on this tab: tapping again resets to the tab root
      if (location.pathname !== tab.path) {
        stacksRef.current[tab.path] = [tab.path];
        navigate(tab.path);
      }
      return;
    }
    // Switching tabs: return to the last page visited inside that tab, or its root
    const stack = stacksRef.current[tab.path];
    navigate(stack && stack.length ? stack[stack.length - 1] : tab.path);
  };

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card select-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map(({ label, path, icon: Icon }) => {
          const active = path && (location.pathname === path || (path !== "/" && location.pathname.startsWith(path)));
          return (
            <button
              key={label}
              onClick={() => handleTabPress({ label, path, icon: Icon })}
              aria-label={label === "More" ? "More menu" : `Go to ${label}`}
              className="flex-1 select-none"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {path !== null ? (
                <div
                  className={`flex flex-col items-center justify-center gap-1 py-2 w-full select-none ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              ) : (
                <div
                  className={`flex flex-col items-center justify-center gap-1 py-2 w-full select-none ${menuOpen ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}