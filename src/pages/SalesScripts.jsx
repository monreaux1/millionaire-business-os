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
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} aria-label="Copy to clipboard" className="text-muted-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px] grid place-items-center rounded-lg">
      {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

const TABS = [
  { id: "call", label: "📞 Discovery Call" },
  { id: "dm", label: "💬 DM Script" },
  { id: "objections", label: "💸 Objections" },
  { id: "thinkit", label: "⏳ Think About It" },
  { id: "close", label: "🏆 Closing Statement" },
];

export default function SalesScripts() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("call");

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

  const ss = data.sales_system;

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadData}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto hero-radial min-h-screen">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">SALES SCRIPTS</Badge>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">Your Sales System</h1>
            <p className="text-muted-foreground">Discovery calls, DMs, objection handling, and closing lines — ready to use.</p>
          </div>
          <Link to="/DeploymentCenter">
            <Button className="accent-gradient text-white font-bold px-5 py-2.5 h-auto rounded-xl hover:opacity-90">
              Next: Deploy <ArrowRight className="w-4 h-4 ml-2" />
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

        {activeTab === "call" && (
          <div className="light-card rounded-2xl border border-primary/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-primary font-bold text-lg">Discovery Call Script</h3>
              <CopyBtn text={ss.discovery_call_script} />
            </div>
            <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{ss.discovery_call_script}</p>
          </div>
        )}

        {activeTab === "dm" && (
          <div className="light-card rounded-2xl border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-blue-600 font-bold text-lg">DM Outreach Script</h3>
              <CopyBtn text={ss.dm_script} />
            </div>
            <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{ss.dm_script}</p>
          </div>
        )}

        {activeTab === "objections" && (
          <div className="space-y-4">
            {ss.price_objections?.map((obj, i) => (
              <div key={i} className="light-card rounded-2xl border border-rose-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-rose-50 text-rose-600 border border-rose-200 text-sm">Objection {i + 1}</Badge>
                  <CopyBtn text={obj} />
                </div>
                <p className="text-foreground text-sm">{obj}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "thinkit" && (
          <div className="light-card rounded-2xl border border-amber-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-amber-600 font-bold text-lg">"I Need To Think About It" Response</h3>
              <CopyBtn text={ss.think_about_it} />
            </div>
            <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{ss.think_about_it}</p>
          </div>
        )}

        {activeTab === "close" && (
          <div className="rounded-2xl p-8 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,106,61,0.08), rgba(255,106,61,0.02))', border: '1px solid rgba(255,106,61,0.3)' }}>
            <div className="flex items-center justify-end mb-4">
              <CopyBtn text={ss.closing_statement} />
            </div>
            <p className="text-primary font-bold text-sm uppercase tracking-wider mb-4">The Close</p>
            <p className="text-foreground font-display font-bold text-xl md:text-2xl leading-relaxed">
              "{ss.closing_statement}"
            </p>
          </div>
        )}
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}