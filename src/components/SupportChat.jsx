import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { base44, callApi } from "@/api/base44Client";
import { LifeBuoy, X, Send, Mail, CheckCircle2, ArrowLeft } from "lucide-react";

// Help chat: members get instant AI answers about the app plus a
// "Send to support" button that emails a real person. Visitors who aren't
// signed in get the message form directly.
const EMBER = "#ff5a1f";
const GREETING = "Hi! I'm the help assistant. Ask me how to do anything in the app, or tap \"Send to support\" to reach a real person.";

export default function SupportChat() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(null);
  const [view, setView] = useState("chat"); // chat | form | sent
  const [messages, setMessages] = useState([{ role: "bot", content: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    base44.auth.isAuthenticated().then((ok) => {
      setSignedIn(ok);
      if (!ok) setView((v) => (v === "sent" ? v : "form"));
    }).catch(() => { setSignedIn(false); setView("form"); });
  }, [open]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, view]);

  const inApp = signedIn && !["/welcome", "/login", "/reset-password"].includes(location.pathname);

  const ask = async (e) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { answer } = await callApi("/api/support", { action: "ask", messages: next.slice(1) });
      setMessages((prev) => [...prev, { role: "bot", content: answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", content: `${err?.message || "I hit a snag."} You can tap "Send to support" to reach a real person.` }]);
    }
    setLoading(false);
  };

  const openForm = () => {
    const lastQuestion = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    setForm((f) => ({ ...f, message: f.message || lastQuestion }));
    setError("");
    setView("form");
  };

  const send = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await callApi("/api/support", {
        action: "send",
        ...form,
        page: window.location.pathname + window.location.search,
        transcript: messages.slice(1),
      });
      setView("sent");
      setForm((f) => ({ ...f, message: "" }));
    } catch (err) {
      setError(err?.message || "That didn't send. Please try again.");
    }
    setLoading(false);
  };

  if (location.pathname.startsWith("/f/")) return null;

  const bottom = inApp ? "bottom-20 md:bottom-6" : "bottom-4 md:bottom-6";

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed ${bottom} left-4 md:left-6 z-[60] flex items-center gap-2 rounded-full px-4 h-11 text-white text-sm font-semibold shadow-lg hover:scale-105 transition-transform`}
          style={{ background: EMBER, boxShadow: "0 8px 24px rgba(255,90,31,.35)" }}
          aria-label="Open help chat"
        >
          <LifeBuoy className="w-4 h-4" /> Help
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Help and support"
          className={`fixed ${bottom} left-3 right-3 md:left-6 md:right-auto z-[60] md:w-[380px] h-[min(560px,calc(100dvh-120px))] flex flex-col rounded-2xl overflow-hidden bg-white text-slate-900 shadow-2xl border border-slate-200`}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#140e33" }}>
            <div className="flex items-center gap-2">
              {view !== "chat" && signedIn && (
                <button onClick={() => setView("chat")} className="p-1 -ml-1 rounded hover:bg-white/10" aria-label="Back to chat">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <LifeBuoy className="w-4 h-4" style={{ color: EMBER }} />
              <div>
                <p className="text-sm font-semibold leading-tight">Help &amp; Support</p>
                <p className="text-[11px] text-white/60 leading-tight">
                  {view === "chat" ? "Instant answers · real people on request" : "A real person replies by email"}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10" aria-label="Close help">
              <X className="w-4 h-4" />
            </button>
          </div>

          {view === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "text-white rounded-br-sm" : "bg-white border border-slate-200 rounded-bl-sm"}`}
                      style={m.role === "user" ? { background: EMBER } : undefined}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && <div className="text-xs text-slate-500 px-1">Typing…</div>}
                <div ref={endRef} />
              </div>
              <div className="border-t border-slate-200 bg-white p-3 space-y-2">
                <form onSubmit={ask} className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question…"
                    maxLength={1200}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 bg-white text-slate-900"
                  />
                  <button type="submit" disabled={loading || !input.trim()} className="rounded-xl px-3 text-white disabled:opacity-40" style={{ background: EMBER }} aria-label="Send question">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <button onClick={openForm} className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-2 text-sm font-medium hover:bg-slate-50">
                  <Mail className="w-4 h-4" /> Send to support
                </button>
              </div>
            </>
          )}

          {view === "form" && (
            <form onSubmit={send} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              <p className="text-sm text-slate-600">
                Tell us what's going on and we'll reply by email, usually within one business day.
              </p>
              {signedIn === false && (
                <>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900" maxLength={120} />
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Your email"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900" maxLength={200} />
                </>
              )}
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="hidden" aria-hidden="true" name="website" />
              <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} maxLength={4000}
                placeholder="What do you need help with? Include what page you were on and what happened."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 resize-none" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: EMBER }}>
                {loading ? "Sending…" : "Send message"}
              </button>
            </form>
          )}

          {view === "sent" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white">
              <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-500" />
              <p className="font-semibold">Message sent</p>
              <p className="text-sm text-slate-600 mt-1">We emailed you a copy. A real person will reply to your email soon.</p>
              <button onClick={() => setView(signedIn ? "chat" : "form")} className="mt-4 text-sm underline text-slate-600">
                {signedIn ? "Back to chat" : "Send another message"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
