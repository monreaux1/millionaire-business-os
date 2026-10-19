import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Mobile-only page header with a back affordance. Renders nothing on md+
 * viewports so desktop layouts stay exactly as they were.
 */
export default function MobilePageHeader({ title, onBack }) {
  const navigate = useNavigate();
  return (
    <header
      className="md:hidden sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border pt-[env(safe-area-inset-top)]"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div className="flex items-center gap-2 px-3 h-14">
        <button
          onClick={onBack ? onBack : () => navigate(-1)}
          className="flex items-center justify-center -ml-1 min-h-[44px] min-w-[44px] rounded-lg hover:bg-foreground/10 text-foreground select-none"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-sm text-foreground truncate">{title}</span>
      </div>
    </header>
  );
}