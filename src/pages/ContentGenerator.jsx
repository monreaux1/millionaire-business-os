import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, AlertCircle, Copy, CheckCheck } from "lucide-react";
import { accountStorage } from "@/lib/account-storage";
import PullToRefresh from "@/components/PullToRefresh";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} aria-label="Copy to clipboard" className="text-muted-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px] grid place-items-center rounded-lg">
      {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

const TABS = [
  { id: "hooks", label: "🪝 Hooks" },
  { id: "videos", label: "🎥 Video Scripts" },
  { id: "carousels", label: "📊 Carousels" },
  { id: "stories", label: "📸 Story Posts" },
  { id: "email", label: "📨 Email" },
];

export default function ContentGenerator() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("hooks");

  const loadData = () => {
    const stored = accountStorage.getItem("launchSystem");
    if (stored) setData(JSON.parse(stored).result);
  };

  useEffect(() => { loadData(); }, []);

  if (!data) return (
    <AppLayout>
      <div className="p-10 max-w-2xl mx-auto text-center hero-radial min-h-screen flex flex-col justify-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-foreground font-bold text-xl mb-2">No Launch System Found</h2>
        <Link to="/IdeaIntake"><Button className="accent-gradient text-white font-bold mt-4 hover:opacity-90">Start Idea Intake</Button></Link>
      </div>
    </AppLayout>
  );

  const cp = data.content_plan;

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadData}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto hero-radial min-h-screen">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">CONTENT GENERATOR</Badge>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">Content Plan</h1>
            <p className="text-muted-foreground">Hooks, scripts, carousels, story posts, and email — all ready to use.</p>
          </div>
          <Link to="/SalesScripts">
            <Button className="accent-gradient text-white font-bold px-5 py-2.5 h-auto rounded-xl hover:opacity-90">
              Next: Sales Scripts <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-primary text-white font-bold' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hooks */}
        {activeTab === "hooks" && (
          <div className="space-y-4">
            {cp.hooks?.map((hook, i) => (
              <div key={i} className="light-card rounded-2xl p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg accent-gradient text-white flex items-center justify-center font-black text-sm flex-shrink-0">{i + 1}</div>
                  <p className="text-foreground font-semibold">{hook}</p>
                </div>
                <CopyBtn text={hook} />
              </div>
            ))}
          </div>
        )}

        {/* Video Scripts */}
        {activeTab === "videos" && (
          <div className="space-y-5">
            {cp.video_scripts?.map((v, i) => (
              <div key={i} className="light-card rounded-2xl border border-rose-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-rose-600 font-bold">{v.title}</h3>
                  <CopyBtn text={`${v.title}\n\n${v.script}`} />
                </div>
                <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{v.script}</p>
              </div>
            ))}
          </div>
        )}

        {/* Carousels */}
        {activeTab === "carousels" && (
          <div className="space-y-4">
            {cp.carousel_ideas?.map((idea, i) => (
              <div key={i} className="light-card rounded-2xl border border-purple-200 p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-black text-sm flex-shrink-0">{i + 1}</div>
                  <p className="text-foreground">{idea}</p>
                </div>
                <CopyBtn text={idea} />
              </div>
            ))}
          </div>
        )}

        {/* Story Posts */}
        {activeTab === "stories" && (
          <div className="space-y-4">
            {cp.story_posts?.map((post, i) => (
              <div key={i} className="light-card rounded-2xl border border-cyan-200 p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center font-black text-sm flex-shrink-0">{i + 1}</div>
                  <p className="text-foreground">{post}</p>
                </div>
                <CopyBtn text={post} />
              </div>
            ))}
          </div>
        )}

        {/* Email */}
        {activeTab === "email" && (
          <div className="light-card rounded-2xl border border-indigo-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-indigo-600 font-bold">Email Newsletter Outline</h3>
              <CopyBtn text={cp.email_outline} />
            </div>
            <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{cp.email_outline}</p>
          </div>
        )}
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}