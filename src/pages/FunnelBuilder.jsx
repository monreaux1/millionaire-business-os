import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { funnelBuilderGenerate } from "@/functions/funnelBuilderGenerate";
import { accountStorage } from "@/lib/account-storage";
import { getLatestBusinessProfile } from "@/lib/business-profile";
import { getBrandCompletion, getBrandProfileForBusiness } from "@/lib/brand-profile";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CreditCard,
  FileText, Gift, Loader2, Palette, Rocket, Sparkles, Target, Users
} from "lucide-react";

const GOALS = [
  { value: "lead_generation", label: "Freebie / Lead Generation", description: "Collect contact information and deliver a free resource.", icon: Gift },
  { value: "paid_product", label: "Paid Digital Product", description: "Sell a product with checkout, optional upsell, and delivery.", icon: CreditCard },
  { value: "booking", label: "Service / Booking", description: "Capture the lead and guide them to a call or appointment.", icon: CalendarDays },
  { value: "webinar", label: "Webinar / Zoom", description: "Register attendees and deliver event access and next steps.", icon: Users },
  { value: "application", label: "Application Funnel", description: "Qualify prospects before inviting them to the next step.", icon: FileText },
];

const DEFAULT_FORM = {
  funnel_goal: "lead_generation",
  offer: "",
  offer_price: "",
  core_promise: "",
  cta_action: "Get Instant Access",
  asset_id: "",
  asset_title: "",
  asset_type: "",
  checkout_url: "",
  delivery_url: "",
  booking_url: "",
  custom_context: "",
  visual_mode: "brand",
};

const goalDefaults = {
  lead_generation: { cta_action: "Get Instant Access", asset_type: "lead_magnet" },
  paid_product: { cta_action: "Buy Now", asset_type: "digital_product" },
  booking: { cta_action: "Book My Call", asset_type: "service" },
  webinar: { cta_action: "Save My Seat", asset_type: "webinar" },
  application: { cta_action: "Start My Application", asset_type: "application" },
};

export default function FunnelBuilder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [business, setBusiness] = useState(null);
  const [brand, setBrand] = useState(null);
  const [moneyModel, setMoneyModel] = useState(null);
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);

  const load = async () => {
    try {
        const profile = await getLatestBusinessProfile();
        setBusiness(profile);
        if (!profile) return;

        const user = await base44.auth.me();
        if (!user?.email) throw new Error("An authenticated account is required.");

        const [brandProfile, models, assetRecords, commerceRecords] = await Promise.all([
          getBrandProfileForBusiness(profile.id),
          base44.entities.MoneyModel.filter(
            { business_id: profile.id, created_by: user.email, status: "complete" },
            "-updated_date",
            1
          ),
          base44.entities.AssetProject.filter(
            { business_id: profile.id, created_by: user.email },
            "-updated_date",
            50
          ),
          base44.entities.CommerceSettings.filter(
            { created_by: user.email },
            "-updated_date",
            1
          ),
        ]);

        const model = models?.[0] || null;
        const commerce = commerceRecords?.[0] || null;
        setBrand(brandProfile);
        setMoneyModel(model);
        setAssets(assetRecords || []);

        const saved = (() => {
          try { return JSON.parse(accountStorage.getItem("funnelFormDraft") || "null"); }
          catch { return null; }
        })();

        const modelOffer = model?.core_offer || {};
        setForm((current) => ({
          ...current,
          offer: modelOffer.name || profile.core_service || "",
          offer_price: modelOffer.price || "",
          core_promise: modelOffer.promise || profile.customer_result || profile.dream_outcome || "",
          checkout_url: commerce?.checkout_url || "",
          delivery_url: commerce?.delivery_url || "",
          ...(saved?.business_id === profile.id ? saved : {}),
        }));
      } catch (loadError) {
        console.error("Funnel Studio setup failed:", loadError);
        setError("Your saved business intelligence could not be loaded. Refresh the page or complete Business Foundation first.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const selectGoal = (goal) => {
    const defaults = goalDefaults[goal];
    setForm((current) => ({
      ...current,
      funnel_goal: goal,
      cta_action: defaults.cta_action,
      asset_type: current.asset_id ? current.asset_type : defaults.asset_type,
    }));
  };

  const selectAsset = (asset) => {
    setForm((current) => ({
      ...current,
      asset_id: asset.id,
      asset_title: asset.title || asset.business_name || "Saved asset",
      asset_type: asset.asset_type || asset.purpose || goalDefaults[current.funnel_goal].asset_type,
      offer: asset.title || current.offer,
      core_promise: asset.inputs?.result || asset.outline?.promise || current.core_promise,
    }));
  };

  const canGenerate = Boolean(
    business &&
    form.offer.trim() &&
    form.core_promise.trim() &&
    form.cta_action.trim()
  );

  const readiness = useMemo(() => {
    const paid = form.funnel_goal === "paid_product";
    const needsBooking = form.funnel_goal === "booking";
    const needsDelivery = ["lead_generation", "paid_product", "webinar"].includes(form.funnel_goal);
    return [
      { label: "Business", ready: Boolean(business), action: "/BusinessFoundation" },
      { label: "Brand", ready: getBrandCompletion(brand) >= 50, action: "/BrandProfile" },
      { label: "Checkout", ready: !paid || Boolean(form.checkout_url), action: "/PaymentFulfillment" },
      {
        label: needsBooking ? "Booking" : "Delivery",
        ready: needsBooking ? Boolean(form.booking_url) : (!needsDelivery || Boolean(form.delivery_url)),
        action: "/PaymentFulfillment",
      },
    ];
  }, [business, brand, form]);

  const generate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError("");

    const paid = form.funnel_goal === "paid_product";
    const draft = {
      ...form,
      business_id: business.id,
      business_name: business.business_name,
      industry: business.industry || "",
      target_avatar: business.target_avatar || "",
      core_service: business.core_service || "",
      funnel_scope: paid ? "full" : "single",
      platform: "base44",
      brand_colors: [brand?.primary_color, brand?.secondary_color, brand?.accent_color].filter(Boolean).join(", "),
      brand_fonts: [brand?.heading_font, brand?.body_font].filter(Boolean).join(", "),
      logo_url: brand?.logo_url || "",
      brand_profile_id: brand?.id || "",
      money_model_id: moneyModel?.id || "",
    };

    try {
      accountStorage.setItem("funnelFormDraft", JSON.stringify(draft));
      const response = await funnelBuilderGenerate({
        ...draft,
        audience_pain: business.primary_problem || business.biggest_challenge || "",
        audience_desire: business.customer_result || business.dream_outcome || "",
        dream_outcome: business.dream_outcome || business.customer_result || "",
        unique_advantage: business.unique_advantage || "",
        pricing_model: business.pricing_model || "",
        current_revenue: business.current_revenue || 0,
        desired_revenue: business.desired_revenue || 0,
        biggest_challenge: business.biggest_challenge || "",
        offer_ladder: business.launch_system_snapshot?.result?.offer_ladder || null,
        generated_funnel_map: business.launch_system_snapshot?.result?.funnel_map || null,
        freebie_strategy: business.launch_system_snapshot?.result?.freebie_strategy || null,
      });

      const funnel = response.data?.funnel;
      if (!funnel?.landing_page || !funnel?.thank_you_page) {
        throw new Error(response.data?.error || "The AI response did not include the required funnel pages.");
      }

      const connections = {
        landing_page: {
          action: "lead_capture",
          destination: paid ? "order_page" : "thank_you_page",
          url: "",
        },
        ...(paid ? {
          order_page: {
            action: "checkout",
            destination: funnel.upsell_page ? "upsell_page" : "thank_you_page",
            url: form.checkout_url,
          },
          ...(funnel.upsell_page ? {
            upsell_page: { action: "next_page", destination: "thank_you_page", url: "" },
          } : {}),
        } : {}),
        thank_you_page: {
          action: form.funnel_goal === "booking" ? "booking" : "fulfillment",
          destination: "external",
          url: form.booking_url || form.delivery_url,
        },
      };

      const payment = {
        type: paid ? (form.checkout_url ? "payment_link" : "none") : "none",
        checkout_url: form.checkout_url,
      };
      const fulfillment = {
        type: form.funnel_goal === "booking" ? "booking" : form.funnel_goal === "webinar" ? "zoom" : "download",
        delivery_url: form.booking_url || form.delivery_url,
        instructions: "",
      };

      accountStorage.setItem("generatedFunnel", JSON.stringify(funnel));
      accountStorage.setItem("funnelBuilderState", JSON.stringify({ step: "complete", funnel }));
      accountStorage.setItem("funnelCreatorState", JSON.stringify({
        funnel,
        activePage: "landing_page",
        connections,
        leadDestination: { type: "app", notification_email: "", webhook_url: "", ghl_workflow: "" },
        payment,
        fulfillment,
        projectId: "",
        slug: "",
      }));
      navigate("/FunnelCreator");
    } catch (generationError) {
      console.error("Native funnel generation failed:", generationError);
      const message = String(generationError?.data?.error || generationError?.response?.data?.error || generationError?.message || "");
      setError(/credit|quota|limit/i.test(message)
        ? "The funnel could not be generated because the account reached its AI usage limit. Please try again in a few minutes."
        : message || "The funnel could not be generated. Your answers are still saved—please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <AppLayout><div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;
  }

  if (!business) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background grid place-items-center p-6">
          <div className="max-w-xl bg-card border border-border rounded-3xl p-8 text-center shadow-xl">
            <Target className="w-10 h-10 text-primary mx-auto" />
            <h1 className="font-display text-3xl font-black mt-4">Start with your business foundation</h1>
            <p className="text-muted-foreground mt-3">Funnel Studio uses your business, customer, offer, and branding to build the right funnel automatically.</p>
            <Link to="/BusinessFoundation"><Button className="mt-6 accent-gradient text-white">Complete Business Foundation</Button></Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PullToRefresh onRefresh={load}>
      <div className="min-h-screen bg-background p-5 md:p-10">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-5">
            <ArrowLeft className="w-4 h-4 mr-2" />Dashboard
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">NATIVE FUNNEL STUDIO</Badge>
              <h1 className="font-display text-4xl md:text-5xl font-black">Create My Funnel</h1>
              <p className="text-muted-foreground mt-3 max-w-2xl">Choose the goal, connect the offer, and let AI build branded pages hosted right here in the app.</p>
            </div>
            <div className="bg-[#111] text-white rounded-2xl p-4 min-w-[280px]">
              <p className="text-sm tracking-[0.18em] uppercase text-primary font-black">Intelligence loaded</p>
              <p className="font-display font-extrabold mt-1">{business.business_name}</p>
              <p className="text-sm text-white/45 mt-1">{business.industry} · Brand {getBrandCompletion(brand)}%</p>
            </div>
          </div>

          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          <section className="bg-card border border-border rounded-3xl p-6 md:p-8 mb-5">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-9 h-9 rounded-full bg-primary text-white grid place-items-center font-black">1</span>
              <div><h2 className="font-display font-black text-2xl">What should this funnel do?</h2><p className="text-sm text-muted-foreground">The goal determines which pages and connections are created.</p></div>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
              {GOALS.map(({ value, label, description, icon: Icon }) => (
                <button key={value} type="button" onClick={() => selectGoal(value)}
                  className={"text-left rounded-2xl border p-4 transition-all " + (form.funnel_goal === value ? "border-primary bg-primary/[0.06] shadow-sm" : "border-border hover:border-primary/35")}>
                  <Icon className={"w-5 h-5 " + (form.funnel_goal === value ? "text-primary" : "text-muted-foreground")} />
                  <p className="font-black mt-4 text-sm">{label}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
                </button>
              ))}
            </div>
          </section>

          <div className="grid lg:grid-cols-[1.45fr_0.75fr] gap-5">
            <section className="bg-card border border-border rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-9 h-9 rounded-full bg-primary text-white grid place-items-center font-black">2</span>
                <div><h2 className="font-display font-black text-2xl">Connect the offer</h2><p className="text-sm text-muted-foreground">Use a saved asset or describe what this funnel promotes.</p></div>
              </div>

              {assets.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-black uppercase tracking-wider text-muted-foreground">Your saved products and freebies</label>
                  <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    {assets.slice(0, 6).map((asset) => (
                      <button key={asset.id} type="button" onClick={() => selectAsset(asset)}
                        className={"rounded-xl border p-3 text-left " + (form.asset_id === asset.id ? "border-primary bg-primary/5" : "border-border")}>
                        <p className="font-bold text-sm">{asset.title || "Untitled asset"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{asset.asset_type} · {asset.status}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Field label="Offer, freebie, product, or event name" value={form.offer} onChange={(value) => update("offer", value)} />
                <Field label="Core promise or result" value={form.core_promise} onChange={(value) => update("core_promise", value)} area />
                {form.funnel_goal === "paid_product" && <Field label="Price" value={form.offer_price} onChange={(value) => update("offer_price", value)} placeholder="$97" />}
                <Field label="Button text" value={form.cta_action} onChange={(value) => update("cta_action", value)} />

                {form.funnel_goal === "paid_product" && <Field label="Checkout link" value={form.checkout_url} onChange={(value) => update("checkout_url", value)} placeholder="https://..." optional />}
                {form.funnel_goal === "booking" && <Field label="Booking calendar link" value={form.booking_url} onChange={(value) => update("booking_url", value)} placeholder="https://..." optional />}
                {["lead_generation", "paid_product", "webinar"].includes(form.funnel_goal) && <Field label="Product, download, course, or Zoom delivery link" value={form.delivery_url} onChange={(value) => update("delivery_url", value)} placeholder="https://..." optional />}
                <Field label="Anything else AI should know?" value={form.custom_context} onChange={(value) => update("custom_context", value)} area optional />
              </div>
            </section>

            <aside className="space-y-5">
              <section className="bg-[#111] text-white rounded-3xl p-6">
                <div className="flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /><h2 className="font-display font-black text-xl">Ready to build</h2></div>
                <div className="space-y-3 mt-5">
                  {readiness.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-white/65">{item.label}</span>
                      {item.ready ? <span className="inline-flex items-center gap-1 text-sm text-emerald-400"><Check className="w-3.5 h-3.5" />Ready</span> :
                        <Link to={item.action} className="text-sm text-primary font-bold">Connect</Link>}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/40 mt-5">You can generate before connecting checkout or delivery, but publishing will require the links appropriate for the funnel type.</p>
              </section>

              <Button onClick={generate} disabled={!canGenerate || generating} className="w-full h-auto py-5 accent-gradient text-white text-base font-black rounded-2xl">
                {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Building your pages...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate My Funnel <ArrowRight className="w-5 h-5 ml-2" /></>}
              </Button>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-3"><Rocket className="w-5 h-5 text-primary mt-0.5" /><div><p className="font-black">What happens next?</p><p className="text-sm text-muted-foreground mt-1">AI creates the pages, then opens the native editor so you can preview, edit, connect, save, and publish.</p></div></div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}

function Field({ label, value, onChange, area, placeholder = "", optional }) {
  const Control = area ? Textarea : Input;
  return (
    <div>
      <label className="text-sm font-bold">{label}{optional && <span className="font-normal text-muted-foreground"> (optional)</span>}</label>
      <Control value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 bg-card" rows={area ? 3 : undefined} />
    </div>
  );
}