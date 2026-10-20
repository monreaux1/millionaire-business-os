import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { accountStorage } from "@/lib/account-storage";
import { Copy, CheckCheck, Zap, Loader2, TrendingUp, Video, Type, Eye, Scissors, Film, Download, RefreshCw, Coins } from "lucide-react";
import { getVideoCredits, buyVideoCredits, confirmVideoCredits, startVideo, waitForVideo } from "@/lib/video";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-primary transition-colors p-1">
      {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

const MODES = [
  { id: "ugc", label: "🧑 UGC Style", desc: "Real person, not a brand" },
  { id: "authority", label: "🎓 Authority Mode", desc: "Polished expert positioning" },
  { id: "aggressive", label: "🔥 Aggressive Conversion", desc: "Urgency, strong claims, direct CTA" },
];

const TABS = [
  { id: "hooks", label: "🪝 Hooks", icon: TrendingUp },
  { id: "script", label: "🎬 Video Script", icon: Video },
  { id: "onscreen", label: "📝 On-Screen Text", icon: Type },
  { id: "visual", label: "👁️ Visual Direction", icon: Eye },
  { id: "editing", label: "✂️ Editing Style", icon: Scissors },
  { id: "performance", label: "📊 Performance", icon: TrendingUp },
  { id: "video", label: "🎥 Video Ad", icon: Film },
];

export default function AdEngine() {
  const [launchData, setLaunchData] = useState(null);
  const [mode, setMode] = useState("ugc");
  const [activeTab, setActiveTab] = useState("hooks");
  const [isGenerating, setIsGenerating] = useState(false);
  const [ads, setAds] = useState(null);
  const [perf, setPerf] = useState({ views: "", ctr: "", conversions: "" });
  const [perfFeedback, setPerfFeedback] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [videoJob, setVideoJob] = useState(null);
  const [videoError, setVideoError] = useState("");
  const [videoNotice, setVideoNotice] = useState("");
  const [buyingPack, setBuyingPack] = useState("");
  const [characterDesc, setCharacterDesc] = useState("");

  const loadLaunchData = () => {
    const stored = accountStorage.getItem("launchSystem");
    if (stored) setLaunchData(JSON.parse(stored));
  };

  useEffect(() => { loadLaunchData(); }, []);

  const loadVideoCredits = async () => {
    try { setVideoInfo(await getVideoCredits()); } catch { /* video is optional */ }
  };

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("credits") === "success" && params.get("session_id")) {
        setActiveTab("video");
        try {
          const result = await confirmVideoCredits(params.get("session_id"));
          setVideoNotice(result.paid ? "Credits added. You're ready to make video ads." : "Payment received. Your credits will appear in a minute.");
        } catch (e) {
          setVideoError(e?.data?.error || e?.message || "Couldn't confirm your purchase. Refresh in a minute.");
        }
        window.history.replaceState({}, "", "/AdEngine");
      } else if (params.get("credits") === "canceled") {
        setActiveTab("video");
        setVideoNotice("Checkout canceled. No charge was made.");
        window.history.replaceState({}, "", "/AdEngine");
      }
      loadVideoCredits();
    })();
  }, []);

  const buyPack = async (packKey) => {
    setBuyingPack(packKey);
    setVideoError("");
    try {
      const { url } = await buyVideoCredits(packKey);
      window.location.assign(url);
      return;
    } catch (e) {
      setVideoError(e?.data?.error || e?.message || "Couldn't start checkout. Please try again.");
    }
    setBuyingPack("");
  };

  const businessContext = launchData
    ? `Business: ${launchData.intake?.what || "coaching/service business"}. Target: ${launchData.intake?.who || "entrepreneurs"}. Problem solved: ${launchData.intake?.problem || "not specified"}. Result: ${launchData.intake?.result || "not specified"}.`
    : "A coaching/consulting/service business.";

  const generateAds = async () => {
    setIsGenerating(true);
    setAds(null);
    const modeLabel = MODES.find(m => m.id === mode)?.label || "UGC Style";
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a direct-response ad copywriter. Generate high-converting short-form video ads in "${modeLabel}" mode.

Context: ${businessContext}

Generate the following as valid JSON:
- hooks: array of 15 hook strings. Mix these types: call-out (address the audience directly), pattern interrupt (unexpected/jarring opening), pain trigger (name a specific frustration), bold claim (big promise). Each hook should be 1–2 sentences max, punchy.
- script: object with: hook (0–3 sec, 1 line), problem (3–7 sec, 1–2 lines), solution (7–15 sec, 2–3 lines), cta (15–30 sec, 1–2 lines)
- onscreen_text: object with: headline (big bold hook text, max 8 words), key_points (array of 4 subtitle strings), outcome_highlight (1 bold outcome line)
- visual_direction: object with: style (one of: talking head, walking + talking, screen recording, lifestyle clip, before/after), setting (where to film), wardrobe (what to wear), tips (array of 3 practical filming tips)
- editing_style: array of 6 editing directives (e.g. "Quick cuts every 2–3 seconds", "Zoom in on key words", "Bold captions auto-generated", etc.)
- funnel_connection: object with: hook_maps_to (how the hook connects to the landing page headline), problem_maps_to (how the problem section connects to funnel section 1), cta_maps_to (what the CTA button should say)

Mode instructions for "${modeLabel}":
- ugc: Sound like a real person. Imperfect, conversational, no corporate speak. Use "I", "you", "they said", relatable language.
- authority: Sound like an established expert. Confident, data-backed, professional but not stiff. Use proof points.
- aggressive: High urgency. Strong claims. Direct commands. FOMO-heavy. Use deadline language, strong verbs.`,
      response_json_schema: {
        type: "object",
        properties: {
          hooks: { type: "array", items: { type: "string" } },
          script: {
            type: "object",
            properties: {
              hook: { type: "string" },
              problem: { type: "string" },
              solution: { type: "string" },
              cta: { type: "string" }
            }
          },
          onscreen_text: {
            type: "object",
            properties: {
              headline: { type: "string" },
              key_points: { type: "array", items: { type: "string" } },
              outcome_highlight: { type: "string" }
            }
          },
          visual_direction: {
            type: "object",
            properties: {
              style: { type: "string" },
              setting: { type: "string" },
              wardrobe: { type: "string" },
              tips: { type: "array", items: { type: "string" } }
            }
          },
          editing_style: { type: "array", items: { type: "string" } },
          funnel_connection: {
            type: "object",
            properties: {
              hook_maps_to: { type: "string" },
              problem_maps_to: { type: "string" },
              cta_maps_to: { type: "string" }
            }
          }
        }
      }
    });
    setAds(result);
    setIsGenerating(false);
  };

  const analyzePerformance = async () => {
    setIsAnalyzing(true);
    setPerfFeedback(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a paid ads performance coach. Analyze these ad metrics and give blunt, actionable feedback.

Context: ${businessContext}
Views: ${perf.views || "unknown"}
CTR: ${perf.ctr || "unknown"}%
Conversions: ${perf.conversions || "unknown"}

Current hook: ${ads?.hooks?.[0] || "not provided"}
Current CTA: ${ads?.script?.cta || "not provided"}

Give a JSON response with:
- hook_verdict: "strong" | "weak" | "average"
- hook_fix: specific improved hook string if weak/average
- cta_verdict: "clear" | "unclear"
- cta_fix: specific improved CTA string if unclear
- overall_diagnosis: 2–3 sentence blunt diagnosis of what's wrong
- top_fix: the single most impactful change to make right now`,
      response_json_schema: {
        type: "object",
        properties: {
          hook_verdict: { type: "string" },
          hook_fix: { type: "string" },
          cta_verdict: { type: "string" },
          cta_fix: { type: "string" },
          overall_diagnosis: { type: "string" },
          top_fix: { type: "string" }
        }
      }
    });
    setPerfFeedback(result);
    setIsAnalyzing(false);
  };

  const generateVideoAd = async () => {
    if (!ads) return;
    setIsGeneratingVideo(true);
    setVideoError("");
    setVideoNotice("");
    setVideoJob(null);
    const vd = ads.visual_direction || {};
    const script = ads.script || {};
    const modeLabel = MODES.find(m => m.id === mode)?.label?.replace(/^\S+\s/, "") || "UGC Style";
    const person = characterDesc
      ? `The same person in every shot: ${characterDesc}.`
      : `A relatable person wearing ${vd.wardrobe || "everyday casual clothing"}.`;
    const style = `Vertical 9:16 ${modeLabel} video ad for ${launchData?.intake?.what || "a coaching/service business"}. ${vd.style || "One person speaking to the camera"}, filmed in ${vd.setting || "a casual real-world setting"}. ${person} Handheld smartphone look, natural lighting, authentic, speaking to camera in English.`;
    const shots = [
      { line: script.hook, duration: 3 },
      { line: script.problem, duration: 4 },
      { line: script.solution, duration: 4 },
      { line: script.cta, duration: 4 },
    ].filter((s) => s.line).map((s) => ({ duration: s.duration, line: String(s.line).slice(0, 300) }));
    try {
      setVideoProgress("Starting your video…");
      const { job } = await startVideo({ shots, style, title: (ads.hooks?.[0] || script.hook || "Video ad").slice(0, 120) });
      setVideoJob(job);
      loadVideoCredits();
      const { job: finished, refunded, timedOut } = await waitForVideo(job.id, (update) => {
        setVideoJob(update);
        setVideoProgress(update.status === "queued"
          ? `Waiting in line${update.position != null ? ` (position ${update.position + 1})` : ""}…`
          : "Filming your ad… this usually takes 2–5 minutes.");
      });
      if (timedOut) setVideoNotice("Still rendering. It will appear under Your videos when it's done — you can leave this page.");
      else if (finished.status === "failed") setVideoError(`${finished.error || "The video couldn't be generated."}${refunded ? " Your credit was refunded." : ""}`);
    } catch (e) {
      setVideoError(e?.data?.error || e?.message || "Couldn't start the video. Please try again.");
    }
    setVideoProgress("");
    setIsGeneratingVideo(false);
    loadVideoCredits();
  };

  const hookTypes = {
    "call-out": "bg-blue-50 text-blue-600 border-blue-200",
    "pattern interrupt": "bg-purple-50 text-purple-600 border-purple-200",
    "pain trigger": "bg-rose-50 text-rose-600 border-rose-200",
    "bold claim": "bg-amber-50 text-amber-600 border-amber-200",
  };

  const getHookType = (i) => {
    const types = Object.keys(hookTypes);
    return types[i % types.length];
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadLaunchData}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto hero-radial min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider px-3 py-1">AD ENGINE</Badge>
          <h1 className="font-display text-3xl font-black text-foreground mb-2">High-Converting Ad Engine</h1>
          <p className="text-muted-foreground">Generate scroll-stopping hooks, video scripts, on-screen text, and visual direction — all connected to your funnel.</p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${mode === m.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}
            >
              <p className={`font-bold text-sm mb-1 ${mode === m.id ? 'text-primary' : 'text-foreground'}`}>{m.label}</p>
              <p className="text-muted-foreground text-sm">{m.desc}</p>
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateAds}
          disabled={isGenerating}
          className="w-full accent-gradient hover:opacity-90 text-white font-black text-lg py-6 mb-8 rounded-xl"
        >
          {isGenerating
            ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />GENERATING YOUR ADS...</>
            : <><Zap className="w-5 h-5 mr-2" />GENERATE SCROLL-STOPPING ADS</>
          }
        </Button>

        {/* Results */}
        {ads && (
          <>
            {/* Tab Nav */}
            <div className="flex flex-wrap gap-2 mb-8">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* HOOKS */}
            {activeTab === "hooks" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-foreground font-black text-xl">Scroll-Stopping Hooks</h2>
                  <Badge className="bg-primary text-white font-bold">{ads.hooks?.length || 0} hooks</Badge>
                </div>
                {ads.hooks?.map((hook, i) => {
                  const type = getHookType(i);
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${hookTypes[type]} flex items-start justify-between gap-3`}>
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-muted-foreground font-bold text-sm mt-1 w-5 flex-shrink-0">{i + 1}</span>
                        <div>
                          <Badge className={`text-sm mb-2 border ${hookTypes[type]}`}>{type}</Badge>
                          <p className="text-foreground font-semibold">{hook}</p>
                        </div>
                      </div>
                      <CopyBtn text={hook} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* SCRIPT */}
            {activeTab === "script" && ads.script && (
              <div className="space-y-4">
                <h2 className="text-foreground font-black text-xl mb-4">15–30 Second Video Script</h2>
                {[
                  { key: "hook", label: "🎯 Hook (0–3 sec)", color: "border-amber-300 bg-amber-50", badge: "text-amber-600" },
                  { key: "problem", label: "😤 Problem (3–7 sec)", color: "border-rose-300 bg-rose-50", badge: "text-rose-600" },
                  { key: "solution", label: "💡 Solution (7–15 sec)", color: "border-blue-300 bg-blue-50", badge: "text-blue-600" },
                  { key: "cta", label: "🚀 CTA (15–30 sec)", color: "border-emerald-300 bg-emerald-50", badge: "text-emerald-600" },
                ].map(({ key, label, color, badge }) => (
                  <div key={key} className={`p-5 rounded-xl border ${color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`font-bold text-sm ${badge}`}>{label}</p>
                      <CopyBtn text={ads.script[key]} />
                    </div>
                    <p className="text-foreground font-semibold text-base leading-relaxed">"{ads.script[key]}"</p>
                  </div>
                ))}

                {/* Funnel Connection */}
                {ads.funnel_connection && (
                  <div className="mt-6 p-5 rounded-xl border border-purple-300 bg-purple-50">
                    <p className="text-purple-600 font-black text-sm mb-4">👉 THIS AD CONNECTS TO YOUR FUNNEL LIKE THIS</p>
                    <div className="space-y-3">
                      {[
                        { label: "Hook → Landing Page Headline", value: ads.funnel_connection.hook_maps_to },
                        { label: "Problem → Funnel Section 1", value: ads.funnel_connection.problem_maps_to },
                        { label: "CTA → Button Text", value: ads.funnel_connection.cta_maps_to },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-start gap-3">
                          <span className="text-purple-600 font-bold text-sm mt-1 w-40 flex-shrink-0">{label}</span>
                          <p className="text-muted-foreground text-sm">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ON-SCREEN TEXT */}
            {activeTab === "onscreen" && ads.onscreen_text && (
              <div className="space-y-5">
                <h2 className="text-foreground font-black text-xl mb-4">On-Screen Text & Captions</h2>
                <div className="p-6 rounded-xl border border-primary/30 bg-foreground text-center">
                  <p className="text-primary text-sm font-bold mb-3 uppercase tracking-widest">Big Bold Hook Text</p>
                  <p className="text-white font-black text-3xl md:text-4xl leading-tight">{ads.onscreen_text.headline}</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                  <p className="text-muted-foreground text-sm font-bold mb-3 uppercase tracking-widest">Key Subtitle Points</p>
                  <div className="space-y-2">
                    {ads.onscreen_text.key_points?.map((pt, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                        <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-black flex-shrink-0">{i + 1}</span>
                        <p className="text-foreground font-semibold">{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-emerald-300 bg-emerald-50 text-center">
                  <p className="text-emerald-600 text-sm font-bold mb-2 uppercase tracking-widest">Outcome Highlight</p>
                  <p className="text-foreground font-black text-xl">{ads.onscreen_text.outcome_highlight}</p>
                </div>
              </div>
            )}

            {/* VISUAL DIRECTION */}
            {activeTab === "visual" && ads.visual_direction && (
              <div className="space-y-5">
                <h2 className="text-foreground font-black text-xl mb-4">Visual Direction</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl border border-blue-300 bg-blue-50">
                    <p className="text-blue-600 text-sm font-bold mb-2 uppercase">Film Style</p>
                    <p className="text-foreground font-black text-lg capitalize">{ads.visual_direction.style}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-purple-300 bg-purple-50">
                    <p className="text-purple-600 text-sm font-bold mb-2 uppercase">Setting</p>
                    <p className="text-foreground font-semibold">{ads.visual_direction.setting}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-orange-300 bg-orange-50">
                    <p className="text-orange-600 text-sm font-bold mb-2 uppercase">Wardrobe</p>
                    <p className="text-foreground font-semibold">{ads.visual_direction.wardrobe}</p>
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                  <p className="text-muted-foreground text-sm font-bold mb-3 uppercase">Filming Tips</p>
                  <div className="space-y-2">
                    {ads.visual_direction.tips?.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-primary font-black">→</span>
                        <p className="text-muted-foreground">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* EDITING STYLE */}
            {activeTab === "editing" && ads.editing_style && (
              <div className="space-y-4">
                <h2 className="text-foreground font-black text-xl mb-4">Editing Style Directives</h2>
                <p className="text-muted-foreground text-sm mb-4">Send these to your editor or use them as a checklist when editing yourself.</p>
                {ads.editing_style.map((directive, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">{i + 1}</span>
                    <p className="text-foreground font-semibold flex-1">{directive}</p>
                    <CopyBtn text={directive} />
                  </div>
                ))}
              </div>
            )}

            {/* VIDEO AD */}
            {activeTab === "video" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-foreground font-black text-xl mb-1">Turn This Script Into a Video Ad</h2>
                    <p className="text-muted-foreground text-sm">One vertical 15-second ad (Hook → Problem → Solution → CTA) with voice, ready for TikTok, Reels and Shorts.</p>
                  </div>
                  {videoInfo?.enabled && (
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2">
                      <Coins className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold text-foreground">
                        {videoInfo.unlimited ? "Admin: unlimited videos" : `${videoInfo.balance} video credit${videoInfo.balance === 1 ? "" : "s"}`}
                      </span>
                    </div>
                  )}
                </div>

                {videoNotice && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">{videoNotice}</p>}
                {videoError && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg p-3">{videoError}</p>}

                {videoInfo && !videoInfo.enabled ? (
                  <div className="p-6 rounded-xl border border-dashed border-border bg-card text-center">
                    <Film className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="text-foreground font-semibold mb-1">Video ads are coming soon</p>
                    <p className="text-muted-foreground text-sm">Your scripts, hooks and visual direction are ready to use in any video tool in the meantime.</p>
                  </div>
                ) : (
                  <>
                    {videoInfo && !videoInfo.unlimited && videoInfo.balance < 1 && (
                      <div className="p-5 rounded-xl border border-primary/30 bg-card">
                        <p className="text-foreground font-bold mb-1">Get video credits</p>
                        <p className="text-muted-foreground text-sm mb-4">1 credit = 1 finished video ad. Credits never expire. If a video fails, the credit comes back automatically.</p>
                        <div className="grid sm:grid-cols-3 gap-3">
                          {(videoInfo.packs || []).map((pack) => (
                            <div key={pack.key} className={`rounded-xl border p-4 flex flex-col ${pack.key === "creator" ? "border-primary" : "border-border"}`}>
                              <p className="font-bold text-foreground">{pack.name}</p>
                              <p className="text-2xl font-black text-foreground mt-1">{pack.price}</p>
                              <p className="text-muted-foreground text-sm mt-1 flex-1">{pack.blurb}</p>
                              <Button className="mt-3 accent-gradient text-white font-bold" disabled={Boolean(buyingPack) || !videoInfo.billing} onClick={() => buyPack(pack.key)}>
                                {buyingPack === pack.key && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Buy {pack.credits} credits
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-5 rounded-xl border border-border bg-card">
                      <p className="text-foreground font-bold text-sm mb-1">🧑 Who's in the ad?</p>
                      <p className="text-muted-foreground text-sm mb-3">Describe the person once. The whole ad is filmed as one video, so they stay the same from start to finish.</p>
                      <textarea
                        value={characterDesc}
                        onChange={(e) => setCharacterDesc(e.target.value)}
                        placeholder="e.g. A 30-year-old woman with shoulder-length dark brown hair, wearing a cream sweater, sitting at a kitchen counter"
                        className="w-full bg-secondary border border-border text-foreground rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 min-h-[80px]"
                      />
                      <div className="flex flex-wrap gap-2 mt-3">
                        {[
                          "A 28-year-old woman with long blonde hair, wearing a white t-shirt, standing in a bright home office",
                          "A 35-year-old man with short dark hair and stubble, wearing a navy polo, sitting on a couch",
                          "A 40-year-old woman with curly black hair, wearing a blazer, standing in a modern kitchen",
                        ].map((preset) => (
                          <button key={preset} onClick={() => setCharacterDesc(preset)}
                            className="text-sm px-3 py-1.5 rounded-lg border border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                            {preset.split(",")[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isGeneratingVideo && (
                      <div className="p-6 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-3 mb-2">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          <p className="text-foreground font-bold">{videoProgress || "Starting…"}</p>
                        </div>
                        <p className="text-muted-foreground text-sm">Keep this page open, or come back later — finished videos are saved under Your videos.</p>
                      </div>
                    )}

                    {videoJob?.status === "done" && videoJob.video_url && (
                      <div className="space-y-3">
                        <div className="rounded-xl overflow-hidden border border-border bg-black flex justify-center">
                          <video key={videoJob.video_url} src={videoJob.video_url} controls autoPlay playsInline className="max-h-[70vh] mx-auto" />
                        </div>
                        <a href={videoJob.video_url} download="video-ad.mp4" target="_blank" rel="noreferrer" className="text-primary text-sm font-semibold inline-flex items-center gap-1">
                          <Download className="w-4 h-4" /> Download MP4
                        </a>
                      </div>
                    )}

                    {!isGeneratingVideo && (videoInfo?.unlimited || (videoInfo?.balance ?? 0) > 0) && (
                      <Button onClick={generateVideoAd} className="accent-gradient hover:opacity-90 text-white font-bold px-8 py-3 rounded-xl">
                        {videoJob?.status === "done" ? <RefreshCw className="w-4 h-4 mr-2" /> : <Film className="w-4 h-4 mr-2" />}
                        {videoJob?.status === "done" ? "Make Another Version (1 credit)" : `Generate Video Ad${videoInfo?.unlimited ? "" : " (1 credit)"}`}
                      </Button>
                    )}

                    {(videoInfo?.recent || []).filter((v) => v.status === "done" && v.video_url).length > 0 && (
                      <div>
                        <p className="text-foreground font-bold text-sm mb-2">Your videos</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {videoInfo.recent.filter((v) => v.status === "done" && v.video_url).map((v) => (
                            <button key={v.id} onClick={() => setVideoJob(v)} className="rounded-xl border border-border bg-card p-2 text-left hover:border-primary/40">
                              <video src={v.video_url} muted playsInline preload="metadata" className="w-full aspect-[9/16] object-cover rounded-lg bg-black" />
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{v.title || "Video ad"}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {videoInfo && !videoInfo.unlimited && videoInfo.balance > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Need more? {(videoInfo.packs || []).map((pack, i) => (
                          <button key={pack.key} onClick={() => buyPack(pack.key)} disabled={Boolean(buyingPack)} className="text-primary font-semibold underline mx-1">
                            {pack.credits} for {pack.price}{i < videoInfo.packs.length - 1 ? "," : ""}
                          </button>
                        ))}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* PERFORMANCE */}
            {activeTab === "performance" && (
              <div className="space-y-6">
                <h2 className="text-foreground font-black text-xl mb-2">Performance Analyzer</h2>
                <p className="text-muted-foreground text-sm mb-4">Enter your current ad metrics and get a blunt diagnosis + fix.</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { key: "views", label: "👀 Views", placeholder: "e.g. 10000" },
                    { key: "ctr", label: "🖱️ CTR (%)", placeholder: "e.g. 1.2" },
                    { key: "conversions", label: "💰 Conversions", placeholder: "e.g. 3" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="text-muted-foreground text-sm font-bold uppercase block mb-2">{label}</label>
                      <input
                        type="number"
                        value={perf[key]}
                        onChange={e => setPerf({ ...perf, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  onClick={analyzePerformance}
                  disabled={isAnalyzing || !perf.views}
                  className="accent-gradient hover:opacity-90 text-white font-black px-8 py-3 rounded-xl"
                >
                  {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : "Diagnose My Ad"}
                </Button>

                {perfFeedback && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl border border-rose-300 bg-rose-50">
                      <p className="text-rose-600 font-black mb-3">Overall Diagnosis</p>
                      <p className="text-foreground">{perfFeedback.overall_diagnosis}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className={`p-5 rounded-xl border ${perfFeedback.hook_verdict === "strong" ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-muted-foreground text-sm font-bold uppercase">Hook</p>
                          <Badge className={perfFeedback.hook_verdict === "strong" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}>{perfFeedback.hook_verdict}</Badge>
                        </div>
                        {perfFeedback.hook_fix && <p className="text-primary font-semibold text-sm mt-2">Try instead: "{perfFeedback.hook_fix}"</p>}
                      </div>
                      <div className={`p-5 rounded-xl border ${perfFeedback.cta_verdict === "clear" ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-muted-foreground text-sm font-bold uppercase">CTA</p>
                          <Badge className={perfFeedback.cta_verdict === "clear" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}>{perfFeedback.cta_verdict}</Badge>
                        </div>
                        {perfFeedback.cta_fix && <p className="text-primary font-semibold text-sm mt-2">Try instead: "{perfFeedback.cta_fix}"</p>}
                      </div>
                    </div>
                    <div className="p-5 rounded-xl border border-primary/30 bg-primary/5">
                      <p className="text-primary font-black mb-2">⚡ Top Fix Right Now</p>
                      <p className="text-foreground font-semibold">{perfFeedback.top_fix}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}