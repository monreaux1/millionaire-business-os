import React, { useEffect, useState } from "react";
import { Check, Loader2, Lock, LogOut } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { getBillingStatus, startCheckout, confirmCheckout, openBillingPortal } from "@/lib/billing";

const PLAN_NAMES = { founding: "Founding Member", pro_monthly: "Pro", pro_yearly: "Pro Annual", coaching: "Pro + Coaching" };
const errorText = (e, fallback) => e?.data?.error || e?.message || fallback;
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "");

function PlanCards({ plans, busyPlan, onChoose }) {
  if (!plans.length) {
    return <p className="text-muted-foreground text-sm">Plans aren't set up yet. Please check back soon.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {plans.map((plan) => (
        <div key={plan.key} className={`light-card rounded-2xl border p-6 flex flex-col ${plan.key === "founding" && plan.available ? "border-primary" : "border-border"}`}>
          {plan.key === "founding" && (
            <span className="self-start text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
              {plan.available ? "Limited · first 50" : "Sold out"}
            </span>
          )}
          <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
          <p className="mt-2">
            <span className="text-3xl font-black text-foreground">{plan.price}</span>
            <span className="text-muted-foreground text-sm"> / {plan.interval}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-3 flex-1">{plan.blurb}</p>
          <Button
            className="mt-5 w-full accent-gradient text-white font-bold"
            disabled={!plan.available || Boolean(busyPlan)}
            onClick={() => onChoose(plan.key)}
          >
            {busyPlan === plan.key && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {plan.available ? `Choose ${plan.name}` : "Sold out"}
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function Billing({ locked = false, onActivated }) {
  const { logout } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState("");
  const [portalBusy, setPortalBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      try {
        if (params.get("status") === "success" && params.get("session_id")) {
          setMessage("Confirming your payment…");
          const result = await confirmCheckout(params.get("session_id"));
          window.history.replaceState({}, "", "/billing");
          if (result.active) {
            setMessage("You're in! Your plan is active.");
            if (onActivated) { onActivated(); return; }
          } else {
            setMessage("Payment received. Your access will switch on within a minute — refresh if needed.");
          }
        } else if (params.get("status") === "canceled") {
          setMessage("Checkout canceled. No charge was made.");
          window.history.replaceState({}, "", "/billing");
        }
        const next = await getBillingStatus();
        if (!cancelled) setStatus(next);
      } catch (e) {
        if (!cancelled) setError(errorText(e, "Couldn't load your plan. Refresh to try again."));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [onActivated]);

  async function choose(planKey) {
    setBusyPlan(planKey);
    setError("");
    try {
      const { url } = await startCheckout(planKey);
      window.location.assign(url);
      return;
    } catch (e) {
      setError(errorText(e, "Couldn't start checkout. Please try again."));
    }
    setBusyPlan("");
  }

  async function manage() {
    setPortalBusy(true);
    setError("");
    try {
      const { url } = await openBillingPortal();
      window.location.assign(url);
      return;
    } catch (e) {
      setError(errorText(e, "Couldn't open billing. Please try again."));
    }
    setPortalBusy(false);
  }

  const sub = status?.subscription;
  const content = (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        {locked && (
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
            <Lock className="w-4 h-4" /> Choose a plan to unlock the app
          </div>
        )}
        <h1 className="text-3xl font-display font-bold text-foreground">
          {locked ? "Pick your plan" : "My plan & billing"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Build your offer, money model, funnels and launch plan in one place. Cancel anytime.
        </p>
      </div>

      {message && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">{message}</p>}
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg p-3">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : status && !status.enabled ? (
        <p className="text-sm text-muted-foreground">Billing isn't switched on yet, so the full app is open to every account.</p>
      ) : status?.active ? (
        <div className="light-card rounded-2xl border border-border p-6 space-y-3">
          <p className="flex items-center gap-2 font-bold text-foreground">
            <Check className="w-5 h-5 text-emerald-600" />
            {status.admin && !sub ? "Admin access" : `${PLAN_NAMES[sub?.plan] || "Active plan"} — ${sub?.status === "past_due" ? "payment past due" : "active"}`}
          </p>
          {sub?.current_period_end && (
            <p className="text-sm text-muted-foreground">
              {sub.cancel_at_period_end ? "Access ends on " : "Renews on "}{formatDate(sub.current_period_end)}.
            </p>
          )}
          {sub?.status === "past_due" && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">Your last payment didn't go through. Update your card to keep access.</p>
          )}
          {sub?.has_customer && (
            <Button variant="outline" onClick={manage} disabled={portalBusy}>
              {portalBusy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Manage billing (card, plan, cancel)
            </Button>
          )}
        </div>
      ) : (
        <PlanCards plans={status?.plans || []} busyPlan={busyPlan} onChoose={choose} />
      )}

      {locked && (
        <button type="button" onClick={() => logout(true)} className="text-sm text-muted-foreground underline inline-flex items-center gap-1">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      )}
    </div>
  );

  return locked ? <div className="min-h-screen bg-background">{content}</div> : <AppLayout>{content}</AppLayout>;
}
