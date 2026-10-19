import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, RefreshCw, ArrowLeft, Sparkles, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { accountStorage } from "@/lib/account-storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PLATFORMS = [
  { value: "gohighlevel", label: "Go High Level" },
  { value: "base44", label: "Hosted in the app" },
  { value: "taxnitro", label: "Tax Nitro" },
  { value: "custom", label: "Custom / Export" },
];

const VISUAL_MODES = [
  { value: "conversion", label: "Conversion Mode", desc: "Bold, urgent, high-contrast" },
  { value: "brand", label: "Brand Mode", desc: "Bright, lifestyle, polished" },
  { value: "emotional", label: "Emotional Mode", desc: "Elegant, soft, aspirational" },
];

const SCOPE_OPTIONS = [
  { value: "single", label: "Single ad / landing graphic" },
  { value: "full", label: "Full multi-step funnel (landing → order → upsell → thank-you)" },
];

export default function FunnelInputForm({ onGenerate, onBack, loading }) {
  const savedForm = (() => { try { return JSON.parse(accountStorage.getItem("funnelFormDraft") || "null"); } catch { return null; } })();
  const [form, setForm] = useState({
    business_name: "",
    industry: "",
    target_avatar: "",
    core_service: "",
    offer: "",
    offer_price: "",
    core_promise: "",
    audience_pain: "",
    audience_desire: "",
    funnel_scope: "full",
    visual_mode: "conversion",
    brand_colors: "",
    brand_fonts: "",
    urgency_mechanism: "",
    cta_action: "",
    contact_info: "",
    platform: "gohighlevel",
    custom_context: "",
    ...savedForm,
  });
  const [logoUrl, setLogoUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const [intakeData, setIntakeData] = useState(null);

  const loadIntake = (parsed) => {
    const intake = parsed.intake || {};
    const result = parsed.result || {};
    setIntakeData({ intake, result });
    const ht = result.offer_ladder?.high_ticket || {};
    setForm((f) => ({
      ...f,
      business_name: f.business_name || (intake.what ? intake.what.slice(0, 60) : ""),
      target_avatar: f.target_avatar || intake.who || "",
      core_service: f.core_service || intake.what || "",
      offer: f.offer || (ht.name ? `${ht.name} (${ht.price || ""})` : ""),
      offer_price: f.offer_price || ht.price || "",
      core_promise: f.core_promise || intake.result || "",
      audience_desire: f.audience_desire || intake.result || "",
      audience_pain: f.audience_pain || intake.problem || "",
      platform: f.platform || intake.platform || "gohighlevel",
    }));
  };

  useEffect(() => {
    const raw = accountStorage.getItem("launchSystem");
    if (raw) {
      try { loadIntake(JSON.parse(raw)); } catch (_) {}
    }
  }, []);

  useEffect(() => {
    accountStorage.setItem("funnelFormDraft", JSON.stringify(form));
  }, [form]);

  const handleFile = async (e, setter, setUploadingFlag) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFlag(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setter(file_url);
    } catch { /* optional */ }
    setUploadingFlag(false);
  };

  const submit = () => {
    if (!form.business_name || !form.target_avatar || !form.core_service) return;
    onGenerate({
      ...form,
      logo_url: logoUrl,
      subject_photo_url: photoUrl,
      dream_outcome: intakeData?.intake?.result,
      biggest_challenge: intakeData?.intake?.problem,
      offer_ladder: intakeData?.result?.offer_ladder || null,
      generated_funnel_map: intakeData?.result?.funnel_map || null,
      freebie_strategy: intakeData?.result?.freebie_strategy || null,
    });
  };

  const canSubmit = form.business_name && form.target_avatar && form.core_service && form.offer && form.cta_action;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="light-card rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">Build your offer sales funnel</h2>
        </div>

        {/* SECTION 1: The Offer */}
        <div className="space-y-4 pt-2 border-t border-border">
          <p className="text-sm font-bold text-primary uppercase tracking-wider pt-3">1. The Offer</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Business Name *</Label>
              <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="e.g. ScaleUp Coaching" className="bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Industry</Label>
              <Input value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="e.g. B2B Coaching" className="bg-card border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">What's being sold (the offer) *</Label>
            <Textarea value={form.offer} onChange={(e) => set("offer", e.target.value)} placeholder="e.g. 12-week 1-on-1 scaling coaching + done-for-you funnels" className="bg-card border-border resize-none" rows={2} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Price</Label>
              <Input value={form.offer_price} onChange={(e) => set("offer_price", e.target.value)} placeholder="e.g. $5,000 (was $8,000)" className="bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Core Promise / Result</Label>
              <Input value={form.core_promise} onChange={(e) => set("core_promise", e.target.value)} placeholder="e.g. Scale to 6 figures in 90 days" className="bg-card border-border" />
            </div>
          </div>
        </div>

        {/* SECTION 2: Audience */}
        <div className="space-y-4 border-t border-border pt-3">
          <p className="text-sm font-bold text-primary uppercase tracking-wider">2. Audience</p>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Who it's for (avatar) *</Label>
            <Textarea value={form.target_avatar} onChange={(e) => set("target_avatar", e.target.value)} placeholder="e.g. Founders at $20k-$50k/mo who want to scale without ads" className="bg-card border-border resize-none" rows={2} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pain Point</Label>
              <Textarea value={form.audience_pain} onChange={(e) => set("audience_pain", e.target.value)} placeholder="e.g. Stuck working IN the business, no predictable lead flow" className="bg-card border-border resize-none" rows={2} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Desire / Aspiration</Label>
              <Textarea value={form.audience_desire} onChange={(e) => set("audience_desire", e.target.value)} placeholder="e.g. Freedom, predictable revenue, a team that runs it" className="bg-card border-border resize-none" rows={2} />
            </div>
          </div>
        </div>

        {/* SECTION 3: Funnel Scope */}
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-sm font-bold text-primary uppercase tracking-wider">3. Funnel Scope</p>
          <div className="grid md:grid-cols-2 gap-3">
            {SCOPE_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => set("funnel_scope", opt.value)}
                className={`text-left p-4 rounded-xl border transition-all ${form.funnel_scope === opt.value ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                <p className="font-semibold text-foreground text-sm">{opt.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 4: Visual Mode */}
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-sm font-bold text-primary uppercase tracking-wider">4. Visual Mode</p>
          <div className="grid md:grid-cols-3 gap-3">
            {VISUAL_MODES.map((m) => (
              <button key={m.value} type="button" onClick={() => set("visual_mode", m.value)}
                className={`text-left p-4 rounded-xl border transition-all ${form.visual_mode === m.value ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                <p className="font-semibold text-foreground text-sm">{m.label}</p>
                <p className="text-muted-foreground text-sm mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 5: Brand Assets */}
        <div className="space-y-4 border-t border-border pt-3">
          <p className="text-sm font-bold text-primary uppercase tracking-wider">5. Brand Assets</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Brand Colors</Label>
              <Input value={form.brand_colors} onChange={(e) => set("brand_colors", e.target.value)} placeholder="e.g. Navy #0f1a2e + Gold #d4a843" className="bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fonts</Label>
              <Input value={form.brand_fonts} onChange={(e) => set("brand_fonts", e.target.value)} placeholder="e.g. Plus Jakarta Sans / Inter" className="bg-card border-border" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Logo (optional)</Label>
              {logoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="logo" className="h-12 w-12 rounded-lg object-contain border border-border bg-card p-1" />
                  <button onClick={() => setLogoUrl("")} className="text-muted-foreground hover:text-rose-600 flex items-center gap-1 text-sm"><X className="w-4 h-4" /> Remove</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-border rounded-xl px-4 py-2.5 hover:border-primary/50 text-muted-foreground text-sm w-fit">
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Uploading..." : "Upload logo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setLogoUrl, setUploading)} />
                </label>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Subject Photo (optional)</Label>
              {photoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={photoUrl} alt="subject" className="h-12 w-12 rounded-lg object-cover border border-border" />
                  <button onClick={() => setPhotoUrl("")} className="text-muted-foreground hover:text-rose-600 flex items-center gap-1 text-sm"><X className="w-4 h-4" /> Remove</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-border rounded-xl px-4 py-2.5 hover:border-primary/50 text-muted-foreground text-sm w-fit">
                  {uploadingPhoto ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  {uploadingPhoto ? "Uploading..." : "Upload photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setPhotoUrl, setUploadingPhoto)} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 6: Urgency */}
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-sm font-bold text-primary uppercase tracking-wider">6. Urgency Mechanism</p>
          <Input value={form.urgency_mechanism} onChange={(e) => set("urgency_mechanism", e.target.value)} placeholder="e.g. First 5 clients only · Bonus expires Friday" className="bg-card border-border" />
        </div>

        {/* SECTION 7: CTA */}
        <div className="space-y-4 border-t border-border pt-3">
          <p className="text-sm font-bold text-primary uppercase tracking-wider">7. Call To Action</p>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Exact CTA Action *</Label>
            <Input value={form.cta_action} onChange={(e) => set("cta_action", e.target.value)} placeholder="e.g. Book a free scaling call" className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Info (link / phone / handle)</Label>
            <Input value={form.contact_info} onChange={(e) => set("contact_info", e.target.value)} placeholder="e.g. scaleup.com/call · @scaleup · (555) 123-4567" className="bg-card border-border" />
          </div>
        </div>

        {/* Platform + context */}
        <div className="space-y-4 border-t border-border pt-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Deployment Platform</Label>
            <Select value={form.platform} onValueChange={(v) => set("platform", v)}>
              <SelectTrigger className="w-full bg-card border border-border h-11 rounded-lg text-sm focus:ring-2 focus:ring-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Additional Context <span className="normal-case text-muted-foreground/60">(optional)</span></Label>
            <Textarea value={form.custom_context} onChange={(e) => set("custom_context", e.target.value)} placeholder="Anything else the designer should know..." className="bg-card border-border resize-none" rows={2} />
          </div>
        </div>

        <Button onClick={submit} disabled={loading || !canSubmit} className="w-full accent-gradient text-white font-bold h-12 text-base">
          {loading ? <><RefreshCw className="w-5 h-5 animate-spin mr-2" />Building Your Funnel (~30-90s)...</>
            : <><Sparkles className="w-5 h-5 mr-2" />Build My Funnel with AI</>}
        </Button>
        {!canSubmit && <p className="text-sm text-muted-foreground text-center">Fill in the offer, audience, and CTA to continue.</p>}
      </div>
    </div>
  );
}