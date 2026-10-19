import React from "react";
import { Upload, X } from "lucide-react";

export default function BrandingPanel({
  logoDataUrl,
  onLogoChange,
  onLogoRemove,
  brandColor,
  onBrandColorChange,
  businessName,
  onBusinessNameChange,
}) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
      <p className="text-primary font-black text-sm uppercase tracking-wider">🎨 Brand Your PDF</p>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">Business Name</label>
          <input
            value={businessName}
            onChange={(e) => onBusinessNameChange(e.target.value)}
            placeholder="Your business name"
            className="w-full bg-secondary border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50"
          />
        </div>
        <div>
          <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">Brand Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => onBrandColorChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-card p-1"
            />
            <input
              value={brandColor}
              onChange={(e) => onBrandColorChange(e.target.value)}
              className="flex-1 bg-secondary border border-border text-foreground rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          </div>
        </div>
        <div>
          <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">Logo (optional)</label>
          {logoDataUrl ? (
            <div className="flex items-center gap-2">
              <img
                src={logoDataUrl}
                alt="logo"
                className="h-10 max-w-[120px] object-contain border border-border rounded-lg p-1 bg-card"
              />
              <button
                onClick={onLogoRemove}
                aria-label="Remove logo"
                className="w-11 h-11 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer bg-secondary border border-dashed border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/50 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload logo</span>
              <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}