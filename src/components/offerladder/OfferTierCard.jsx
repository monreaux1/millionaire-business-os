import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Pencil, Save, X } from "lucide-react";

export default function OfferTierCard({ tier, offer, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(offer);

  useEffect(() => { setDraft(offer); }, [offer]);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const save = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(offer); setEditing(false); };

  const fieldCls = "w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50";

  if (editing) {
    return (
      <div className={`light-card rounded-2xl border ${tier.border} p-6 md:p-8`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <Badge className={`${tier.badge} font-bold text-sm`}>{tier.label} — EDIT</Badge>
          <div className="flex gap-2">
            <Button onClick={save} size="sm" className="accent-gradient text-white gap-1 h-8 hover:opacity-90">
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
            <Button onClick={cancel} size="sm" variant="outline" className="gap-1 h-8">
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">Offer Name</label>
            <input value={draft.name || ""} onChange={(e) => set("name", e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">Price</label>
            <input value={draft.price || ""} onChange={(e) => set("price", e.target.value)} className={fieldCls} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">What's Included (one per line)</label>
            <textarea rows={4} value={(draft.whats_included || []).join("\n")}
              onChange={(e) => set("whats_included", e.target.value.split("\n").filter(Boolean))}
              className={`${fieldCls} resize-none`} />
          </div>
          <div>
            <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">Quick Win Promise</label>
            <textarea rows={2} value={draft.quick_win || ""} onChange={(e) => set("quick_win", e.target.value)} className={`${fieldCls} resize-none`} />
          </div>
          <div>
            <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">Order Bump</label>
            <textarea rows={2} value={draft.order_bump || ""} onChange={(e) => set("order_bump", e.target.value)} className={`${fieldCls} resize-none`} />
          </div>
          <div>
            <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">Delivery Format</label>
            <input value={draft.delivery_format || ""} onChange={(e) => set("delivery_format", e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">Guarantee</label>
            <input value={draft.guarantee || ""} onChange={(e) => set("guarantee", e.target.value)} className={fieldCls} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`light-card rounded-2xl border ${tier.border} ${tier.glow} transition-all p-6 md:p-8`}>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <Badge className={`${tier.badge} font-bold text-sm mb-1`}>{tier.label}</Badge>
          <p className="text-muted-foreground text-sm">{tier.sub}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-black text-3xl ${tier.priceCls}`}>{offer.price}</span>
          <button onClick={() => { setDraft(offer); setEditing(true); }}
            className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            title="Edit this offer">
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>
      <h3 className="text-foreground font-display font-bold text-2xl mb-5">{offer.name}</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-3">What's Included</p>
          <ul className="space-y-2">
            {offer.whats_included?.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-primary text-sm font-bold uppercase mb-1">Quick Win Promise</p>
            <p className="text-foreground text-sm">{offer.quick_win}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-purple-600 text-sm font-bold uppercase mb-1">Order Bump</p>
            <p className="text-foreground text-sm">{offer.order_bump}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-blue-600 text-sm font-bold uppercase mb-1">Delivery Format</p>
            <p className="text-foreground text-sm">{offer.delivery_format}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-emerald-600 text-sm font-bold uppercase mb-1">🛡 Guarantee</p>
            <p className="text-foreground text-sm">{offer.guarantee}</p>
          </div>
        </div>
      </div>
    </div>
  );
}