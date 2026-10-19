import React, { useState, useRef, useEffect } from "react";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Zap, AlertCircle } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { accountStorage } from "@/lib/account-storage";

export default function HormoziBot() {

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Welcome. I'm your Millionaire Business Strategist. I help turn business problems into focused revenue actions.\n\nWhat business problem are we solving today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const loadConversation = () => {
    try {
      const stored = accountStorage.getItem("hormoziBotChat");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch (error) {
      console.warn("Saved conversation could not be loaded:", error);
    }
  };

  useEffect(() => { loadConversation(); }, []);

  useEffect(() => {
    accountStorage.setItem("hormoziBotChat", JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const conversationHistory = messages.slice(-5).map(msg => 
        `${msg.type === 'user' ? 'USER' : 'STRATEGIST'}: ${msg.content}`
      ).join('\n\n');

      const prompt = `
You are the Millionaire Business Strategist, a direct and practical business advisor. You help entrepreneurs build ethical, sustainable revenue with proven business principles.

YOUR PERSONALITY:
- Direct and blunt, but not rude
- Zero fluff or motivational nonsense
- Focus on VALUE DELIVERY and REVENUE GENERATION
- Use real examples and specific numbers when possible
- Challenge bad ideas aggressively
- Give actionable steps, not theory

YOUR EXPERTISE:
1. OFFERS: Value equation (Dream Outcome × Likelihood) ÷ (Time Delay × Effort). Make offers so good people feel dumb saying no. Stack bonuses, add guarantees, niche down till it hurts.
2. LEADS: 4 sources — Outreach, Content, Paid Ads, Referrals. Hook formula: Call out audience → Hit pain point → Promise result. Post daily. Be polarizing.
3. SALES: People don't need convincing, they need certainty. Framework: Identify problem → Agitate pain → Present solution → Remove risk → Close confidently. Every objection = lack of Trust, Time, Money, or Belief. Fix the root, not the surface.
4. DELIVERY: Overdeliver so clients stay and refer. This is your retention and referral engine.

RECENT CONVERSATION:
${conversationHistory}

USER'S NEW QUESTION: ${inputMessage}

Respond clearly, directly, and constructively. Connect answers to Offers, Leads, Sales, or Delivery and give one specific action the user can take today. Focus on practical revenue improvement.
      `;

      const response = await InvokeLLM({
        prompt: prompt
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting bot response:", error);
      setError("AI is having issues. Try again in a moment.");
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "How do I price my service?",
    "My leads aren't converting",
    "Build me a hook formula",
    "How to create an irresistible offer?",
    "Handle my top 3 objections",
    "What content should I post daily?",
    "How do I close high-ticket sales?",
    "My business isn't growing"
  ];

  const handleQuickPrompt = (prompt) => {
    setInputMessage(prompt);
  };

  return (
    <AppLayout>
    <PullToRefresh onRefresh={loadConversation}>
    <div className="p-6 md:p-10 max-w-4xl mx-auto hero-radial min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 accent-gradient rounded-xl">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-black text-foreground">Business Strategist</h1>
              <p className="text-muted-foreground">Ask me anything. I will tell you what works.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3">
            <AlertCircle className="w-4 h-4" />{error}
          </div>
        )}

        {/* Chat Container */}
        <div className="light-card rounded-2xl mb-6 overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-foreground font-bold text-sm">Strategy Session</span>
          </div>
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-lg px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  message.type === 'user' ? 'accent-gradient text-white font-semibold' : 'bg-secondary text-foreground border border-border'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary border border-border px-4 py-3 rounded-2xl flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i*0.1}s` }} />)}
                  </div>
                  <span className="text-muted-foreground text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-4">
            <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-3">Quick Questions</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {quickPrompts.map((prompt, i) => (
                <button key={i} onClick={() => handleQuickPrompt(prompt)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition-colors">
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Input value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={handleKeyPress}
                placeholder="Ask anything about business..." disabled={isLoading}
                className="bg-card border-border text-foreground flex-1 h-11" />
              <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}
                className="accent-gradient text-white font-bold h-11 px-5 hover:opacity-90">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Framework Reference */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: "💎", title: "Offers", desc: "Value equation, offer stacking, guarantees, pricing psychology" },
            { icon: "📣", title: "Leads", desc: "Hook formula, content strategy, outreach, paid ads, referrals" },
            { icon: "🤝", title: "Sales", desc: "Closing scripts, objection handling, certainty building" },
            { icon: "🚀", title: "Delivery", desc: "Overdelivery, retention, referrals, systems" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="light-card rounded-xl p-4 flex items-start gap-3">
              <span className="text-xl">{icon}</span>
              <div><p className="text-foreground font-semibold text-sm">{title}</p><p className="text-muted-foreground text-sm">{desc}</p></div>
            </div>
          ))}
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}