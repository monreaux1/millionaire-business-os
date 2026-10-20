// AI video ads: credit packs (one-time Stripe purchases), a credit ledger,
// and video generation through kie.ai (KIE_KEY) or fal.ai (FAL_KEY).
import { adminDb, getAdmin, HttpError, supabaseUrl } from "./server.js";
import { isAdminUser, accessFor } from "./billing.js";

// 1 credit = 1 finished video ad (up to 15 seconds, vertical, with audio).
// Edit these to change pack sizes or prices — no Stripe setup needed.
export const CREDIT_PACKS = [
  { key: "starter", name: "Starter", credits: 5, price_cents: 1900, blurb: "5 video ads" },
  { key: "creator", name: "Creator", credits: 15, price_cents: 4900, blurb: "15 video ads — best value for weekly testing" },
  { key: "agency", name: "Agency", credits: 40, price_cents: 11900, blurb: "40 video ads for client work" },
];

const DEFAULT_MODELS = { kie: "kling-3.0/video", fal: "fal-ai/kling-video/v3/standard/text-to-video" };
// Which service makes the videos: VIDEO_PROVIDER, else whichever key is set (kie first).
export function videoProvider() {
  const forced = String(process.env.VIDEO_PROVIDER || "").trim().toLowerCase();
  if (forced === "kie" && process.env.KIE_KEY) return "kie";
  if (forced === "fal" && process.env.FAL_KEY) return "fal";
  if (process.env.KIE_KEY) return "kie";
  if (process.env.FAL_KEY) return "fal";
  return "";
}
export const videoModel = (provider = videoProvider()) => (process.env.VIDEO_MODEL || DEFAULT_MODELS[provider] || DEFAULT_MODELS.fal).trim();
export const videoEnabled = () => Boolean(videoProvider());

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

// Every member gets WELCOME_VIDEO_CREDITS free video(s) once (default 1), so they
// can see what video ads look like before buying a pack. 0 turns it off.
const welcomeCredits = () => {
  const n = Number(process.env.WELCOME_VIDEO_CREDITS ?? 1);
  return Number.isFinite(n) ? Math.max(0, Math.min(5, Math.floor(n))) : 1;
};
export async function ensureWelcomeCredit(user) {
  const amount = welcomeCredits();
  if (!amount || isAdminUser(user)) return false;
  const access = await accessFor(user);
  if (!access.active) return false;
  const existing = await adminDb().VideoCredit.filter({ created_by_id: user.id, reason: "welcome" }, "-created_date", 1);
  if (existing.length) return false;
  await addCredits(user.id, amount, { reason: "welcome", stripe_session_id: `welcome:${user.id}` });
  return true;
}

// Reference photos must be files this user uploaded to our storage.
export function ownUploadUrl(user, url) {
  const value = String(url || "").trim();
  if (!value) return "";
  const prefix = `${supabaseUrl()}/storage/v1/object/public/uploads/${user.id}/`;
  if (!value.startsWith(prefix) || !/\.(jpe?g|png|webp)$/i.test(value.split("?")[0])) {
    throw new HttpError(400, "Upload the reference photo again (JPG, PNG or WEBP).");
  }
  return value;
}

export async function requireCredit(user) {
  if (isAdminUser(user)) return { free: true };
  const balance = await creditBalance(user.id);
  if (balance < 1) throw new HttpError(402, "You're out of video credits. Buy a credit pack to make more video ads.");
  return { free: false, balance };
}

// ── fal.ai queue ──────────────────────────────────────────────────────────
const FAL_QUEUE = "https://queue.fal.run";
const falHeaders = () => ({ Authorization: `Key ${String(process.env.FAL_KEY || "").replace(/\s+/g, "")}`, "Content-Type": "application/json" });

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
async function submitFal({ shots, prompt, duration = 15, aspectRatio = "9:16", imageUrl = "" }) {
  const input = { aspect_ratio: aspectRatio, generate_audio: true, negative_prompt: "blur, distort, low quality, text artifacts, extra fingers" };
  if (Array.isArray(shots) && shots.length) {
    input.multi_prompt = shots.map((s) => ({ prompt: s.prompt, duration: String(s.duration) }));
  } else {
    input.prompt = prompt;
    input.duration = String(duration);
  }
  let model = videoModel("fal");
  if (imageUrl) {
    input.image_url = imageUrl;
    model = model.replace(/text-to-video$/, "image-to-video");
  }
  const data = await falFetch(`${FAL_QUEUE}/${model}`, { method: "POST", body: JSON.stringify(input) });
  if (!data.request_id) throw new HttpError(502, "The video service didn't return a job id.");
  const base = `${FAL_QUEUE}/${model}/requests/${data.request_id}`;
  return {
    provider: "fal",
    model,
    request_id: data.request_id,
    status_url: data.status_url || `${base}/status`,
    response_url: data.response_url || base,
  };
}

const allowedFalUrl = (url) => /^https:\/\/queue\.fal\.run\//.test(String(url || ""));

async function checkFal(job) {
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

// ── kie.ai ────────────────────────────────────────────────────────────────
const KIE_API = "https://api.kie.ai/api/v1/jobs";
const kieHeaders = () => ({ Authorization: `Bearer ${String(process.env.KIE_KEY || "").replace(/\s+/g, "")}`, "Content-Type": "application/json" });

// kie returns HTTP 200 with an error code in the body, so check `code`.
async function kieFetch(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...kieHeaders(), ...(init.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  const code = Number(data?.code ?? res.status);
  if (!res.ok || code !== 200) {
    const detail = String(data?.msg || data?.message || `HTTP ${res.status}`).slice(0, 200);
    console.error("kie error", res.status, code, detail);
    if (code === 401 || res.status === 401) throw new HttpError(500, "The video service key is invalid. Update KIE_KEY in Vercel.");
    if (code === 402 || /credit|balance|insufficient/i.test(detail)) throw new HttpError(503, "Video generation is paused right now. Please try again later.");
    if (code === 429) throw new HttpError(429, "The video service is busy. Please try again in a minute.");
    throw new HttpError(502, `The video service couldn't start this video. (${detail})`);
  }
  return data.data || {};
}

async function submitKie({ shots, prompt, duration = 15, aspectRatio = "9:16", imageUrl = "", elements = [], quality = "", sound = true }) {
  const model = videoModel("kie");
  const mode = ["std", "pro"].includes(quality) ? quality : ["std", "pro"].includes(process.env.VIDEO_MODE) ? process.env.VIDEO_MODE : "std";
  const input = { aspect_ratio: aspectRatio, sound: Boolean(sound), mode };
  // The reference photo becomes the opening frame (kie: image_urls[0]).
  if (imageUrl) input.image_urls = [imageUrl];
  // Named elements (person + product) referenced as @name inside the prompts.
  if (elements.length) input.kling_elements = elements.slice(0, 3);
  if (Array.isArray(shots) && shots.length) {
    // kie limits: 1–12 seconds and 500 characters per shot.
    input.multi_shots = true;
    input.multi_prompt = shots.map((s) => ({ prompt: String(s.prompt).slice(0, 500), duration: Math.min(12, Math.max(1, Number(s.duration) || 3)) }));
    input.duration = String(input.multi_prompt.reduce((sum, s) => sum + s.duration, 0));
  } else {
    input.multi_shots = false;
    input.prompt = String(prompt).slice(0, 2500);
    input.duration = String(Math.min(15, Math.max(3, Number(duration) || 15)));
  }
  const data = await kieFetch(`${KIE_API}/createTask`, { method: "POST", body: JSON.stringify({ model, input }) });
  if (!data.taskId) throw new HttpError(502, "The video service didn't return a job id.");
  return { provider: "kie", model, request_id: data.taskId };
}

async function checkKie(job) {
  if (!/^[\w.-]+$/.test(String(job.request_id || ""))) throw new HttpError(400, "Invalid video job.");
  const data = await kieFetch(`${KIE_API}/recordInfo?taskId=${encodeURIComponent(job.request_id)}`);
  const state = String(data.state || "").toLowerCase();
  if (state === "success") {
    let urls = [];
    try { urls = JSON.parse(data.resultJson || "{}").resultUrls || []; } catch { /* handled below */ }
    if (!urls[0]) return { state: "failed", error: "The video finished without a file. Please try again." };
    return { state: "done", url: urls[0] };
  }
  if (state === "fail") return { state: "failed", error: String(data.failMsg || "The video couldn't be generated. Try rewording the script.").slice(0, 300) };
  if (state === "generating") return { state: "running" };
  return { state: "queued", position: null };
}

// ── Provider switch ───────────────────────────────────────────────────────
export async function submitVideo(options) {
  const provider = videoProvider();
  if (provider === "kie") return submitKie(options);
  if (provider === "fal") return submitFal(options);
  throw new HttpError(503, "Video ads aren't switched on yet.");
}

export async function checkVideo(job) {
  return job.provider === "kie" ? checkKie(job) : checkFal(job);
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
