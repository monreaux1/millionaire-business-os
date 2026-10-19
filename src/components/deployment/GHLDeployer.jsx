import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Loader2, Key, Zap, Tag, GitBranch, Mail } from "lucide-react";
import { ghlDeploy } from "@/functions/ghlDeploy";
import { accountStorage } from "@/lib/account-storage";

function StatusRow({ label, status, detail }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary">
      {status === "pending" && <div className="w-4 h-4 mt-0.5 rounded-full border-2 border-muted-foreground flex-shrink-0" />}
      {status === "loading" && <Loader2 className="w-4 h-4 mt-0.5 text-primary animate-spin flex-shrink-0" />}
      {status === "done" && <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />}
      {status === "error" && <XCircle className="w-4 h-4 mt-0.5 text-rose-600 flex-shrink-0" />}
      {status === "skipped" && <div className="w-4 h-4 mt-0.5 rounded-full border-2 border-muted flex-shrink-0" />}
      <div>
        <p className={`text-sm font-semibold ${status === "done" ? "text-emerald-600" : status === "error" ? "text-rose-600" : "text-foreground"}`}>{label}</p>
        {detail && <p className="text-sm text-muted-foreground mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

const errorMessage = (e, fallback) =>
  e?.data?.error || e?.response?.data?.error || e?.message || fallback;

export default function GHLDeployer({ data }) {
  const [locationId, setLocationId] = useState(() => accountStorage.getItem("ghl_location_id") || "");
  const [apiKey, setApiKey] = useState("");
  const [verified, setVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [keyHint, setKeyHint] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [steps, setSteps] = useState([]);
  const [done, setDone] = useState(false);

  // Load this customer's saved GHL connection (stored server-side, never in the browser).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ghlDeploy({ action: "status" });
        if (cancelled) return;
        if (res.data?.connected) {
          setVerified(true);
          setLocationId(res.data.locationId || "");
          setLocationName(res.data.locationName || "Your Location");
          setKeyHint(res.data.keyHint || "");
        }
      } catch { /* not connected yet */ }
      if (!cancelled) setCheckingStatus(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function disconnect() {
    setVerifyError("");
    try {
      await ghlDeploy({ action: "disconnect" });
    } catch (e) {
      setVerifyError(errorMessage(e, "Could not disconnect"));
      return;
    }
    setVerified(false);
    setLocationName("");
    setKeyHint("");
    setApiKey("");
    setSteps([]);
    setDone(false);
  }

  const offerName = data?.offer_ladder?.high_ticket?.name || data?.funnel_map?.steps?.[0]?.page || "My Offer";
  const emails = data?.email_sequence || data?.nurture_sequence || [];

  const TAGS = ["lead", "prospect", "buyer", "opted-in", "no-show", "hot-lead", "cold-lead"];
  const STAGES = ["New Lead", "Opted In", "Application Sent", "Call Booked", "Proposal Sent", "Closed Won", "Closed Lost"];

  async function verify() {
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await ghlDeploy({ action: "connect", apiKey: apiKey.trim(), locationId: locationId.trim() });
      if (res.data?.success) {
        setVerified(true);
        setLocationName(res.data.locationName || "Your Location");
        setKeyHint(res.data.keyHint || "");
        setApiKey("");
        accountStorage.setItem("ghl_location_id", locationId.trim());
      } else {
        setVerifyError(res.data?.error || "Verification failed");
      }
    } catch (e) {
      setVerifyError(errorMessage(e, "Could not connect to GHL"));
    }
    setVerifying(false);
  }

  function setStep(id, status, detail) {
    setSteps(prev => {
      const existing = prev.find(s => s.id === id);
      if (existing) return prev.map(s => s.id === id ? { ...s, status, detail } : s);
      return [...prev, { id, status, detail }];
    });
  }

  async function deploy() {
    setDeploying(true);
    setDone(false);
    setSteps([]);

    setStep("🏷️ Creating Contact Tags", "loading");
    try {
      const res = await ghlDeploy({ action: "create_tags", locationId, payload: { tags: TAGS } });
      const created = res.data?.results?.filter(r => r.status === "created").length || 0;
      setStep("🏷️ Creating Contact Tags", "done", `${created} new tags added (${TAGS.length - created} already existed)`);
    } catch (e) {
      setStep("🏷️ Creating Contact Tags", "error", errorMessage(e, "Failed"));
    }

    setStep("🔀 Creating Sales Pipeline", "loading");
    try {
      await ghlDeploy({ action: "create_pipeline", locationId, payload: { pipelineName: `${offerName} Pipeline`, stages: STAGES } });
      setStep("🔀 Creating Sales Pipeline", "done", `"${offerName} Pipeline" with ${STAGES.length} stages`);
    } catch (e) {
      setStep("🔀 Creating Sales Pipeline", "error", errorMessage(e, "Failed"));
    }

    if (emails.length > 0) {
      setStep("📧 Uploading Email Templates", "loading");
      try {
        const emailPayload = emails.map((e, i) => ({
          subject: e.subject || `Email ${i + 1}: ${offerName}`,
          body: e.body || e.content || JSON.stringify(e),
        }));
        const res = await ghlDeploy({ action: "create_emails", locationId, payload: { emails: emailPayload } });
        const created = res.data?.results?.filter(r => r.status === "created").length || 0;
        setStep("📧 Uploading Email Templates", "done", `${created}/${emailPayload.length} email templates created`);
      } catch (e) {
        setStep("📧 Uploading Email Templates", "error", errorMessage(e, "Failed"));
      }
    } else {
      setStep("📧 Uploading Email Templates", "skipped", "No email sequence found — generate one in Offer Builder first");
    }

    setStep("⚡ Workflow Trigger Tag", "loading");
    try {
      const res = await ghlDeploy({ action: "create_workflow_tags", locationId, payload: { workflowName: `${offerName} Nurture`, triggerTag: "opted-in" } });
      setStep("⚡ Workflow Trigger Tag", "done", res.data?.note || "Trigger tag ready");
    } catch (e) {
      setStep("⚡ Workflow Trigger Tag", "error", errorMessage(e, "Failed"));
    }

    setDone(true);
    setDeploying(false);
  }

  return (
    <div className="space-y-6">
      <div className="light-card rounded-2xl border border-orange-300/50 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <Key className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h3 className="text-foreground font-bold">GHL API Credentials</h3>
            <p className="text-muted-foreground text-sm">Settings → API Keys → Private Integrations in your GHL account</p>
          </div>
        </div>

        {!verified && (
          <>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 mb-4 text-sm text-orange-700">
              <span className="font-bold">🔐 Your own account:</span> In your GHL sub-account go to Settings → Private Integrations → Create new integration. Give it the Tags, Opportunities and Email Templates scopes, then paste the token below. It's saved privately to your account only.
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Private Integration Token</label>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder="pit-xxxxxxxx-xxxx-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="bg-card border-border font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Location ID (Sub-Account ID)</label>
                <Input
                  placeholder="abc123xyz..."
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  className="bg-card border-border font-mono text-sm"
                />
              </div>
            </div>
          </>
        )}

        {verifyError && (
          <div className="flex items-center gap-2 text-rose-600 text-sm mb-3 p-3 bg-rose-50 rounded-xl">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {verifyError}
          </div>
        )}

        {checkingStatus ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm p-3">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking your GHL connection…
          </div>
        ) : verified ? (
          <div className="flex items-center justify-between gap-2 text-emerald-600 text-sm p-3 bg-emerald-50 rounded-xl">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Connected to <span className="font-bold">{locationName}</span>
              {keyHint && <span className="text-muted-foreground font-mono">({keyHint})</span>}
            </span>
            <button type="button" onClick={disconnect} className="text-sm text-muted-foreground underline hover:text-foreground">
              Disconnect
            </button>
          </div>
        ) : (
          <Button onClick={verify} disabled={!locationId.trim() || !apiKey.trim() || verifying}
            variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 w-full">
            {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
            {verifying ? "Verifying..." : "Verify & Save Connection"}
          </Button>
        )}
      </div>

      {verified && (
        <div className="light-card rounded-2xl border border-border p-6">
          <h3 className="text-foreground font-bold mb-4">What Will Be Deployed</h3>
          <div className="grid md:grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-secondary flex items-center gap-3">
              <Tag className="w-4 h-4 text-primary" />
              <div>
                <p className="text-foreground text-sm font-semibold">{TAGS.length} Contact Tags</p>
                <p className="text-muted-foreground text-sm">{TAGS.join(", ")}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-secondary flex items-center gap-3">
              <GitBranch className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-foreground text-sm font-semibold">{STAGES.length}-Stage Pipeline</p>
                <p className="text-muted-foreground text-sm">"{offerName} Pipeline"</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-secondary flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-foreground text-sm font-semibold">{emails.length > 0 ? `${emails.length} Email Templates` : "Email Templates"}</p>
                <p className="text-muted-foreground text-sm">{emails.length > 0 ? "From your generated sequence" : "Generate in Offer Builder first"}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-secondary flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-foreground text-sm font-semibold">Workflow Trigger Tag</p>
                <p className="text-muted-foreground text-sm">Auto-fires nurture on opt-in</p>
              </div>
            </div>
          </div>

          <Button onClick={deploy} disabled={deploying || done}
            className="w-full accent-gradient text-white font-black py-3 text-base h-auto">
            {deploying ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
            {deploying ? "Deploying to GHL..." : done ? "✅ Deployed Successfully!" : "Deploy Everything to GoHighLevel"}
          </Button>
        </div>
      )}

      {steps.length > 0 && (
        <div className="light-card rounded-2xl border border-border p-6">
          <h3 className="text-foreground font-bold mb-4">Deployment Progress</h3>
          <div className="space-y-2">
            {steps.map(s => (
              <StatusRow key={s.id} label={s.id} status={s.status} detail={s.detail} />
            ))}
          </div>
          {done && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-emerald-600 font-bold text-lg">🎉 Deployment complete!</p>
              <p className="text-muted-foreground text-sm mt-1">Go to GHL → Automations → link your email templates to the <strong className="text-foreground">"opted-in"</strong> trigger tag to activate your nurture sequence.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}