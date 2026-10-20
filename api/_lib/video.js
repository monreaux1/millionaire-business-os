// AI video ads: credit packs (one-time Stripe purchases), a credit ledger,
// and video generation through fal.ai's queue API.
import { adminDb, getAdmin, HttpError } from "./server.js";
import { isAdminUser } from "./billing.js";

// 1 credit = 1 finished video ad (up to 15 seconds, vertical, with audio).
// Edit these to change pack sizes or prices — no Stripe setup needed.
export const CREDIT_PACKS = [
  { key: "starter", name: "Starter", credits: 5, price_cents: 1900, blurb: "5 video ads" },
  { key: "creator", name: "Creator", credits: 15, price_cents: 4900, blurb: "15 video ads — best value for weekly testing" },
  { key: "agency", name: "Agency", credits: 40, price_cents: 11900, blurb: "40 video ads for client work" },
];

export const DEFAULT_VIDEO_MODEL = "fal-ai/kling-video/v3/standard/text-to-video";
export const videoModel = () => (process.env.VIDEO_MODEL || DEFAULT_VIDEO_MODEL).trim();
export const videoEnabled = () => Boolean(process.env.FAL_KEY);

const packView = (p) => ({ key: p.key, name: p.name, credits: p.credits, price: `$${(p.price_cents / 100).toFixed(0)}`, blurb: p.blurb });
export const publicPacks = () => CREDIT_PACKS.map(packView);
export const packFor = (key) => CREDIT_PACKS.find((p) => p.key === key) || null;

// ── Credits ledger ────────────────────────────────────────────────────────
export async function creditBalance(userId) {
  const rows = await adminDb().VideoCredit.filter({ created_by_id: userId }, "-created_date", 5000);
  return rows.reduce((sum, row) => sum + (Number(row.delta) || 0), 0);
}

async function ownerFor(userId) {
  try {
    const { data } = await getAdmin().auth.admin.getUserById(userId);
    return { id: userId, email: data?.user?.email || "" };
  } catch {
    return { id: userId, email: "" };
  }
}

export async function addCredits(userId, delta, details = {}) {
  return adminDb().VideoCredit.create({ delta, ...details }, { as: await ownerFor(userId) });
}

// Records a paid Checkout once (webhook and return page may both call this).
export async function grantPurchase(session) {
  if (session?.metadata?.kind !== "video_credits" || session.payment_status !== "paid") return null;
  const userId = session.metadata.user_id || session.client_reference_id;
  const pack = packFor(session.metadata.pack);
  if (!userId || !pack) return null;
  const existing = await adminDb().VideoCredit.filter({ stripe_session_id: session.id }, "-created_date", 1);
  if (existing.length) return existing[0];
  try {
    return await addCredits(userId, pack.credits, { reason: "purchase", pack: pack.key, stripe_session_id: session.id });
  } catch (error) {
    // Unique index: a parallel call already granted it.
    if (/duplicate|unique/i.test(String(error?.message))) return null;
    throw error;
  }
}

export async function requireCredit(user) {
  if (isAdminUser(user)) return { free: true };
  const balance = await creditBalance(user.id);
  if (balance < 1) throw new HttpError(402, "You're out of video credits. Buy a credit pack to make more video ads.");
  return { free: false, balance };
}

// ── fal.ai queue ──────────────────────────────────────────────────────────
const FAL_QUEUE = "https://queue.fal.run";
const falHeaders = () => ({ Authorization: `Key ${String(process.env.FAL_KEY || "").trim()}`, "Content-Type": "application/json" });

async function falFetch(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...falHeaders(), ...(init.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 202) {
    const detail = String(data?.detail?.[0]?.msg || data?.detail || data?.error || `HTTP ${res.status}`).slice(0, 200);
    console.error("fal error", res.status, detail);
    if (res.status === 401 || res.status === 403) throw new HttpError(500, "The video service key is invalid. Update FAL_KEY in Vercel.");
    if (/balance|credit|billing|payment|exhausted/i.test(detail)) throw new HttpError(503, "Video generation is paused right now. Please try again later.");
    throw new HttpError(502, `The video service couldn't start this video. (${detail})`);
  }
  return data;
}

// Sends the ad as one multi-shot video so the same person carries through.
export async function submitVideo({ shots, prompt, duration = 15, aspectRatio = "9:16" }) {
  const input = { aspect_ratio: aspectRatio, generate_audio: true, negative_prompt: "blur, distort, low quality, text artifacts, extra fingers" };
  if (Array.isArray(shots) && shots.length) {
    input.multi_prompt = shots.map((s) => ({ prompt: s.prompt, duration: String(s.duration) }));
  } else {
    input.prompt = prompt;
    input.duration = String(duration);
  }
  const data = await falFetch(`${FAL_QUEUE}/${videoModel()}`, { method: "POST", body: JSON.stringify(input) });
  if (!data.request_id) throw new HttpError(502, "The video service didn't return a job id.");
  const base = `${FAL_QUEUE}/${videoModel()}/requests/${data.request_id}`;
  return {
    request_id: data.request_id,
    status_url: data.status_url || `${base}/status`,
    response_url: data.response_url || base,
  };
}

const allowedFalUrl = (url) => /^https:\/\/queue\.fal\.run\//.test(String(url || ""));

export async function checkVideo(job) {
  if (!allowedFalUrl(job.status_url) || !allowedFalUrl(job.response_url)) throw new HttpError(400, "Invalid video job.");
  const status = await falFetch(job.status_url);
  const state = String(status.status || "").toUpperCase();
  if (state === "COMPLETED") {
    const result = await fetch(job.response_url, { headers: falHeaders() });
    const data = await result.json().catch(() => ({}));
    const url = data?.video?.url;
    if (!result.ok || !url) {
      return { state: "failed", error: String(data?.detail?.[0]?.msg || data?.detail || "The video couldn't be generated. Try rewording the script.").slice(0, 300) };
    }
    return { state: "done", url };
  }
  if (state === "IN_QUEUE") return { state: "queued", position: status.queue_position ?? null };
  if (state === "IN_PROGRESS") return { state: "running" };
  return { state: "failed", error: String(status.error || "The video service stopped this video.").slice(0, 300) };
}

// Copies the finished video into our storage so links don't expire.
export async function keepVideo(userId, jobId, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 45 * 1024 * 1024) return url;
    const path = `${userId}/videos/${jobId}.mp4`;
    const storage = getAdmin().storage.from("uploads");
    const { error } = await storage.upload(path, bytes, { contentType: "video/mp4", upsert: true });
    if (error) return url;
    return storage.getPublicUrl(path).data.publicUrl || url;
  } catch {
    return url;
  }
}
