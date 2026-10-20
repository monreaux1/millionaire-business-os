import React, { useEffect, useMemo, useRef, useState } from "react";
import "./landing.css";

// Cinematic header video. Set VITE_HERO_VIDEO_URL in Vercel to swap it.
const HERO_VIDEO = import.meta.env.VITE_HERO_VIDEO_URL || "";
const SIGNUP_URL = "/login?mode=signup";
// Brand logo (orange mark + black lettering on transparent). Set VITE_LOGO_URL to swap it.
const LOGO_URL = import.meta.env.VITE_LOGO_URL || "https://media.base44.com/images/public/68b3ceea8626205b99d31641/8da510d05_mblogo.png";

// The logo's lettering is black, which disappears on this dark page, so dark
// pixels are redrawn in the page's light color; the orange mark stays as is.
function useLightLogo(src) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const width = Math.min(img.naturalWidth, 1200);
        const height = Math.round((img.naturalHeight * width) / img.naturalWidth);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const data = ctx.getImageData(0, 0, width, height);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
          const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
          const max = Math.max(r, g, b);
          const saturation = max ? (max - Math.min(r, g, b)) / max : 0;
          if (px[i + 3] > 0 && max < 110 && saturation < 0.35) {
            px[i] = 244; px[i + 1] = 240; px[i + 2] = 255;
          }
        }
        ctx.putImageData(data, 0, 0);
        if (!cancelled) setUrl(canvas.toDataURL("image/png"));
      } catch {
        /* cross-origin blocked: keep the text wordmark */
      }
    };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);
  return url;
}

function Logo({ className = "" }) {
  const url = useLightLogo(LOGO_URL);
  if (!url) return <span className={`lp-wordmark ${className}`}>Millionaire Business <b>OS</b></span>;
  return <img className={`lp-logo ${className}`} src={url} alt="Millionaire Business OS" />;
}

// The eleven tabs people juggle, and what each one becomes inside the app.
const TABS = [
  { site: "Google", pain: "what should I even sell??", fix: "Offer Builder", detail: "Your idea becomes an offer ladder, from starter to premium" },
  { site: "Google", pain: "how much should I charge for…", fix: "Pricing Strategist", detail: "Prices built on value, with the reasoning behind them" },
  { site: "Funnel tool", pain: "Free trial ends in 2 days", fix: "Funnel Studio", detail: "Live pages that publish in one click and capture leads" },
  { site: "Canva", pain: "flyer_FINAL_v7.png", fix: "Brand Board", detail: "Your logo, colors and fonts on everything you make" },
  { site: "ChatGPT", pain: "write me a sales page pls", fix: "Sales Scripts & VSL", detail: "Calls, DMs, objections and video sales letters" },
  { site: "Notes", pain: "content ideas??? (empty)", fix: "Content Generator", detail: "Hooks, posts, carousels and emails for your launch" },
  { site: "YouTube", pain: "How to run ads in 2026", fix: "Ad Engine", detail: "Ad scripts plus video ads starring you and your product" },
  { site: "Sheets", pain: "Untitled spreadsheet (launch)", fix: "Launch Calendar", detail: "Day-by-day plan, delivered to your inbox every morning" },
  { site: "Sheets", pain: "leads FINAL.xlsx", fix: "Lead Dashboard", detail: "Every signup from your funnels, in one list" },
  { site: "Inbox", pain: "Re: coaching package ($3,000)", fix: "4 AI Strategists", detail: "Offer, pricing, launch and acquisition, on call 24/7" },
  { site: "Payments", pain: "Stripe? PayPal? Cash App?", fix: "Payments & Delivery", detail: "Connect checkout and deliver what they bought" },
];

// Where each tab sits in the mess (percent of the stage) and how it's tilted.
const SCATTER = [
  [4, 6, -7], [52, 2, 5], [26, 20, -3], [62, 24, 8], [2, 40, 4], [38, 42, -6],
  [66, 50, -4], [14, 64, 7], [48, 68, 3], [70, 76, -8], [24, 84, 5],
];

const PRESETS = [
  {
    label: "Tax prep for new preparers",
    idea: "Help newly licensed tax preparers open their own office",
    ladder: [
      ["Starter", "First-Client Sprint Kit", "$47"],
      ["Core", "30-Day Tax Office Launch Lab", "$997"],
      ["Premium", "Done-With-You Office Build", "$2,997"],
    ],
    headline: "Open your own tax office in 30 days, before filing season peaks",
    cta: "Send me the free launch checklist",
    days: ["Post your 'why I left the big firm' story", "Go live: 3 things new preparers get wrong", "DM 20 warm contacts the free checklist"],
    adLine: "Just got your PTIN and still working for someone else?",
  },
  {
    label: "Luxury hair extensions",
    idea: "Sell premium hair extensions and bundles online",
    ladder: [
      ["Starter", "Bundle Care & Styling Guide", "$27"],
      ["Core", "Signature Bundle Deal", "$289"],
      ["Premium", "VIP Install + Custom Unit", "$650"],
    ],
    headline: "Hair that still looks salon-fresh at week six",
    cta: "Get 10% off my first bundle",
    days: ["Reveal: before and after install", "Behind the scenes: how we test every bundle", "Flash sale for your email list"],
    adLine: "I stopped buying cheap bundles after this happened…",
  },
  {
    label: "Credit repair coaching",
    idea: "Coach people to repair their credit and get funding-ready",
    ladder: [
      ["Starter", "Credit Comeback Workbook", "$37"],
      ["Core", "90-Day Credit Repair Program", "$497"],
      ["Premium", "1:1 Funding-Ready Coaching", "$1,500"],
    ],
    headline: "Get funding-ready in 90 days, without guessing what to dispute",
    cta: "Download the free dispute checklist",
    days: ["Myth-busting post: 'paying it off fixes it'", "Live Q&A: reading your credit report", "Client win story + checklist offer"],
    adLine: "Your credit score isn't the problem. Your strategy is.",
  },
];

const GROUPS = [
  { title: "Plan it", items: ["Idea Intake", "Offer Ladder", "Money Model", "Pricing Strategist"] },
  { title: "Build it", items: ["Brand Board", "Funnel Studio with lead capture", "Freebie & asset creator", "VSL scripts"] },
  { title: "Launch it", items: ["Launch Calendar", "Daily Battle Plan email", "Content Generator", "Launch Sequence Agent"] },
  { title: "Sell it", items: ["Video ads starring you + your product", "Sales scripts", "Lead Dashboard", "Payments & delivery"] },
];

const PLANS = [
  { name: "Founding Member", price: "$27", per: "month, locked for life", note: "First 50 members only", founding: true },
  { name: "Pro", price: "$47", per: "month", note: "The full app" },
  { name: "Pro Annual", price: "$470", per: "year", note: "Two months free" },
  { name: "Pro + Coaching", price: "$197", per: "month", note: "Plus a monthly live strategy call and funnel review" },
];

const FAQ = [
  ["Do I need to be techy?", "No. You answer questions about your idea in plain words. The app writes, designs and builds; you review and publish."],
  ["Does it work for my kind of business?", "It's built for service businesses, coaches, digital products and local businesses: tax, beauty, credit, consulting and more. Everything is written for your specific idea, not a template."],
  ["Do video ads cost extra?", "Your first video ad is free. After that, video credits come in packs starting at $19 for 5 videos, because every video is rendered just for you."],
  ["Can I cancel?", "Yes, anytime from your billing page. Founding members keep the $27 rate for as long as they stay subscribed."],
  ["Will it make me money?", "It won't do the work for you, and nobody can promise results. What it removes is the guesswork: you'll know what to sell, what to charge, what to post and where to send people."],
  ["Is my business information private?", "Yes. Every account only sees its own data, and your funnels only show what you choose to publish."],
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return undefined;
    setReduced(mq.matches);
    const on = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

function useFounding() {
  const [spots, setSpots] = useState(null);
  useEffect(() => {
    fetch("/api/billing/founding").then((r) => r.json()).then(setSpots).catch(() => {});
  }, []);
  return spots;
}

function Hero({ spots }) {
  const [videoReady, setVideoReady] = useState(false);
  return (
    <header className="lp-hero">
      {HERO_VIDEO && (
        <video
          className={`lp-hero-video ${videoReady ? "is-ready" : ""}`}
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          aria-hidden="true"
        />
      )}
      <div className="lp-hero-glow" aria-hidden="true" />
      <nav className="lp-nav">
        <a href="/welcome" aria-label="Millionaire Business OS home"><Logo /></a>
        <a className="lp-nav-link" href="/login">Sign in</a>
      </nav>
      <div className="lp-hero-copy">
        <h1 className="lp-hero-title">Your idea deserves better than eleven open tabs.</h1>
        <p className="lp-hero-sub">
          Millionaire Business OS takes one business idea and builds the offer, the prices, the funnel,
          the launch plan and the video ads, in your brand, in one place.
        </p>
        <div className="lp-hero-actions">
          <a className="lp-btn lp-btn-primary" href={SIGNUP_URL}>Claim my founding spot</a>
          <a className="lp-btn lp-btn-ghost" href="#demo">Watch it build a business</a>
        </div>
        {spots?.left != null && spots.open && (
          <p className="lp-hero-spots"><b>{spots.left}</b> of {spots.limit} founding spots left at $27/month</p>
        )}
      </div>
      <a className="lp-scroll-cue" href="#story" aria-label="Scroll to the story">
        <span />
      </a>
    </header>
  );
}

function TabCard({ tab, solved }) {
  return (
    <div className="lp-tab-inner">
      <div className="lp-tab-face lp-tab-pain">
        <span className="lp-tab-bar"><i /><i /><i /><em>{tab.site}</em></span>
        <span className="lp-tab-text">{tab.pain}</span>
      </div>
      <div className="lp-tab-face lp-tab-fix" aria-hidden={!solved}>
        <span className="lp-tab-check" aria-hidden="true">✓</span>
        <span className="lp-tab-fixcopy">
          <span className="lp-tab-fixname">{tab.fix}</span>
          <span className="lp-tab-detail">{tab.detail}</span>
        </span>
      </div>
    </div>
  );
}

// Scroll story: the scattered tabs pile up, then fly into one app window.
function Story({ reduced }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = clamp(-rect.top / (total || 1));
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const compact = w < 560;
      // App window slots: two columns inside the window area.
      const win = { x: w * 0.06, y: h * 0.14, w: w * 0.88, h: h * 0.8 };
      const cols = 2;
      const gap = compact ? 6 : 10;
      const slotW = (win.w - gap * (cols + 1)) / cols;
      const slotH = (win.h - 40 - gap * 7) / 6;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const [sx, sy, sr] = SCATTER[i];
        const appear = clamp((p - i * 0.026) / 0.05);
        const fly = ease(clamp((p - 0.36 - i * 0.04) / 0.14));
        const col = i % cols;
        const row = Math.floor(i / cols);
        const tx = win.x + gap + col * (slotW + gap);
        const ty = win.y + 34 + gap + row * (slotH + gap);
        const cardW = compact ? Math.min(190, w * 0.56) : Math.min(260, w * 0.36);
        const fromX = Math.min((sx / 100) * w * 0.82, w - cardW - 4);
        const fromY = (sy / 100) * h * 0.86;
        const x = fromX + (tx - fromX) * fly;
        const y = fromY + (ty - fromY) * fly;
        const cardH = compact ? 62 : 74;
        const rot = sr * (1 - fly);
        el.style.width = `${cardW + (slotW - cardW) * fly}px`;
        el.style.height = `${cardH + (slotH - cardH) * fly}px`;
        el.style.opacity = String(appear);
        el.style.transform = `translate3d(${x}px, ${y + (1 - appear) * 24}px, 0) rotate(${rot}deg)`;
        el.dataset.solved = fly > 0.55 ? "true" : "false";
      });
      setPhase(p < 0.32 ? 0 : p < 0.86 ? 1 : 2);
      stage.dataset.window = p > 0.32 ? "open" : "closed";
      stage.dataset.done = p > 0.86 ? "true" : "false";
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  const lines = [
    { title: "You have the idea.", body: "What you don't have is a system. So you open a tab. Then another. Then eleven." },
    { title: "Every tab is another tool.", body: "Another login, another monthly bill, another tutorial. None of them know your business, and none of them talk to each other." },
    { title: "So we closed all eleven.", body: "Everything you were piecing together now lives in one app that knows your offer, your audience and your brand." },
  ];

  if (reduced) {
    return (
      <section className="lp-story-static" id="story" aria-labelledby="story-title">
        <h2 id="story-title" className="lp-h2">Eleven tabs. One app.</h2>
        <ul className="lp-solved-list">
          {TABS.map((t) => (
            <li key={t.fix}><s>{t.pain}</s><span>{t.fix}: {t.detail}</span></li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="lp-story" id="story" ref={sectionRef} aria-labelledby="story-title">
      <div className="lp-story-sticky">
        <div className="lp-story-copy">
          <h2 id="story-title" className="lp-sr-only">From eleven tabs to one app</h2>
          {lines.map((l, i) => (
            <div key={l.title} className={`lp-story-line ${phase === i ? "is-on" : ""}`} aria-hidden={phase !== i}>
              <p className="lp-story-title">{l.title}</p>
              <p className="lp-story-body">{l.body}</p>
            </div>
          ))}
          <div className={`lp-story-cta ${phase === 2 ? "is-on" : ""}`}>
            <a className="lp-btn lp-btn-primary" href={SIGNUP_URL}>Close your tabs for $27</a>
          </div>
        </div>
        <div className="lp-stage" ref={stageRef} data-window="closed" data-done="false">
          <div className="lp-window" aria-hidden="true">
            <div className="lp-window-bar"><i /><i /><i /><span>Millionaire Business OS</span></div>
          </div>
          {TABS.map((tab, i) => (
            <div key={tab.fix} className="lp-tab" ref={(el) => { cardRefs.current[i] = el; }} data-solved="false">
              <TabCard tab={tab} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Demo() {
  const [preset, setPreset] = useState(null);
  const [custom, setCustom] = useState("");
  const [step, setStep] = useState(0);
  const timers = useRef([]);

  const result = useMemo(() => {
    if (preset !== null) return PRESETS[preset];
    const idea = custom.trim();
    if (!idea) return null;
    const short = idea.length > 48 ? `${idea.slice(0, 46)}…` : idea;
    return {
      idea,
      ladder: [["Starter", `${short}: Quick-Start Kit`, "$37"], ["Core", "Signature Program", "$497"], ["Premium", "Done-With-You Package", "$1,997"]],
      headline: `The fastest way to get results with ${short.toLowerCase()}`,
      cta: "Get the free starter guide",
      days: ["Tell the story of why you started", "Teach the #1 mistake your audience makes", "Invite your list to the free guide"],
      adLine: "If you've been stuck on this, watch this…",
    };
  }, [preset, custom]);

  const run = (nextPreset) => {
    timers.current.forEach(clearTimeout);
    setPreset(nextPreset);
    setStep(0);
    timers.current = [1, 2, 3, 4].map((n) => setTimeout(() => setStep(n), n * 700));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <section className="lp-demo" id="demo" aria-labelledby="demo-title">
      <div className="lp-demo-head">
        <h2 id="demo-title" className="lp-h2">Give it an idea.</h2>
        <p className="lp-lead">Pick one, or type your own, and watch the plan take shape.</p>
      </div>
      <div className="lp-demo-controls">
        {PRESETS.map((p, i) => (
          <button key={p.label} type="button" className={`lp-chip ${preset === i ? "is-active" : ""}`} onClick={() => run(i)}>
            {p.label}
          </button>
        ))}
        <form className="lp-demo-form" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) run(null); }}>
          <label className="lp-sr-only" htmlFor="lp-idea">Your business idea</label>
          <input id="lp-idea" value={custom} onChange={(e) => { setCustom(e.target.value); }} placeholder="Or type your idea, e.g. meal prep for busy nurses" maxLength={90} />
          <button type="submit" className="lp-btn lp-btn-primary lp-btn-sm" disabled={!custom.trim()}>Build it</button>
        </form>
      </div>

      <div className="lp-demo-board" aria-live="polite">
        {!result ? (
          <p className="lp-demo-empty">Your offer, funnel, launch week and video ad will appear here.</p>
        ) : (
          <>
            <article className={`lp-out ${step >= 1 ? "is-on" : ""}`}>
              <h3>Offer ladder</h3>
              <ol className="lp-ladder">
                {result.ladder.map(([tier, name, price]) => (
                  <li key={tier}><span className="lp-tier">{tier}</span><span className="lp-tier-name">{name}</span><b>{price}</b></li>
                ))}
              </ol>
            </article>
            <article className={`lp-out ${step >= 2 ? "is-on" : ""}`}>
              <h3>Funnel</h3>
              <div className="lp-mini-page">
                <p className="lp-mini-headline">{result.headline}</p>
                <span className="lp-mini-btn">{result.cta}</span>
              </div>
            </article>
            <article className={`lp-out ${step >= 3 ? "is-on" : ""}`}>
              <h3>Launch week</h3>
              <ol className="lp-days">
                {result.days.map((d, i) => <li key={d}><span>Day {i + 1}</span>{d}</li>)}
              </ol>
            </article>
            <article className={`lp-out lp-out-video ${step >= 4 ? "is-on" : ""}`}>
              <h3>Video ad</h3>
              <div className="lp-phone"><span className="lp-play" aria-hidden="true" /><p>“{result.adLine}”</p></div>
            </article>
          </>
        )}
      </div>
      <p className="lp-fine">This is a preview. Inside the app, every piece is written for your business, in your brand, and you can edit all of it.</p>
    </section>
  );
}

function Inside() {
  return (
    <section className="lp-inside" aria-labelledby="inside-title">
      <h2 id="inside-title" className="lp-h2">Everything a launch needs.</h2>
      <div className="lp-groups">
        {GROUPS.map((g) => (
          <div key={g.title} className="lp-group">
            <h3>{g.title}</h3>
            <ul>{g.items.map((it) => <li key={it}>{it}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing({ spots }) {
  const taken = spots?.taken ?? null;
  const limit = spots?.limit ?? 50;
  return (
    <section className="lp-pricing" id="pricing" aria-labelledby="pricing-title">
      <h2 id="pricing-title" className="lp-h2">Pick your plan.</h2>
      <p className="lp-lead">Cancel anytime. Your first video ad is on us.</p>
      <div className="lp-plans">
        {PLANS.map((plan) => (
          <div key={plan.name} className={`lp-plan ${plan.founding ? "lp-plan-founding" : ""}`}>
            <h3>{plan.name}</h3>
            <p className="lp-price"><b>{plan.price}</b> <span>/ {plan.per}</span></p>
            <p className="lp-plan-note">{plan.note}</p>
            {plan.founding && taken != null && (
              <div className="lp-meter" role="img" aria-label={`${taken} of ${limit} founding spots taken`}>
                <span style={{ width: `${Math.max(4, (taken / limit) * 100)}%` }} />
                <em>{spots.open ? `${spots.left} spots left` : "Sold out"}</em>
              </div>
            )}
            <a className={`lp-btn ${plan.founding ? "lp-btn-primary" : "lp-btn-quiet"}`} href={SIGNUP_URL}>
              {plan.founding ? "Claim my founding spot" : `Start ${plan.name}`}
            </a>
          </div>
        ))}
      </div>
      <p className="lp-fine">Video ad credits are sold separately in packs from $19. You'll pick your plan right after creating your account.</p>
    </section>
  );
}

function Faq() {
  return (
    <section className="lp-faq" aria-labelledby="faq-title">
      <h2 id="faq-title" className="lp-h2">Questions, answered.</h2>
      <div className="lp-faq-list">
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function Landing() {
  const reduced = useReducedMotion();
  const spots = useFounding();

  useEffect(() => {
    document.title = "Millionaire Business OS | Your whole business in one app";
    document.documentElement.classList.add("lp-root");
    // Fonts load separately so the page still renders if Google Fonts is slow or blocked.
    if (!document.getElementById("lp-fonts")) {
      const link = document.createElement("link");
      link.id = "lp-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap";
      document.head.appendChild(link);
    }
    return () => document.documentElement.classList.remove("lp-root");
  }, []);

  return (
    <div className="lp">
      <Hero spots={spots} />
      <Story reduced={reduced} />
      <Demo />
      <Inside />
      <Pricing spots={spots} />
      <Faq />
      <section className="lp-final">
        <h2 className="lp-final-title">Close the tabs.<br />Open the business.</h2>
        <a className="lp-btn lp-btn-primary lp-btn-lg" href={SIGNUP_URL}>Claim my founding spot</a>
      </section>
      <footer className="lp-footer">
        <Logo className="lp-logo-sm" />
        <span>© {new Date().getFullYear()} AI Wealth Systems</span>
        <a href="/login">Sign in</a>
      </footer>
    </div>
  );
}
