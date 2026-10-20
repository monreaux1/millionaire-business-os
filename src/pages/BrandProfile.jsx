import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Palette, Upload, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { EMPTY_BRAND_PROFILE, getBrandCompletion, getBrandProfileForBusiness, saveBrandProfile } from "@/lib/brand-profile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const inputClass = "w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50";
const sections = ["Visual Identity", "Voice & Style", "Contact & Footer"];

export default function BrandProfile() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [form, setForm] = useState(EMPTY_BRAND_PROFILE);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadBusinesses = async () => {
    const list = await base44.entities.Business.list("-updated_date");
    setBusinesses(list || []);
    if (list?.[0]) await chooseBusiness(list[0].id, list);
    setLoading(false);
  };

  useEffect(() => { loadBusinesses(); }, []);

  const chooseBusiness = async (id, list = businesses) => {
    setSelectedBusinessId(id);
    setSaved(false);
    const business = list.find((item) => item.id === id);
    const existing = await getBrandProfileForBusiness(id);
    setForm(existing || { ...EMPTY_BRAND_PROFILE, business_id: id, brand_name: business?.business_name || "" });
  };

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const upload = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setField(field, file_url);
    } finally {
      setUploading("");
    }
  };

  const persist = async () => {
    if (!selectedBusinessId || !form.brand_name.trim()) return;
    setSaving(true);
    try {
      const result = await saveBrandProfile({ ...form, business_id: selectedBusinessId });
      setForm(result);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const score = getBrandCompletion(form);
  const business = businesses.find((item) => item.id === selectedBusinessId);

  if (loading) return <AppLayout><div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadBusinesses}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen hero-radial">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-wider mb-3"><Palette className="w-4 h-4" /> Reusable Brand Kit</div>
          <h1 className="font-display text-3xl font-black text-foreground mb-2">Brand Board</h1>
          <p className="text-muted-foreground">Set your logo, colors, fonts and voice once. Every funnel, freebie and piece of copy the app creates uses it automatically.</p>
        </div>

        {!businesses.length ? (
          <div className="p-8 rounded-2xl border border-border bg-card text-center">
            <h2 className="font-bold text-xl mb-2">Create your Business Profile first</h2>
            <p className="text-muted-foreground mb-5">Each business gets its own Brand Board, so multiple brands stay separate.</p>
            <Link to="/BusinessSetup"><Button className="accent-gradient text-white">Create Business Profile</Button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-border bg-card">
              <label className="text-sm font-bold uppercase text-muted-foreground block mb-2">Business</label>
              <Select value={selectedBusinessId} onValueChange={(v) => chooseBusiness(v)}>
                <SelectTrigger className="w-full bg-card border border-border text-foreground rounded-xl h-11 px-4 text-sm">
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((item) => <SelectItem key={item.id} value={item.id}>{item.business_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: score + "%" }} /></div>
              <p className="text-sm text-muted-foreground mt-2">{score}% brand-ready. You can save a draft and finish later.</p>
            </div>

            <div className="rounded-2xl border border-border overflow-hidden" style={{ background: form.background_color || "#ffffff" }}>
              <div className="flex flex-wrap items-center gap-4 p-5 border-b border-black/10">
                {form.logo_url
                  ? <img src={form.logo_url} alt={form.brand_name || "Logo"} className="h-14 w-auto max-w-[180px] object-contain" />
                  : <span className="h-14 w-14 rounded-xl grid place-items-center text-white text-xl font-black" style={{ background: form.primary_color }}>{(form.brand_name || "B").slice(0, 1).toUpperCase()}</span>}
                <div className="min-w-0">
                  <p className="text-xl font-black truncate" style={{ color: form.text_color || "#111", fontFamily: form.heading_font || undefined }}>{form.brand_name || "Your brand name"}</p>
                  <p className="text-sm" style={{ color: form.text_color || "#111", opacity: 0.6, fontFamily: form.body_font || undefined }}>{form.tone || form.visual_style || "Your brand at a glance"}</p>
                </div>
              </div>
              <div className="grid grid-cols-5">
                {["primary_color", "secondary_color", "accent_color", "background_color", "text_color"].map((field) => (
                  <div key={field} className="h-16 flex items-end p-2" style={{ background: form[field] }}>
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/85 text-black">{form[field]}</span>
                  </div>
                ))}
              </div>
              <div className="p-5 flex flex-wrap items-center gap-4">
                <span className="text-2xl font-black" style={{ color: form.secondary_color, fontFamily: form.heading_font || undefined }}>Aa {form.heading_font || "Heading font"}</span>
                <span className="text-sm" style={{ color: form.text_color || "#111", fontFamily: form.body_font || undefined }}>Body text in {form.body_font || "your body font"}</span>
                <span className="ml-auto rounded-xl px-4 py-2 text-white text-sm font-bold" style={{ background: form.primary_color }}>Button</span>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {sections.map((label, index) => (
                <button key={label} onClick={() => setStep(index)} className={"px-4 py-3 min-h-[44px] inline-flex items-center rounded-full whitespace-nowrap text-sm font-semibold border " + (step === index ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}>{index + 1}. {label}</button>
              ))}
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
              {step === 0 && <>
                <div><label className="text-sm font-bold uppercase text-muted-foreground block mb-2">Brand Name *</label><input className={inputClass} value={form.brand_name} onChange={(e) => setField("brand_name", e.target.value)} /></div>
                <div className="grid md:grid-cols-3 gap-4">
                  {["logo_url", "secondary_logo_url", "favicon_url"].map((field) => (
                    <div key={field}><label className="text-sm font-bold uppercase text-muted-foreground block mb-2">{field.replaceAll("_", " ")}</label>
                      {form[field] ? <img src={form[field]} alt="" className="h-20 w-full object-contain rounded-xl border border-border p-2" /> : null}
                      <label className="mt-2 flex items-center justify-center gap-2 cursor-pointer border border-dashed border-border rounded-xl px-3 py-2 text-sm text-muted-foreground hover:border-primary/50">
                        {uploading === field ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e, field)} />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {["primary_color", "secondary_color", "accent_color", "background_color", "text_color"].map((field) => (
                    <div key={field}><label className="text-sm font-bold uppercase text-muted-foreground block mb-2">{field.replace("_color", "")}</label><input type="color" value={form[field]} onChange={(e) => setField(field, e.target.value)} className="w-full h-12 rounded-lg border border-border p-1 bg-card" /><input value={form[field]} onChange={(e) => setField(field, e.target.value)} className="mt-1 w-full text-sm font-mono border border-border rounded px-2 py-1" /></div>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-4"><div><label className="text-sm font-bold uppercase text-muted-foreground block mb-2">Heading Font</label><input className={inputClass} value={form.heading_font} onChange={(e) => setField("heading_font", e.target.value)} placeholder="e.g. Montserrat" /></div><div><label className="text-sm font-bold uppercase text-muted-foreground block mb-2">Body Font</label><input className={inputClass} value={form.body_font} onChange={(e) => setField("body_font", e.target.value)} placeholder="e.g. Inter" /></div></div>
              </>}

              {step === 1 && <>
                {[["brand_voice","Brand Voice","How should your brand sound?"],["tone","Tone","Warm, authoritative, playful, direct..."],["visual_style","Visual Style","Clean, luxurious, bold, editorial..."],["phrases_to_use","Phrases to Use","Words, taglines, and signature phrases"],["phrases_to_avoid","Phrases to Avoid","Language the AI should never use"]].map(([field,label,placeholder]) => <div key={field}><label className="text-sm font-bold uppercase text-muted-foreground block mb-2">{label}</label><textarea rows={3} className={inputClass + " resize-none"} value={form[field]} onChange={(e) => setField(field,e.target.value)} placeholder={placeholder} /></div>)}
              </>}

              {step === 2 && <>
                <div className="grid md:grid-cols-2 gap-4">{[["website","Website"],["email","Business Email"],["phone","Phone"],["booking_link","Booking Link"],["privacy_url","Privacy Policy URL"],["terms_url","Terms URL"]].map(([field,label]) => <div key={field}><label className="text-sm font-bold uppercase text-muted-foreground block mb-2">{label}</label><input className={inputClass} value={form[field]} onChange={(e) => setField(field,e.target.value)} /></div>)}</div>
                {[["social_links","Social Links","One link per line"],["proof_assets","Testimonials, Results & Credentials","Add proof, awards, certifications, and results the AI may use"],["copyright_text","Copyright / Footer Text","e.g. © 2026 Your Business. All rights reserved."]].map(([field,label,placeholder]) => <div key={field}><label className="text-sm font-bold uppercase text-muted-foreground block mb-2">{label}</label><textarea rows={3} className={inputClass + " resize-none"} value={form[field]} onChange={(e) => setField(field,e.target.value)} placeholder={placeholder} /></div>)}
              </>}

              <div className="pt-4 border-t border-border flex flex-wrap justify-between gap-3">
                <Button variant="outline" onClick={persist} disabled={saving || !form.brand_name.trim()}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Save & Finish Later</Button>
                {step < 2 ? <Button onClick={() => setStep(step + 1)} className="accent-gradient text-white">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button> : <Button onClick={persist} disabled={saving || !form.brand_name.trim()} className="accent-gradient text-white">{saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}{saved ? "Brand Board Saved" : "Save Brand Board"}</Button>}
              </div>
            </div>

            {saved && <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><strong>Brand intelligence saved for {business?.business_name}.</strong><p className="text-emerald-800 dark:text-emerald-300 mt-1">Your Asset Creator and future generators can now apply this brand automatically.</p></div><Link to="/MoneyModelBuilder"><Button className="bg-black text-white hover:bg-black/85 whitespace-nowrap">Continue to Money Model <ArrowRight className="w-4 h-4 ml-2" /></Button></Link></div>}
          </div>
        )}
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}