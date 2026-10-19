import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { accountStorage } from "@/lib/account-storage";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import PullToRefresh from "@/components/PullToRefresh";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Globe2,
  Layout,
  Loader2,
  Monitor,
  PartyPopper,
  Save,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

const PAGE_CONFIG = [
  {
    key: "landing_page",
    label: "Landing Page",
    icon: Layout,
    fields: [
      ["headline", "Headline"],
      ["subhead", "Subheadline"],
      ["pain_points", "Pain points", "list"],
      ["benefit_bullets", "Benefit bullets", "list"],
      ["offer_stack", "Offer stack", "list"],
      ["social_proof", "Social proof"],
      ["guarantee", "Guarantee"],
      ["urgency_block", "Urgency"],
      ["cta_text", "Button text"],
    ],
  },
  {
    key: "order_page",
    label: "Order Page",
    icon: ShoppingCart,
    fields: [
      ["headline", "Headline"],
      ["order_summary", "Order summary"],
      ["price_display", "Price"],
      ["payment_options", "Payment options"],
      ["guarantee_block", "Guarantee"],
      ["cta_text", "Button text"],
    ],
  },
  {
    key: "upsell_page",
    label: "Upsell Page",
    icon: TrendingUp,
    fields: [
      ["headline", "Headline"],
      ["offer", "Upsell offer"],
      ["price", "Price"],
      ["reason_why", "Reason why"],
      ["cta_text", "Button text"],
    ],
  },
  {
    key: "thank_you_page",
    label: "Thank You Page",
    icon: PartyPopper,
    fields: [
      ["headline", "Headline"],
      ["next_steps", "Next steps", "list"],
      ["onboarding_instructions", "Onboarding instructions"],
      ["community_link", "Community or access link"],
    ],
  },
];

const DEFAULT_CONNECTIONS = {
  landing_page: { action: "lead_capture", destination: "order_page", url: "" },
  order_page: { action: "checkout", destination: "upsell_page", url: "" },
  upsell_page: { action: "next_page", destination: "thank_you_page", url: "" },
  thank_you_page: { action: "fulfillment", destination: "external", url: "" },
};

const parseLocal = (key) => {
  try {
    return JSON.parse(accountStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

export default function FunnelCreator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const generated = useMemo(() => parseLocal("generatedFunnel"), []);
  const draft = useMemo(() => parseLocal("funnelFormDraft") || {}, []);
  const saved = useMemo(() => parseLocal("funnelCreatorState"), []);
  const [funnel, setFunnel] = useState(saved?.funnel || generated);
  const [activePage, setActivePage] = useState(saved?.activePage || "landing_page");
  const [device, setDevice] = useState("desktop");
  const [connections, setConnections] = useState(saved?.connections || DEFAULT_CONNECTIONS);
  const [leadDestination, setLeadDestination] = useState(saved?.leadDestination || {
    type: "app",
    notification_email: "",
    webhook_url: "",
    ghl_workflow: "",
  });
  const [payment, setPayment] = useState(saved?.payment || {
    type: "payment_link",
    checkout_url: "",
  });
  const [fulfillment, setFulfillment] = useState(saved?.fulfillment || {
    type: "download",
    delivery_url: "",
    instructions: "",
  });
  const [projectId, setProjectId] = useState(saved?.projectId || "");
  const [slug, setSlug] = useState(saved?.slug || "");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const availablePages = PAGE_CONFIG.filter((page) => funnel?.[page.key]);
  const pageConfig = availablePages.find((page) => page.key === activePage) || availablePages[0];
  const page = pageConfig ? funnel?.[pageConfig.key] : null;
  const brand = funnel?.brand_system || {};
  const primary = brand.primary_color || "#ff5a1f";
  const secondary = brand.secondary_color || "#111111";

  useEffect(() => {
    if (!pageConfig && availablePages[0]) setActivePage(availablePages[0].key);
  }, [pageConfig, availablePages]);

  const loadCommerceDefaults = async () => {
    if (saved?.payment || saved?.fulfillment) return;

    try {
      if (!user?.email) return;
        const records = await base44.entities.CommerceSettings.filter(
          { created_by: user.email },
          "-updated_date",
          1
        );
        const settings = records?.[0];
        if (!settings) return;

        const paymentType = {
          external_payment_link: "payment_link",
          stripe_connect: "stripe",
          gohighlevel: "ghl",
          none: "none",
        }[settings.payment_provider] || "none";

        setPayment({
          type: paymentType,
          checkout_url: settings.checkout_url || "",
        });
        setFulfillment({
          type: settings.fulfillment_type || "manual",
          delivery_url: settings.delivery_url || "",
          instructions: settings.delivery_instructions || "",
        });
        setConnections((current) => ({
          ...current,
          order_page: {
            ...(current.order_page || DEFAULT_CONNECTIONS.order_page),
            action: settings.payment_provider === "none" ? "next_page" : (current.order_page?.action || "checkout"),
            url: current.order_page?.url || settings.checkout_url || "",
          },
          thank_you_page: {
            ...(current.thank_you_page || DEFAULT_CONNECTIONS.thank_you_page),
            url: current.thank_you_page?.url || settings.delivery_url || "",
          },
        }));
    } catch (error) {
      console.warn("Account payment defaults unavailable", error);
    }
  };

  useEffect(() => { loadCommerceDefaults(); }, [saved]);

  const pendingStateRef = useRef(null);

  useEffect(() => {
    if (!funnel) return;
    const payload = {
      funnel,
      activePage,
      connections,
      leadDestination,
      payment,
      fulfillment,
      projectId,
      slug,
    };
    pendingStateRef.current = payload;
    // Debounced persistence: avoids stringifying the whole funnel on every keystroke
    const timer = setTimeout(() => {
      pendingStateRef.current = null;
      accountStorage.setItem("funnelCreatorState", JSON.stringify(payload));
      accountStorage.setItem("generatedFunnel", JSON.stringify(payload.funnel));
    }, 400);
    return () => clearTimeout(timer);
  }, [funnel, activePage, connections, leadDestination, payment, fulfillment, projectId, slug]);

  // Flush any pending draft state when the page unmounts
  useEffect(() => () => {
    if (pendingStateRef.current) {
      accountStorage.setItem("funnelCreatorState", JSON.stringify(pendingStateRef.current));
    }
  }, []);

  const updatePage = (field, value, type) => {
    const finalValue = type === "list"
      ? value.split("\n").map((item) => item.trim()).filter(Boolean)
      : value;
    setFunnel((current) => ({
      ...current,
      [activePage]: {
        ...current[activePage],
        [field]: finalValue,
      },
    }));
  };

  const updateConnection = (field, value) => {
    setConnections((current) => ({
      ...current,
      [activePage]: {
        ...(current[activePage] || {}),
        [field]: value,
      },
    }));
  };

  const projectPayload = (status = slug ? "published" : "draft", nextSlug = slug) => ({
    business_id: draft.business_id || "",
    money_model_id: draft.money_model_id || "",
    name: funnel.funnel_name || draft.business_name || "Untitled Funnel",
    status,
    funnel_data: funnel,
    page_connections: connections,
    lead_destination: leadDestination,
    payment_settings: payment,
    fulfillment_settings: fulfillment,
    slug: nextSlug,
    published_at: status === "published" ? new Date().toISOString() : undefined,
    project_version: 1,
  });

  const persistProject = async (payload) => {
    if (projectId) {
      if (!user?.email) throw new Error("An authenticated account is required.");
      const ownedProjects = await base44.entities.FunnelProject.filter(
        { id: projectId, created_by: user.email },
        "-updated_date",
        1
      );
      if (!ownedProjects?.[0]) {
        throw new Error("This funnel project does not belong to the current account.");
      }
    }

    const result = projectId
      ? await base44.entities.FunnelProject.update(projectId, payload)
      : await base44.entities.FunnelProject.create(payload);
    setProjectId(result.id);
    return result;
  };

  const saveProject = async () => {
    if (!funnel || saving || publishing) return;
    // Optimistic save: reflect success immediately, roll back with an error toast on failure
    const previousMessage = savedMessage;
    setSavedMessage(slug ? "Published funnel updated." : "Funnel project saved.");
    setSaving(true);
    try {
      await persistProject(projectPayload());
    } catch (error) {
      console.error(error);
      setSavedMessage(previousMessage);
      toast({
        title: "Save failed",
        description: "The funnel could not be saved. Your browser draft is still safe.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const publishProject = async () => {
    if (!funnel) return;
    const checkoutNeeded = Object.values(connections).some((item) => item?.action === "checkout");
    const hasCheckout = Boolean(payment.checkout_url || Object.values(connections).some((item) => item?.action === "checkout" && item?.url));
    if (checkoutNeeded && !hasCheckout) {
      setSavedMessage("Add a checkout URL before publishing a paid funnel.");
      return;
    }

    const funnelGoal = funnel.funnel_goal || draft.funnel_goal || "lead_generation";
    const deliveryUrl = fulfillment.delivery_url || connections.thank_you_page?.url || "";
    if (funnelGoal === "booking" && !deliveryUrl) {
      setSavedMessage("Add your booking calendar URL before publishing this funnel.");
      return;
    }
    if (["lead_generation", "webinar"].includes(funnelGoal) && !deliveryUrl) {
      setSavedMessage(funnelGoal === "webinar"
        ? "Add the webinar or Zoom access URL before publishing."
        : "Add the freebie delivery URL before publishing.");
      return;
    }

    setPublishing(true);
    setSavedMessage("");
    const baseSlug = (funnel.funnel_name || draft.business_name || "funnel")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 58) || "funnel";
    const nextSlug = slug || `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      await persistProject(projectPayload("published", nextSlug));
      setSlug(nextSlug);
      setSavedMessage("Your funnel is live and ready to share.");
    } catch (error) {
      console.error(error);
      setSavedMessage("Publishing failed. Your saved draft is still safe.");
    } finally {
      setPublishing(false);
    }
  };

  const publicUrl = slug ? `${window.location.origin}/f/${slug}` : "";

  if (!funnel || availablePages.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background grid place-items-center p-6">
          <div className="max-w-xl text-center bg-card border border-border rounded-3xl p-8 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
            <Layout className="w-10 h-10 text-primary mx-auto mb-4" />
            <h1 className="font-display text-3xl font-black">Generate your funnel first</h1>
            <p className="text-muted-foreground mt-3 mb-6">The Funnel Creator turns a generated full funnel into editable, connected pages.</p>
            <Link to="/FunnelBuilder"><Button className="accent-gradient text-white">Open Funnel Builder</Button></Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadCommerceDefaults}>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card px-5 md:px-8 py-4 sticky top-[calc(env(safe-area-inset-top)+56px)] md:top-0 z-20">
          <div className="max-w-[1500px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/FunnelBuilder" aria-label="Back to Funnel Builder" className="w-11 h-11 rounded-full border border-border grid place-items-center text-muted-foreground hover:text-primary"><ArrowLeft className="w-5 h-5" /></Link>
              <div>
                <p className="text-sm font-black tracking-[0.18em] uppercase text-primary">Funnel Creator</p>
                <h1 className="font-display font-extrabold text-lg">{funnel.funnel_name || "Untitled Funnel"}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {savedMessage && <span className="hidden md:inline text-sm font-semibold text-muted-foreground">{savedMessage}</span>}
              <Button variant="outline" onClick={saveProject} disabled={saving || publishing}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={publishProject} disabled={saving || publishing} className="bg-black text-white hover:bg-black/85">
                {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe2 className="w-4 h-4 mr-2" />}
                {slug ? "Update Live" : "Publish Live"}
              </Button>
              <Link to="/Leads"><Button variant="outline">Leads <Users className="w-4 h-4 ml-2" /></Button></Link>
            </div>
          </div>
        </div>

        <div className="max-w-[1500px] mx-auto p-4 md:p-6">
          {publicUrl && (
            <div className="mb-5 bg-foreground text-background rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm tracking-[0.18em] uppercase font-black text-primary">Published Funnel</p>
                <p className="text-sm text-background/65 mt-1 break-all">{publicUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-background/20 bg-background/5 text-background hover:bg-background/10 hover:text-background" onClick={() => navigator.clipboard.writeText(publicUrl)}><Copy className="w-4 h-4 mr-2" />Copy Link</Button>
                <a href={publicUrl} target="_blank" rel="noreferrer"><Button className="bg-background text-foreground hover:bg-background/90">Open Live <ExternalLink className="w-4 h-4 ml-2" /></Button></a>
              </div>
            </div>
          )}
          <div className="grid xl:grid-cols-[290px_minmax(0,1fr)_330px] gap-5">
            <aside className="space-y-4">
              <div className="bg-foreground text-background rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-background/10">
                  <p className="text-sm tracking-[0.18em] uppercase font-black text-primary">Funnel Pages</p>
                  <p className="text-sm text-background/45 mt-1">Select a page to edit and connect.</p>
                </div>
                {availablePages.map(({ key, label, icon: Icon }, index) => (
                  <button key={key} onClick={() => setActivePage(key)}
                    className={"w-full flex items-center gap-3 p-4 border-b border-background/10 text-left transition-colors " + (activePage === key ? "bg-background/[0.08]" : "hover:bg-background/[0.04]")}>
                    <span className={"w-8 h-8 rounded-full grid place-items-center text-sm font-black " + (activePage === key ? "bg-primary text-white" : "bg-background/10 text-background/55")}>{index + 1}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{label}</p>
                      <p className="text-sm text-background/35">{connections[key]?.action?.replaceAll("_", " ")}</p>
                    </div>
                    <Icon className="w-4 h-4 text-primary" />
                  </button>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-sm tracking-[0.18em] uppercase font-black text-primary mb-4">Page Connection</p>
                <label className="text-sm font-bold text-foreground">Button action</label>
                <Select value={connections[activePage]?.action || "next_page"} onValueChange={(v) => updateConnection("action", v)}>
                  <SelectTrigger className="w-full mt-2 border border-border rounded-xl h-11 px-3 text-sm bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_capture">Capture lead</SelectItem>
                    <SelectItem value="checkout">Open checkout</SelectItem>
                    <SelectItem value="next_page">Go to next page</SelectItem>
                    <SelectItem value="booking">Open booking calendar</SelectItem>
                    <SelectItem value="fulfillment">Deliver product</SelectItem>
                    <SelectItem value="external">External link</SelectItem>
                  </SelectContent>
                </Select>
                <label className="text-sm font-bold text-foreground block mt-4">Destination</label>
                <Select value={connections[activePage]?.destination || "external"} onValueChange={(v) => updateConnection("destination", v)}>
                  <SelectTrigger className="w-full mt-2 border border-border rounded-xl h-11 px-3 text-sm bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePages.filter((item) => item.key !== activePage).map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}
                    <SelectItem value="external">External URL</SelectItem>
                  </SelectContent>
                </Select>
                <label className="text-sm font-bold text-foreground block mt-4">External URL or checkout link</label>
                <Input value={connections[activePage]?.url || ""} onChange={(event) => updateConnection("url", event.target.value)} placeholder="https://..." className="mt-2" />
              </div>
            </aside>

            <main className="min-w-0">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-bold text-muted-foreground">LIVE PREVIEW</p>
                  <h2 className="font-display font-extrabold">{pageConfig?.label}</h2>
                </div>
                <div className="inline-flex rounded-xl border border-border bg-card p-1">
                  <button onClick={() => setDevice("desktop")} aria-label="Desktop preview" className={"min-h-[44px] min-w-[44px] px-4 rounded-lg grid place-items-center " + (device === "desktop" ? "bg-foreground text-background" : "text-foreground/45")}><Monitor className="w-4 h-4" /></button>
                  <button onClick={() => setDevice("mobile")} aria-label="Mobile preview" className={"min-h-[44px] min-w-[44px] px-4 rounded-lg grid place-items-center " + (device === "mobile" ? "bg-foreground text-background" : "text-foreground/45")}><Smartphone className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-3 md:p-6 min-h-[720px]">
                <div className={"bg-white min-h-[660px] mx-auto shadow-[0_18px_50px_rgba(0,0,0,0.12)] transition-all overflow-hidden " + (device === "mobile" ? "max-w-[390px]" : "max-w-[980px]")}>
                  <PagePreview pageKey={activePage} page={page} brand={brand} connection={connections[activePage]} primary={primary} secondary={secondary} />
                </div>
              </div>
            </main>

            <aside className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 max-h-[720px] overflow-y-auto overscroll-y-none">
                <p className="text-sm tracking-[0.18em] uppercase font-black text-primary mb-5">Edit Page Content</p>
                <div className="space-y-4">
                  {pageConfig?.fields.map(([field, label, type]) => {
                    const value = type === "list" ? (page?.[field] || []).join("\n") : page?.[field] || "";
                    return (
                      <div key={field}>
                        <label className="text-sm font-bold text-foreground">{label}</label>
                        <Textarea value={value} onChange={(event) => updatePage(field, event.target.value, type)}
                          rows={type === "list" ? 4 : 3} className="mt-2 resize-none bg-card" />
                        {type === "list" && <p className="text-sm text-muted-foreground mt-1">One item per line</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-sm tracking-[0.18em] uppercase font-black text-primary">Launch Connections</p>
                  <Link to="/PaymentFulfillment" className="text-sm font-black text-muted-foreground hover:text-primary">Account defaults</Link>
                </div>
                <ConnectionField icon={Users} label="Lead destination" value={leadDestination.type} onChange={(value) => setLeadDestination((current) => ({ ...current, type: value }))} options={[["app", "Save in app"], ["ghl", "GoHighLevel"], ["email", "Email notification"], ["webhook", "Webhook"]]} />
                <Input value={leadDestination.notification_email} onChange={(event) => setLeadDestination((current) => ({ ...current, notification_email: event.target.value }))} placeholder="Lead notification email" className="mt-2" />
                <ConnectionField icon={WalletCards} label="Payment" value={payment.type} onChange={(value) => setPayment((current) => ({ ...current, type: value }))} options={[["payment_link", "Payment link"], ["stripe", "Stripe"], ["ghl", "GHL checkout"], ["none", "No payment"]]} />
                <Input value={payment.checkout_url} onChange={(event) => setPayment((current) => ({ ...current, checkout_url: event.target.value }))} placeholder="Checkout URL" className="mt-2" />
                <ConnectionField icon={ExternalLink} label="Fulfillment" value={fulfillment.type} onChange={(value) => setFulfillment((current) => ({ ...current, type: value }))} options={[["download", "File or product link"], ["booking", "Booking calendar"], ["course", "Course access"], ["zoom", "Zoom or meeting"], ["instructions", "Instructions"], ["manual", "Manual delivery"]]} />
                <Input value={fulfillment.delivery_url} onChange={(event) => setFulfillment((current) => ({ ...current, delivery_url: event.target.value }))} placeholder="Delivery URL" className="mt-2" />
              </div>
            </aside>
          </div>
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}

function ConnectionField({ icon: Icon, label, value, onChange, options }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="text-sm font-bold flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-primary" />{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full mt-2 border border-border rounded-xl h-11 px-3 text-sm bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function PagePreview({ pageKey, page, brand, connection, primary, secondary }) {
  const headingFont = brand.headline_font || "Plus Jakarta Sans";
  const bodyFont = brand.body_font || "Inter";
  const buttonText = page?.cta_text || (pageKey === "thank_you_page" ? "Continue" : "Get Started");
  const pageStyle = { fontFamily: bodyFont };

  if (pageKey === "landing_page") {
    return (
      <div style={pageStyle}>
        <section className="text-center px-6 py-16 md:px-12 md:py-24" style={{ background: brand.background_color || "#ffffff" }}>
          <p className="text-sm font-black tracking-[0.2em] uppercase mb-5" style={{ color: primary }}>{brand.brand_name || "Your Brand"}</p>
          <h1 className="text-4xl md:text-6xl font-black leading-[1.05] max-w-4xl mx-auto" style={{ color: secondary, fontFamily: headingFont }}>{page.headline}</h1>
          <p className="text-lg md:text-xl text-black/55 max-w-2xl mx-auto mt-6">{page.subhead}</p>
          <PreviewButton text={buttonText} primary={primary} />
        </section>
        {(page.benefit_bullets || []).length > 0 && <section className="px-6 md:px-12 py-12 bg-[#f7f6f3]"><h2 className="text-2xl font-black text-center mb-8" style={{ fontFamily: headingFont }}>What changes for you</h2><div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">{page.benefit_bullets.map((item, index) => <div key={index} className="bg-white p-5 border border-black/10"><Check className="w-5 h-5 mb-4" style={{ color: primary }} /><p className="font-semibold text-sm">{item}</p></div>)}</div></section>}
        <section className="px-6 py-12 text-center text-white" style={{ background: secondary }}>
          <h2 className="text-2xl font-black" style={{ fontFamily: headingFont }}>{page.headline}</h2>
          {connection?.action === "lead_capture" && <div className="max-w-md mx-auto mt-6 grid gap-3"><input disabled placeholder="First name" className="rounded-xl px-4 py-3 text-black" /><input disabled placeholder="Email address" className="rounded-xl px-4 py-3 text-black" /></div>}
          <PreviewButton text={buttonText} primary={primary} />
        </section>
      </div>
    );
  }

  if (pageKey === "order_page") {
    return <div className="px-6 py-16 md:px-14" style={pageStyle}><h1 className="text-4xl font-black text-center" style={{ color: secondary, fontFamily: headingFont }}>{page.headline}</h1><div className="max-w-xl mx-auto mt-10 border-2 rounded-2xl p-7" style={{ borderColor: primary }}><p className="text-lg text-black/65">{page.order_summary}</p><p className="text-4xl font-black text-center my-8" style={{ color: primary }}>{page.price_display}</p><p className="text-sm text-black/45 text-center">{page.payment_options}</p><PreviewButton text={buttonText} primary={primary} /></div></div>;
  }

  if (pageKey === "upsell_page") {
    return <div className="px-6 py-16 md:px-14 text-center" style={pageStyle}><span className="inline-block rounded-full px-4 py-2 text-sm font-black text-white" style={{ background: primary }}>ONE TIME UPGRADE</span><h1 className="text-4xl font-black mt-7" style={{ color: secondary, fontFamily: headingFont }}>{page.headline}</h1><p className="text-lg text-black/60 max-w-xl mx-auto mt-6">{page.offer}</p><p className="text-4xl font-black mt-8" style={{ color: primary }}>{page.price}</p><PreviewButton text={buttonText} primary={primary} /></div>;
  }

  return <div className="px-6 py-20 md:px-14 text-center" style={pageStyle}><PartyPopper className="w-14 h-14 mx-auto mb-6" style={{ color: primary }} /><h1 className="text-4xl font-black" style={{ color: secondary, fontFamily: headingFont }}>{page.headline}</h1><div className="max-w-xl mx-auto text-left mt-10 bg-[#f7f6f3] p-6 rounded-2xl">{(page.next_steps || []).map((step, index) => <div key={index} className="flex gap-3 mb-4 last:mb-0"><span className="w-7 h-7 rounded-full text-white grid place-items-center text-sm font-black" style={{ background: primary }}>{index + 1}</span><p className="text-sm font-semibold pt-1">{step}</p></div>)}</div>{page.onboarding_instructions && <p className="max-w-xl mx-auto mt-8 text-black/55">{page.onboarding_instructions}</p>}</div>;
}

function PreviewButton({ text, primary }) {
  return <button type="button" className="mt-8 rounded-xl px-8 py-4 text-white font-black shadow-lg" style={{ background: primary }}>{text}</button>;
}