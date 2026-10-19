import React from "react";
import { Sparkles, MousePointer2, ArrowRight } from "lucide-react";

export default function ModeSelect({ onChoose }) {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <button
        onClick={() => onChoose("ai")}
        className="light-card rounded-2xl p-8 text-left transition-all hover:border-primary hover:shadow-lg group"
      >
        <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-display font-bold text-xl text-foreground mb-2">Build with AI</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Answer a few questions about your business, upload your logo, and let Claude engineer a complete acquisition funnel for you.
        </p>
        <span className="inline-flex items-center gap-1 text-primary font-bold text-sm group-hover:gap-2 transition-all">
          Start AI Build <ArrowRight className="w-4 h-4" />
        </span>
      </button>

      <button
        onClick={() => onChoose("manual")}
        className="light-card rounded-2xl p-8 text-left transition-all hover:border-primary hover:shadow-lg group"
      >
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
          <MousePointer2 className="w-6 h-6 text-foreground" />
        </div>
        <h3 className="font-display font-bold text-xl text-foreground mb-2">Build Manually</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Use the drag-and-drop canvas to arrange funnel blocks yourself, tag each to a platform, and export.
        </p>
        <span className="inline-flex items-center gap-1 text-primary font-bold text-sm group-hover:gap-2 transition-all">
          Open Canvas <ArrowRight className="w-4 h-4" />
        </span>
      </button>
    </div>
  );
}