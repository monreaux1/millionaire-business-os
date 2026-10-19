import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Check, Loader2, PartyPopper, ShieldCheck } from "lucide-react";

const PAGE_ORDER = ["landing_page", "order_page", "upsell_page", "thank_you_page"];
const getErrorMessage = (error) => error?.response?.data?.error || error?.message || "Something went wrong. Please try again.";

export default function PublicFunnel() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [lead, setLead] = useState({ first_name: "", last_name: "", email: "", phone: "", website: "" });

  const requestedPage = searchParams.get("page") || "landing_page";
  const pageKey = PAGE_ORDER.includes(requestedPage) ? requestedPage : "landing_page";
  const funnel = project?.funnel_data || {};
  const page = funnel?.[pageKey];
  const connection = project?.page_connections?.[pageKey] || {};
  const brand = funnel?.brand_system || {};
  const primary = brand.primary_color || "#ff5a1f";
  const secondary = brand.secondary_color || "#111111";
  const background = brand.background_color || "#ffffff";
  const headingFont = brand.headline_font || "Plus Jakarta Sans";
  const bodyFont = brand.body_font || "Inter";

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const response = await base44.functions.invoke("publicFunnel", { action: "get", slug });
        if (active) setProject(response.data?.project);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setFormError("");
    setNotice("");
  }, [pageKey]);

  const availablePages = useMemo(() => PAGE_ORDER.filter((key) => funnel?.[key]), [funnel]);

  const goToDestination = (currentConnection = connection) => {
    const action = currentConnection?.action || "next_page";
    const externalUrl = currentConnection?.url || (action === "checkout" ? project?.payment?.checkout_url : "");

    if (["checkout", "booking", "external", "fulfillment"].includes(action) && externalUrl) {
      window.location.assign(externalUrl);
      return;
    }

    if (action === "fulfillment" && !externalUrl) {
      setNotice("Your purchase is complete when the seller’s checkout confirms payment. Secure delivery is handled after payment verification.");
      return;
    }

    const destination = currentConnection?.destination;
    if (destination && availablePages.includes(destination)) {
      setSearchParams({ page: destination });
      return;
    }

    const currentIndex = availablePages.indexOf(pageKey);
    const nextPage = availablePages[currentIndex + 1];
    if (nextPage) setSearchParams({ page: nextPage });
  };

  const submitLead = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await base44.functions.invoke("publicFunnel", {
        action: "lead",
        slug,
        page: pageKey,
        referrer: document.referrer,
        lead,
      });
      goToDestination(connection);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-[#f5f3ef]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (loadError || !project || !page) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f5f3ef] px-6">
        <div className="max-w-lg text-center bg-white border border-black/10 rounded-3xl p-9 shadow-xl">
          <p className="text-sm font-black tracking-[0.2em] uppercase text-primary">Millionaire Business OS</p>
          <h1 className="text-3xl font-black mt-3">This funnel is not available</h1>
          <p className="text-black/55 mt-3">{loadError || "The link may have changed or the funnel is no longer published."}</p>
        </div>
      </div>
    );
  }

  const style = { fontFamily: bodyFont, background };
  const buttonText = page.cta_text || (pageKey === "thank_you_page" ? "Continue" : "Get Started");

  return (
    <div className="min-h-screen" style={style}>
      <header className="px-5 md:px-10 py-5 pt-[env(safe-area-inset-top)] border-b border-black/10 flex items-center justify-between" style={{ background }}>
        <div className="flex items-center gap-3">
          {brand.logo_url ? <img src={brand.logo_url} alt={brand.brand_name || project.name} className="h-9 w-auto max-w-[150px] object-contain" /> : <span className="w-9 h-9 rounded-xl grid place-items-center text-white font-black" style={{ background: primary }}>M</span>}
          <span className="font-black text-sm" style={{ color: secondary }}>{brand.brand_name || project.name}</span>
        </div>
        <span className="hidden sm:flex items-center gap-2 text-sm font-bold text-black/45"><ShieldCheck className="w-4 h-4" /> Secure experience</span>
      </header>

      {pageKey === "landing_page" && (
        <>
          <section className="text-center px-6 py-16 md:px-12 md:py-24" style={{ background }}>
            <p className="text-sm font-black tracking-[0.2em] uppercase mb-5" style={{ color: primary }}>{brand.brand_name || project.name}</p>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.05] max-w-4xl mx-auto" style={{ color: secondary, fontFamily: headingFont }}>{page.headline}</h1>
            <p className="text-lg md:text-xl text-black/55 max-w-2xl mx-auto mt-6">{page.subhead}</p>
          </section>
          {(page.benefit_bullets || []).length > 0 && (
            <section className="px-6 md:px-12 py-14 bg-[#f7f6f3]">
              <h2 className="text-2xl font-black text-center mb-8" style={{ fontFamily: headingFont }}>What changes for you</h2>
              <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {page.benefit_bullets.map((item, index) => <div key={index} className="bg-white p-6 border border-black/10 rounded-2xl"><Check className="w-5 h-5 mb-4" style={{ color: primary }} /><p className="font-semibold text-sm">{item}</p></div>)}
              </div>
            </section>
          )}
          <section className="px-6 py-14 text-center text-white" style={{ background: secondary }}>
            <h2 className="text-2xl md:text-3xl font-black" style={{ fontFamily: headingFont }}>{page.headline}</h2>
            {connection.action === "lead_capture" ? (
              <form onSubmit={submitLead} className="max-w-xl mx-auto mt-7 grid sm:grid-cols-2 gap-3 text-left">
                <label className="text-sm font-bold">First name<InputField required value={lead.first_name} onChange={(value) => setLead((current) => ({ ...current, first_name: value }))} placeholder="First name" /></label>
                <label className="text-sm font-bold">Last name<InputField value={lead.last_name} onChange={(value) => setLead((current) => ({ ...current, last_name: value }))} placeholder="Last name" /></label>
                <label className="text-sm font-bold sm:col-span-2">Email address<InputField required type="email" value={lead.email} onChange={(value) => setLead((current) => ({ ...current, email: value }))} placeholder="you@example.com" /></label>
                <label className="text-sm font-bold sm:col-span-2">Phone number <span className="font-normal text-white/45">optional</span><InputField type="tel" value={lead.phone} onChange={(value) => setLead((current) => ({ ...current, phone: value }))} placeholder="Phone number" /></label>
                <input tabIndex={-1} autoComplete="off" value={lead.website} onChange={(event) => setLead((current) => ({ ...current, website: event.target.value }))} className="hidden" aria-hidden="true" />
                {formError && <p className="sm:col-span-2 text-sm font-semibold text-red-300">{formError}</p>}
                <button disabled={submitting} className="sm:col-span-2 rounded-xl px-8 py-4 text-white font-black shadow-lg disabled:opacity-60" style={{ background: primary }}>
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <span className="inline-flex items-center gap-2">{buttonText}<ArrowRight className="w-4 h-4" /></span>}
                </button>
              </form>
            ) : <ActionButton text={buttonText} primary={primary} onClick={() => goToDestination()} />}
          </section>
        </>
      )}

      {pageKey === "order_page" && (
        <section className="px-6 py-16 md:px-14">
          <h1 className="text-4xl md:text-5xl font-black text-center max-w-3xl mx-auto" style={{ color: secondary, fontFamily: headingFont }}>{page.headline}</h1>
          <div className="max-w-xl mx-auto mt-10 border-2 rounded-3xl p-7 md:p-9 shadow-xl bg-white" style={{ borderColor: primary }}>
            <p className="text-lg text-black/65">{page.order_summary}</p>
            <p className="text-4xl font-black text-center my-8" style={{ color: primary }}>{page.price_display}</p>
            <p className="text-sm text-black/45 text-center">{page.payment_options}</p>
            <ActionButton text={buttonText} primary={primary} onClick={() => goToDestination()} />
            {connection.action === "checkout" && !connection.url && !project.payment?.checkout_url && <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl mt-4 text-center">Checkout is being connected. Please contact the seller before purchasing.</p>}
          </div>
        </section>
      )}

      {pageKey === "upsell_page" && (
        <section className="px-6 py-16 md:px-14 text-center">
          <span className="inline-block rounded-full px-4 py-2 text-sm font-black text-white" style={{ background: primary }}>ONE TIME UPGRADE</span>
          <h1 className="text-4xl md:text-5xl font-black mt-7 max-w-3xl mx-auto" style={{ color: secondary, fontFamily: headingFont }}>{page.headline}</h1>
          <p className="text-lg text-black/60 max-w-xl mx-auto mt-6">{page.offer}</p>
          <p className="text-4xl font-black mt-8" style={{ color: primary }}>{page.price}</p>
          <ActionButton text={buttonText} primary={primary} onClick={() => goToDestination()} />
        </section>
      )}

      {pageKey === "thank_you_page" && (
        <section className="px-6 py-20 md:px-14 text-center">
          <PartyPopper className="w-14 h-14 mx-auto mb-6" style={{ color: primary }} />
          <h1 className="text-4xl md:text-5xl font-black max-w-3xl mx-auto" style={{ color: secondary, fontFamily: headingFont }}>{page.headline}</h1>
          <div className="max-w-xl mx-auto text-left mt-10 bg-[#f7f6f3] p-6 rounded-2xl">
            {(page.next_steps || []).map((step, index) => <div key={index} className="flex gap-3 mb-4 last:mb-0"><span className="w-7 h-7 rounded-full text-white grid place-items-center text-sm font-black shrink-0" style={{ background: primary }}>{index + 1}</span><p className="text-sm font-semibold pt-1">{step}</p></div>)}
          </div>
          {page.onboarding_instructions && <p className="max-w-xl mx-auto mt-8 text-black/55">{page.onboarding_instructions}</p>}
          {(connection.action !== "fulfillment" || connection.url || project.payment?.type === "none") && <ActionButton text={buttonText} primary={primary} onClick={() => goToDestination()} />}
          {notice && <p className="max-w-xl mx-auto mt-6 text-sm bg-amber-50 text-amber-800 rounded-xl p-4">{notice}</p>}
        </section>
      )}

      <footer className="px-6 py-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] text-center text-sm text-black/35 border-t border-black/10">Powered by Millionaire Business OS</footer>
    </div>
  );
}

function InputField({ value, onChange, ...props }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} {...props} className="w-full mt-2 rounded-xl px-4 py-3 text-black border border-white/15 outline-none focus:ring-2 focus:ring-primary" />;
}

function ActionButton({ text, primary, onClick }) {
  return <button type="button" onClick={onClick} className="mt-8 rounded-xl px-8 py-4 text-white font-black shadow-lg inline-flex items-center gap-2" style={{ background: primary }}>{text}<ArrowRight className="w-4 h-4" /></button>;
}