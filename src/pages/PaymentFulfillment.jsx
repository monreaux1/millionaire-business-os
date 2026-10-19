import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileDown,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
  Video,
  WalletCards,
} from "lucide-react";

const PAYMENT_OPTIONS = [
  {
    value: "external_payment_link",
    title: "Payment Link",
    description: "Use a checkout link from Stripe, PayPal, Square, GHL, or another provider.",
    badge: "Works now",
  },
  {
    value: "stripe_connect",
    title: "Stripe Connect",
    description: "Each app user connects their own Stripe account. Secure connection is the next phase.",
    badge: "Connection required",
  },
  {
    value: "gohighlevel",
    title: "GoHighLevel Checkout",
    description: "Send buyers to an existing GHL order form or checkout link.",
    badge: "Link required",
  },
  {
    value: "none",
    title: "No Payment",
    description: "Use this for free offers, lead magnets, applications, and booking funnels.",
    badge: "Free offer",
  },
];

const FULFILLMENT_OPTIONS = [
  { value: "download", title: "Digital Download", description: "PDF, ebook, guide, template, or downloadable product.", icon: FileDown },
  { value: "booking", title: "Booking Calendar", description: "Consultation, service appointment, or strategy session.", icon: CalendarDays },
  { value: "course", title: "Course Access", description: "Send buyers to a course or membership portal.", icon: GraduationCap },
  { value: "zoom", title: "Zoom or Meeting", description: "Deliver a live class, event, workshop, or private call.", icon: Video },
  { value: "instructions", title: "Instructions", description: "Show clear next steps without using an external delivery link.", icon: CheckCircle2 },
  { value: "manual", title: "Manual Delivery", description: "Review each order and personally send access.", icon: ShieldCheck },
];

const validHttpUrl = (value) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export default function PaymentFulfillment() {
  const { user } = useAuth();
  const [recordId, setRecordId] = useState("");
  const [form, setForm] = useState({
    payment_provider: "none",
    checkout_url: "",
    currency: "USD",
    fulfillment_type: "manual",
    delivery_url: "",
    delivery_instructions: "",
    support_email: user?.email || "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const records = await base44.entities.CommerceSettings.filter(
        { created_by: user.email },
        "-updated_date",
        1
      );
      const settings = records?.[0];
      if (settings) {
          setRecordId(settings.id);
          setForm({
            payment_provider: settings.payment_provider || "none",
            checkout_url: settings.checkout_url || "",
            currency: settings.currency || "USD",
            fulfillment_type: settings.fulfillment_type || "manual",
            delivery_url: settings.delivery_url || "",
            delivery_instructions: settings.delivery_instructions || "",
            support_email: settings.support_email || user.email,
          });
        }
    } catch (error) {
      console.error("Commerce settings could not be loaded", error);
      setMessage("Your settings could not be loaded. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, [user?.email]);

  const readiness = useMemo(() => {
    const provider = form.payment_provider;
    const checkoutRequired = provider === "external_payment_link" || provider === "gohighlevel";
    const checkoutReady = !checkoutRequired || validHttpUrl(form.checkout_url);
    const deliveryLinkRequired = ["download", "booking", "course", "zoom"].includes(form.fulfillment_type);
    const deliveryReady = !deliveryLinkRequired || validHttpUrl(form.delivery_url);
    const instructionsReady = form.fulfillment_type !== "instructions" || Boolean(form.delivery_instructions.trim());
    const stripePending = provider === "stripe_connect";

    return {
      checkoutReady,
      deliveryReady,
      instructionsReady,
      stripePending,
      ready: checkoutReady && deliveryReady && instructionsReady && !stripePending,
    };
  }, [form]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const saveSettings = async () => {
    setMessage("");
    if (!readiness.checkoutReady) {
      setMessage("Enter a complete checkout link beginning with https://.");
      return;
    }
    if (!readiness.deliveryReady) {
      setMessage("Enter a complete delivery or booking link beginning with https://.");
      return;
    }
    if (!readiness.instructionsReady) {
      setMessage("Add the instructions customers should receive.");
      return;
    }

    setSaving(true);
    const connectionStatus = form.payment_provider === "stripe_connect"
      ? "connection_required"
      : readiness.ready ? "ready" : "draft";
    const payload = {
      ...form,
      checkout_url: form.payment_provider === "none" ? "" : form.checkout_url.trim(),
      delivery_url: form.delivery_url.trim(),
      delivery_instructions: form.delivery_instructions.trim(),
      support_email: form.support_email.trim(),
      connection_status: connectionStatus,
      payment_verification_enabled: false,
      automatic_fulfillment_enabled: false,
      settings_version: 1,
      last_validated_at: new Date().toISOString(),
    };

    try {
      const result = recordId
        ? await base44.entities.CommerceSettings.update(recordId, payload)
        : await base44.entities.CommerceSettings.create(payload);
      setRecordId(result.id);
      setMessage(form.payment_provider === "stripe_connect"
        ? "Settings saved. Stripe still needs to be securely connected."
        : "Payment and delivery settings saved to your account.");
    } catch (error) {
      console.error("Commerce settings could not be saved", error);
      setMessage("Your settings could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AppLayout><div className="min-h-screen bg-background grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;
  }

  const selectedPayment = PAYMENT_OPTIONS.find((option) => option.value === form.payment_provider);
  const selectedFulfillment = FULFILLMENT_OPTIONS.find((option) => option.value === form.fulfillment_type);

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadSettings}>
      <div className="min-h-screen bg-background p-5 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-black tracking-[0.2em] uppercase text-primary">Account Commerce</p>
              <h1 className="font-display text-3xl md:text-5xl font-black mt-2">Payments and delivery</h1>
              <p className="text-muted-foreground mt-3 max-w-2xl">Choose how your customers pay and what they receive next. These settings belong only to your logged in account.</p>
            </div>
            <Link to="/FunnelCreator"><Button variant="outline">Open Funnel Creator <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
          </div>

          <div className="mt-7 bg-[#111111] text-white rounded-3xl p-6 md:p-7 flex flex-col md:flex-row gap-5 md:items-center">
            <div className="w-12 h-12 rounded-2xl bg-primary grid place-items-center shrink-0"><LockKeyhole className="w-6 h-6" /></div>
            <div className="flex-1">
              <h2 className="font-display font-extrabold text-xl">Private account settings</h2>
              <p className="text-white/55 text-sm mt-1">Checkout and delivery information is protected by owner only security. Paid delivery links are not shown on public funnels before payment verification.</p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-black text-emerald-300 bg-emerald-400/10 border border-emerald-300/20 rounded-full px-4 py-2"><ShieldCheck className="w-4 h-4" /> Account protected</span>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 mt-6">
            <main className="space-y-6">
              <section className="bg-card border border-border rounded-3xl p-5 md:p-7 shadow-[0_16px_45px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-9 h-9 rounded-xl bg-primary text-white grid place-items-center font-black">1</span>
                  <div><h2 className="font-display font-extrabold text-xl">Choose payment method</h2><p className="text-sm text-muted-foreground">Select the option this account will use by default.</p></div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {PAYMENT_OPTIONS.filter((option) => option.value !== "stripe_connect" || form.payment_provider === "stripe_connect").map((option) => {
                    const selected = form.payment_provider === option.value;
                    return (
                      <button key={option.value} type="button" onClick={() => setField("payment_provider", option.value)}
                        className={"text-left border rounded-2xl p-5 transition-all " + (selected ? "border-primary bg-primary/[0.06] ring-1 ring-primary" : "border-border hover:border-foreground/25")}>
                        <div className="flex justify-between gap-3">
                          <WalletCards className={"w-5 h-5 " + (selected ? "text-primary" : "text-muted-foreground")} />
                          {selected && <Check className="w-5 h-5 text-primary" />}
                        </div>
                        <p className="font-extrabold mt-4">{option.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{option.description}</p>
                        <span className="inline-block mt-4 text-sm font-black tracking-wide uppercase text-primary">{option.badge}</span>
                      </button>
                    );
                  })}
                </div>

                {(form.payment_provider === "external_payment_link" || form.payment_provider === "gohighlevel") && (
                  <div className="mt-6 border-t border-border pt-6">
                    <label className="text-sm font-bold">Checkout URL</label>
                    <div className="relative mt-2">
                      <ExternalLink className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input value={form.checkout_url} onChange={(event) => setField("checkout_url", event.target.value)} placeholder="https://your-secure-checkout-link.com" className="pl-9" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">The funnel will send the buyer to this secure checkout page.</p>
                  </div>
                )}

                {form.payment_provider === "stripe_connect" && (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="font-extrabold text-amber-900">Stripe is not connected yet</p>
                    <p className="text-sm text-amber-800 mt-1">This saves Stripe as your preferred provider. The secure connection button and payment verification will be added in the next phase.</p>
                  </div>
                )}
              </section>

              <section className="bg-card border border-border rounded-3xl p-5 md:p-7 shadow-[0_16px_45px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-9 h-9 rounded-xl bg-primary text-white grid place-items-center font-black">2</span>
                  <div><h2 className="font-display font-extrabold text-xl">Choose fulfillment</h2><p className="text-sm text-muted-foreground">Decide what customers receive after the correct next step.</p></div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {FULFILLMENT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = form.fulfillment_type === option.value;
                    return (
                      <button key={option.value} type="button" onClick={() => setField("fulfillment_type", option.value)}
                        className={"text-left border rounded-2xl p-5 transition-all " + (selected ? "border-primary bg-primary/[0.06] ring-1 ring-primary" : "border-border hover:border-foreground/25")}>
                        <div className="flex justify-between gap-3"><Icon className={"w-5 h-5 " + (selected ? "text-primary" : "text-muted-foreground")} />{selected && <Check className="w-5 h-5 text-primary" />}</div>
                        <p className="font-extrabold mt-4">{option.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{option.description}</p>
                      </button>
                    );
                  })}
                </div>

                {["download", "booking", "course", "zoom"].includes(form.fulfillment_type) && (
                  <div className="mt-6 border-t border-border pt-6">
                    <label className="text-sm font-bold">{form.fulfillment_type === "booking" ? "Booking link" : form.fulfillment_type === "zoom" ? "Zoom or meeting link" : "Delivery link"}</label>
                    <Input value={form.delivery_url} onChange={(event) => setField("delivery_url", event.target.value)} placeholder="https://..." className="mt-2" />
                    <p className="text-sm text-muted-foreground mt-2">For paid offers, this remains private until payment verification is active.</p>
                  </div>
                )}

                <div className="mt-6">
                  <label className="text-sm font-bold">Customer instructions</label>
                  <Textarea value={form.delivery_instructions} onChange={(event) => setField("delivery_instructions", event.target.value)} placeholder="Tell customers what happens next, when they will receive access, and how to get support." rows={5} className="mt-2 resize-none" />
                </div>
              </section>

              <section className="bg-card border border-border rounded-3xl p-5 md:p-7">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-9 h-9 rounded-xl bg-primary text-white grid place-items-center font-black">3</span>
                  <div><h2 className="font-display font-extrabold text-xl">Business details</h2><p className="text-sm text-muted-foreground">Set support information and currency.</p></div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="text-sm font-bold">Support email</label><Input type="email" value={form.support_email} onChange={(event) => setField("support_email", event.target.value)} placeholder="support@yourbusiness.com" className="mt-2" /></div>
                  <div><label className="text-sm font-bold">Currency</label>
                    <Select value={form.currency} onValueChange={(v) => setField("currency", v)}>
                      <SelectTrigger className="w-full mt-2 h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            </main>

            <aside className="space-y-5 lg:sticky lg:top-6 self-start">
              <div className="bg-[#111111] text-white rounded-3xl p-6">
                <p className="text-sm tracking-[0.18em] uppercase font-black text-primary">Setup Summary</p>
                <h2 className="font-display font-extrabold text-2xl mt-2">{readiness.ready ? "Ready to use" : readiness.stripePending ? "Connection needed" : "Needs attention"}</h2>
                <div className="space-y-4 mt-6">
                  <SummaryRow label="Payment" value={selectedPayment?.title} complete={readiness.checkoutReady && !readiness.stripePending} />
                  <SummaryRow label="Fulfillment" value={selectedFulfillment?.title} complete={readiness.deliveryReady && readiness.instructionsReady} />
                  <SummaryRow label="Payment verification" value="Not active yet" complete={false} />
                  <SummaryRow label="Automatic delivery" value="Locked until verification" complete={false} />
                </div>
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-sm text-white/45 leading-relaxed">External checkout links work now. Automatic paid delivery stays locked until Stripe or another provider confirms payment.</p>
                </div>
              </div>

              {message && <div className={"rounded-2xl border p-4 text-sm font-semibold " + (message.includes("saved") ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800")}>{message}</div>}

              <Button onClick={saveSettings} disabled={saving} className="w-full h-12 bg-black text-white hover:bg-black/85">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Account Settings
              </Button>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex gap-3"><CircleDollarSign className="w-5 h-5 text-primary shrink-0" /><div><p className="font-extrabold text-sm">Next connection phase</p><p className="text-sm text-muted-foreground mt-1">Stripe Connect, payment status, order records, and verified fulfillment.</p></div></div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}

function SummaryRow({ label, value, complete }) {
  return <div className="flex items-start gap-3"><span className={"w-6 h-6 rounded-full grid place-items-center shrink-0 " + (complete ? "bg-emerald-400/15 text-emerald-300" : "bg-card/10 text-white/35")}>{complete ? <Check className="w-3.5 h-3.5" /> : <span className="text-sm font-black">!</span>}</span><div><p className="text-sm uppercase tracking-wider font-black text-white/35">{label}</p><p className="text-sm font-bold mt-0.5">{value}</p></div></div>;
}