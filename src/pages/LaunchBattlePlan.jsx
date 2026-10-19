import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";
import AgentChatBubble from "@/components/AgentChatBubble";
import { accountStorage } from "@/lib/account-storage";

const DAY_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-600",
  "bg-purple-50 border-purple-200 text-purple-600",
  "bg-primary/10 border-primary/20 text-primary",
  "bg-emerald-50 border-emerald-200 text-emerald-600",
  "bg-amber-50 border-amber-200 text-amber-600",
  "bg-rose-50 border-rose-200 text-rose-600",
  "bg-pink-50 border-pink-200 text-pink-600",
];

export default function LaunchBattlePlan() {
  const [data, setData] = useState(null);

  const loadLaunchData = () => {
    const stored = accountStorage.getItem("launchSystem");
    if (stored) setData(JSON.parse(stored).result);
  };

  useEffect(() => { loadLaunchData(); }, []);

  if (!data) return (
    <AppLayout>
      <PullToRefresh onRefresh={loadLaunchData}>
      <div className="p-10 max-w-2xl mx-auto text-center hero-radial min-h-screen flex flex-col justify-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-foreground font-bold text-xl mb-2">No Launch System Found</h2>
        <Link to="/IdeaIntake"><Button className="accent-gradient text-white font-bold mt-4 hover:opacity-90">Start Idea Intake</Button></Link>
      </div>
      </PullToRefresh>
    </AppLayout>
  );

  const plan = data.launch_plan;

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadLaunchData}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto hero-radial min-h-screen">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">LAUNCH BATTLE PLAN</Badge>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">7-Day Launch Roadmap</h1>
            <p className="text-muted-foreground">Day-by-day execution plan. Hook, content, and CTA for each day.</p>
          </div>
          <Link to="/ContentGenerator">
            <Button className="accent-gradient text-white font-bold px-5 py-2.5 h-auto rounded-xl hover:opacity-90">
              Next: Content Generator <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mb-8">
          {plan?.map((day, i) => (
            <div key={i} className={`rounded-xl p-2 text-center border ${DAY_COLORS[i % DAY_COLORS.length]}`}>
              <p className="text-sm font-bold">DAY</p>
              <p className="text-xl font-black">{day.day}</p>
            </div>
          ))}
        </div>

        {/* Day Cards */}
        <div className="space-y-4">
          {plan?.map((day, i) => {
            const colorCls = DAY_COLORS[i % DAY_COLORS.length];
            const borderCls = colorCls.split(' ').find(c => c.startsWith('border-'));
            const textCls = colorCls.split(' ').find(c => c.startsWith('text-'));
            return (
              <div key={i} className={`light-card rounded-2xl border ${borderCls} p-6 flex items-start gap-5`}>
                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border ${colorCls}`}>
                  <span className="text-sm font-bold opacity-70">DAY</span>
                  <span className="font-black text-xl">{day.day}</span>
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-base mb-2 ${textCls}`}>{day.theme}</h3>
                  <p className="text-foreground font-semibold mb-3 italic">"{day.hook}"</p>
                  <Badge className={`border ${colorCls} text-sm`}>CTA → {day.cta}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </PullToRefresh>
      <AgentChatBubble
        title="Launch Sequence Agent"
        systemPrompt="You are a launch strategist who builds step-by-step execution plans to scale a business fast. Cover: phased launch calendars, daily actions, offer sequencing, content calendars, channel selection, weekly non-negotiables, and kill switches. Be direct, specific, and give a concrete next action."
        greeting="Hey! I'm your Launch Sequence Agent. Ask me about your launch phases, daily actions, or fastest path to revenue — I'll use your saved business data."
        quickPrompts={["What should I do in my first 14 days?", "What's the fastest path to $10k?", "Which channels should I focus on?", "What are my weekly non-negotiables?"]}
      />
    </AppLayout>
  );
}