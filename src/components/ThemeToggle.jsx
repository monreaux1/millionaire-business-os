import React, { useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "mbos-theme";

function systemPrefersDark() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Applies a stored manual theme preference to <html> (run once at app startup). */
export function applyStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") document.documentElement.classList.add("dark");
    else if (stored === "light") document.documentElement.classList.add("light");
  } catch {
    /* storage unavailable — fall back to system auto mode */
  }
}

/** Manual dark/light toggle; the choice persists in localStorage. */
export default function ThemeToggle({ className = "" }) {
  const [dark, setDark] = useState(() => {
    const root = document.documentElement;
    return root.classList.contains("dark") || (!root.classList.contains("light") && systemPrefersDark());
  });

  const toggle = () => {
    const root = document.documentElement;
    const nextDark = !dark;
    root.classList.toggle("dark", nextDark);
    root.classList.toggle("light", !nextDark);
    try {
      localStorage.setItem(THEME_KEY, nextDark ? "dark" : "light");
    } catch {
      /* storage unavailable — toggle still applies for this session */
    }
    setDark(nextDark);
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-11 h-11 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors select-none ${className}`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}