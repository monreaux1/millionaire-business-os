import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, X, RefreshCw, MessageCircle } from "lucide-react";

export default function AgentChatBubble({
  title = "Agent",
  systemPrompt,
  greeting = "Hey! Ask me anything about your strategy.",
  quickPrompts = [],
  loadBusinessContext = true,
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", content: greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bizContext, setBizContext] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (loadBusinessContext && open && !bizContext) {
      base44.entities.Business.list("-created_date", 1).then((biz) => {
        if (biz[0]) {
          const b = biz[0];
          setBizContext(`\n\nUSER'S BUSINESS CONTEXT (use this to personalize answers):\n- Name: ${b.business_name}\n- Industry: ${b.industry || "N/A"}\n- Target Avatar: ${b.target_avatar || "N/A"}\n- Core Service: ${b.core_service || "N/A"}\n- Pricing Model: ${b.pricing_model || "N/A"}\n- Dream Outcome: ${b.dream_outcome || "N/A"}\n- Unique Advantage: ${b.unique_advantage || "N/A"}\n- Biggest Challenge: ${b.biggest_challenge || "N/A"}`);
        }
      }).catch(() => {});
    }
  }, [open, bizContext, loadBusinessContext]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const history = messages.slice(-6).map((m) => `${m.role === "user" ? "USER" : title.toUpperCase()}: ${m.content}`).join("\n\n");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}${bizContext}\n\nRECENT CONVERSATION:\n${history}\n\nUSER'S NEW QUESTION: ${content}\n\nRespond directly, concisely, and with a specific actionable next step. No fluff.`,
      });
      setMessages((prev) => [...prev, { role: "bot", content: typeof res === "string" ? res : JSON.stringify(res) }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: "Sorry, I hit an issue. Try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full accent-gradient text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform accent-glow"
          aria-label={`Chat with ${title}`}>
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="accent-gradient text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">{title}</p>
                <p className="text-white/70 text-sm">Ask me anything</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setMessages([{ role: "bot", content: greeting }]); }}
                aria-label="Reset chat" title="Reset"
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-lg hover:bg-white/20 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close chat" title="Close"
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "accent-gradient text-white font-medium" : "bg-card text-foreground border border-border"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border px-4 py-3 rounded-2xl flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0,1,2].map((i) => <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i*0.1}s` }} />)}
                  </div>
                  <span className="text-muted-foreground text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts */}
          {quickPrompts.length > 0 && messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {quickPrompts.map((p, i) => (
                <button key={i} onClick={() => send(p)}
                  className="text-sm px-2.5 py-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2 flex-shrink-0 bg-card">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything..." disabled={loading}
              className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="accent-gradient text-white rounded-lg px-3 flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}