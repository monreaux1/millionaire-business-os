import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { accountStorage } from "@/lib/account-storage";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Plus, Trash2, Monitor, Smartphone } from "lucide-react";

const BLOCK_TYPES = [
  { value: "hero",        label: "🦸 Hero",            color: "border-blue-300 text-blue-600" },
  { value: "vsl",         label: "🎬 VSL Video",        color: "border-rose-300 text-rose-600" },
  { value: "problem",     label: "🔥 Problem",          color: "border-rose-300 text-rose-600" },
  { value: "opportunity", label: "💡 Opportunity",      color: "border-amber-300 text-amber-600" },
  { value: "dream",       label: "✨ Dream Outcome",    color: "border-purple-300 text-purple-600" },
  { value: "offer",       label: "💎 Offer Stack",      color: "border-primary/30 text-primary" },
  { value: "bonuses",     label: "🎁 Bonus Section",    color: "border-emerald-300 text-emerald-600" },
  { value: "testimonials",label: "⭐ Proof / Testimonials", color: "border-amber-300 text-amber-600" },
  { value: "pricing",     label: "💰 Pricing / CTA",    color: "border-primary/30 text-primary" },
  { value: "faq",         label: "❓ FAQ",              color: "border-gray-300 text-gray-600" },
  { value: "urgency",     label: "⏳ Urgency",          color: "border-orange-300 text-orange-600" },
  { value: "form",        label: "📋 Form / Calendar",  color: "border-orange-300 text-orange-600" },
  { value: "checkout",    label: "🛒 Checkout",         color: "border-emerald-300 text-emerald-600" },
  { value: "application", label: "📝 Application",      color: "border-orange-300 text-orange-600" },
  { value: "thankyou",    label: "🏆 Thank You",        color: "border-emerald-300 text-emerald-600" },
  { value: "upsell",      label: "⬆️ Upsell",          color: "border-purple-300 text-purple-600" },
  { value: "email",       label: "📨 Email Sequence",   color: "border-indigo-300 text-indigo-600" },
  { value: "sms",         label: "📱 SMS Follow Up",    color: "border-pink-300 text-pink-600" },
];

const PLATFORMS = [
  { value: "gohighlevel", label: "Go High Level", icon: "🔶" },
  { value: "base44", label: "Hosted in the app", icon: "🔵" },
  { value: "taxnitro", label: "Tax Nitro", icon: "🟢" },
  { value: "custom", label: "Custom", icon: "📄" },
];

const FUNNEL_TEMPLATES = {
  lead_magnet: {
    label: "🧲 Lead Magnet Funnel",
    desc: "Freebie → Email → Offer",
    blocks: [
      { type: "hero",        label: "Opt-in Landing Page",      note: "Headline + freebie offer + email capture" },
      { type: "email",       label: "Delivery Email",           note: "Send freebie + intro sequence begins" },
      { type: "email",       label: "Nurture Sequence (3-5)",   note: "Value emails → soft pitch → hard pitch" },
      { type: "offer",       label: "Offer Page",               note: "Main paid offer reveal" },
      { type: "pricing",     label: "Pricing + CTA",            note: "Buy button + guarantee" },
      { type: "thankyou",    label: "Thank You Page",           note: "Confirmation + next steps + upsell" },
    ]
  },
  vsl_funnel: {
    label: "🎬 VSL Funnel",
    desc: "Opt-in → VSL → Checkout",
    blocks: [
      { type: "hero",        label: "Landing Page",             note: "Short copy + opt-in or go straight to VSL" },
      { type: "vsl",         label: "VSL Page",                 note: "Autoplay video — full sales message" },
      { type: "problem",     label: "Problem Section",          note: "Below video — amplify pain" },
      { type: "offer",       label: "Offer Stack",              note: "What they get + bonuses" },
      { type: "testimonials",label: "Proof Stack",              note: "Results, screenshots, testimonials" },
      { type: "pricing",     label: "Pricing + Guarantee",      note: "CTA button + risk reversal" },
      { type: "urgency",     label: "Urgency Section",          note: "Deadline / limited spots" },
      { type: "faq",         label: "FAQ / Objections",         note: "Handle price, time, trust" },
      { type: "checkout",    label: "Checkout",                 note: "Payment + form" },
      { type: "thankyou",    label: "Thank You",                note: "Next steps + upsell" },
    ]
  },
  high_ticket: {
    label: "📞 High Ticket Application",
    desc: "VSL → Qualify → Call",
    blocks: [
      { type: "hero",        label: "Landing Page",             note: "Bold claim + short video or headline" },
      { type: "vsl",         label: "VSL / Webinar",            note: "Authority-building video" },
      { type: "problem",     label: "Problem Section",          note: "Who this is for + pain" },
      { type: "opportunity", label: "Opportunity Shift",        note: "New mechanism intro" },
      { type: "testimonials",label: "Case Studies",             note: "Transformation stories" },
      { type: "application", label: "Application Form",        note: "Qualify leads — keep low quality out" },
      { type: "form",        label: "Calendar Booking",         note: "Book strategy call after qualifying" },
      { type: "thankyou",    label: "Pre-Call Thank You",       note: "Watch this before your call + set expectations" },
    ]
  }
};

const mk = (blocks) => blocks.map((b, i) => ({ id: `b-${i}-${Date.now()}`, platform: "gohighlevel", ...b }));

const DEFAULT_BLOCKS = mk([
  { type: "hero",        label: "Hero Section",        note: "" },
  { type: "problem",     label: "Problem Agitate",     note: "" },
  { type: "offer",       label: "Offer Stack Reveal",  note: "" },
  { type: "bonuses",     label: "Bonus Stack",         note: "" },
  { type: "testimonials",label: "Social Proof Wall",   note: "" },
  { type: "pricing",     label: "Pricing & Guarantee", note: "" },
  { type: "faq",         label: "FAQ",                 note: "" },
  { type: "checkout",    label: "Checkout",            note: "" },
  { type: "upsell",      label: "One-Click Upsell",    note: "" },
  { type: "thankyou",    label: "Thank You Page",      note: "" },
]);

export default function FunnelCanvas() {
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [preview, setPreview] = useState("desktop");
  const [activeTemplate, setActiveTemplate] = useState(null);

  const loadCanvas = () => {
    try {
      const stored = accountStorage.getItem("funnelCanvasDraft");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.blocks) && parsed.blocks.length) {
          setBlocks(parsed.blocks);
          setActiveTemplate(parsed.activeTemplate || null);
        }
      }
    } catch (error) {
      console.warn("Saved funnel canvas could not be loaded:", error);
    }
  };

  useEffect(() => { loadCanvas(); }, []);

  useEffect(() => {
    accountStorage.setItem("funnelCanvasDraft", JSON.stringify({ blocks, activeTemplate }));
  }, [blocks, activeTemplate]);

  const loadTemplate = (key) => {
    const tpl = FUNNEL_TEMPLATES[key];
    if (!tpl) return;
    setBlocks(mk(tpl.blocks));
    setActiveTemplate(key);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(blocks);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setBlocks(items);
  };

  const addBlock = () => {
    setBlocks(prev => [...prev, { id: `b-${Date.now()}`, type: "hero", label: "New Block", platform: "gohighlevel", note: "" }]);
  };

  const removeBlock = (id) => setBlocks(prev => prev.filter(b => b.id !== id));
  const updateBlock = (id, field, val) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b));
  const getBlockType = (val) => BLOCK_TYPES.find(b => b.value === val) || BLOCK_TYPES[0];
  const getPlatform = (val) => PLATFORMS.find(p => p.value === val) || PLATFORMS[3];

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadCanvas}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto hero-radial min-h-screen">
        <div className="mb-8">
          <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">FUNNEL CANVAS</Badge>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl font-black text-foreground mb-2">Drag & Drop Funnel Builder</h1>
              <p className="text-muted-foreground">Arrange funnel blocks and tag each to its deployment platform.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button onClick={() => setPreview("desktop")} className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${preview === "desktop" ? "bg-primary text-white font-bold" : "text-muted-foreground hover:text-foreground"}`}>
                  <Monitor className="w-4 h-4" /> Desktop
                </button>
                <button onClick={() => setPreview("mobile")} className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${preview === "mobile" ? "bg-primary text-white font-bold" : "text-muted-foreground hover:text-foreground"}`}>
                  <Smartphone className="w-4 h-4" /> Mobile
                </button>
              </div>
              <Button onClick={addBlock} className="accent-gradient text-white font-bold px-4 py-2 h-auto rounded-xl hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" /> Add Block
              </Button>
            </div>
          </div>
        </div>

        {/* Funnel Templates */}
        <div className="mb-6">
          <p className="text-muted-foreground text-sm font-bold uppercase mb-3">Load a Funnel Template</p>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(FUNNEL_TEMPLATES).map(([key, tpl]) => (
              <button key={key} onClick={() => loadTemplate(key)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${activeTemplate === key ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
                <p className={`font-bold text-sm mb-1 ${activeTemplate === key ? 'text-primary' : 'text-foreground'}`}>{tpl.label}</p>
                <p className="text-muted-foreground text-sm">{tpl.desc} · {tpl.blocks.length} blocks</p>
              </button>
            ))}
          </div>
        </div>

        {/* Platform Legend */}
        <div className="flex flex-wrap gap-3 mb-6">
          {PLATFORMS.map(p => (
            <span key={p.value} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>{p.icon}</span> {p.label}
            </span>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {PLATFORMS.map(p => (
            <div key={p.value} className="light-card rounded-xl p-3 text-center">
              <p className="text-foreground font-black text-xl">{blocks.filter(b => b.platform === p.value).length}</p>
              <p className="text-muted-foreground text-sm">{p.icon} {p.label}</p>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className={`transition-all mx-auto ${preview === "mobile" ? "max-w-sm" : "max-w-full"}`}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="funnel-canvas">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {blocks.map((block, index) => {
                    const bType = getBlockType(block.type);
                    const plat = getPlatform(block.platform);
                    return (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}
                            className={`light-card rounded-xl border ${bType.color.split(' ')[0]} p-4 transition-all ${snapshot.isDragging ? "shadow-2xl scale-[1.02] opacity-90" : ""}`}>
                            <div className="flex items-start gap-3">
                              <div {...provided.dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-black text-foreground text-sm flex-shrink-0">{index + 1}</div>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <Input value={block.label} onChange={e => updateBlock(block.id, "label", e.target.value)}
                                  className="bg-card border-border text-foreground font-semibold h-9 text-sm" placeholder="Block name..." />
                                <Select value={block.type} onValueChange={v => updateBlock(block.id, "type", v)}>
                                  <SelectTrigger className="bg-card border-border text-foreground h-11 md:h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border-border">
                                    {BLOCK_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-foreground">{t.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Select value={block.platform} onValueChange={v => updateBlock(block.id, "platform", v)}>
                                  <SelectTrigger className="bg-card border-border text-foreground h-11 md:h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border-border">
                                    {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value} className="text-foreground">{p.icon} {p.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className={`text-sm hidden md:flex border ${bType.color}`}>{bType.label.split(' ').slice(1).join(' ')}</Badge>
                                <button onClick={() => removeBlock(block.id)} className="text-muted-foreground hover:text-rose-600 transition-colors p-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 ml-16">
                              <Input value={block.note} onChange={e => updateBlock(block.id, "note", e.target.value)}
                                className="bg-card border-border text-muted-foreground text-sm h-8" placeholder="Add a note (link, copy direction, tool)..." />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}