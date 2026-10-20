// Video ads API (one function for every action, to stay within plan limits).
//   POST /api/video/credits  → { enabled, balance, unlimited, packs, recent }
//   POST /api/video/buy      → { url }  (Stripe Checkout for a credit pack)
//   POST /api/video/confirm  → { added, balance }  (after returning from Stripe)
//   POST /api/video/start    → { job }  (uses 1 credit)
//   POST /api/video/status   → { job }  (poll until done/failed)
import { postHandler, requireUser, adminDb, HttpError } from "../_lib/server.js";
import { getStripe, appOrigin, requireActiveSubscription, isAdminUser, billingEnabled } from "../_lib/billing.js";
import {
  videoEnabled, publicPacks, packFor, creditBalance, addCredits, grantPurchase,
  requireCredit, submitVideo, checkVideo, keepVideo, ensureWelcomeCredit, ownUploadUrl, videoProvider,
} from "../_lib/video.js";

export const config = { maxDuration: 120 };

const jobView = (job) => ({
  id: job.id,
  status: job.status,
  title: job.title || "",
  video_url: job.video_url || "",
  error: job.error || "",
  created_date: job.created_date,
});

const clip = (value, max) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

async function credits(user) {
  let recent = [];
  let balance = 0;
  let ready = true;
  let welcomed = false;
  try {
    if (videoEnabled()) welcomed = await ensureWelcomeCredit(user);
    recent = await adminDb().VideoJob.filter({ created_by_id: user.id }, "-created_date", 12);
    balance = await creditBalance(user.id);
  } catch (error) {
    // Tables missing until 003_video.sql is run: show "coming soon" instead of an error.
    console.error("video tables unavailable", error?.message);
    ready = false;
  }
  return {
    enabled: videoEnabled() && ready,
    billing: billingEnabled(),
    unlimited: isAdminUser(user),
    balance,
    welcomed,
    packs: publicPacks(),
    recent: recent.map(jobView),
  };
}

async function buy(req, user, body) {
  const pack = packFor(String(body.pack || ""));
  if (!pack) throw new HttpError(400, "That credit pack isn't available.");
  if (!billingEnabled()) throw new HttpError(503, "Payments aren't switched on yet.");
  const origin = appOrigin(req);
  const back = String(body.return_to || "/AdEngine").startsWith("/") ? String(body.return_to || "/AdEngine") : "/AdEngine";
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: pack.price_cents,
        product_data: { name: `Video ad credits — ${pack.name} (${pack.credits})`, description: `${pack.credits} AI video ads for Millionaire Business OS` },
      },
    }],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { kind: "video_credits", user_id: user.id, pack: pack.key },
    payment_intent_data: { metadata: { kind: "video_credits", user_id: user.id, pack: pack.key } },
    success_url: `${origin}${back}?credits=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${back}?credits=canceled`,
  });
  return { url: session.url };
}

async function confirm(user, body) {
  const sessionId = String(body.session_id || "");
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new HttpError(400, "Invalid checkout session.");
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== user.id) throw new HttpError(403, "This checkout belongs to another account.");
  const granted = await grantPurchase(session);
  return { added: Boolean(granted), paid: session.payment_status === "paid", balance: await creditBalance(user.id) };
}

async function start(user, body) {
  if (!videoEnabled()) throw new HttpError(503, "Video ads aren't switched on yet.");
  await requireActiveSubscription(user);
  await ensureWelcomeCredit(user);
  const { free } = await requireCredit(user);

  // Optional reference photos: the member, their product, or both. They must
  // confirm they own them / have permission before the photos are used.
  const legacyKind = body.photo_kind === "product" ? "product" : "person";
  const personPhoto = ownUploadUrl(user, body.person_photo || (legacyKind === "person" ? body.image_url : ""));
  const productPhoto = ownUploadUrl(user, body.product_photo || (legacyKind === "product" ? body.image_url : ""));
  if ((personPhoto || productPhoto) && body.photo_consent !== true) {
    throw new HttpError(400, "Confirm the photo is you or your product (or that you have permission) to use it.");
  }
  const both = Boolean(personPhoto && productPhoto);
  // kie can lock both the person and the product as named "elements" referenced
  // in every shot; otherwise one photo is used as the opening frame.
  const useElements = both && videoProvider() === "kie";
  const elements = useElements
    ? [
        { name: "presenter", description: "the person presenting the ad", element_input_urls: [personPhoto, personPhoto] },
        { name: "product", description: "the product being advertised", element_input_urls: [productPhoto, productPhoto] },
      ]
    : [];
  const imageUrl = useElements ? "" : personPhoto || productPhoto;
  const who = useElements ? "@presenter, holding and showing @product," : "The person";

  // Shots carry the spoken line; the shared look ("style") is added to each.
  // The line goes first so it survives per-shot length limits.
  // "Talking head" is ad jargon that video models take literally (they draw an
  // extra head), so it is rewritten, and every shot gets the same guardrails.
  const photoLine = [
    personPhoto && !useElements ? " The person must look exactly like the person in the reference photo: same face, hair, skin tone and clothing." : "",
    productPhoto && !useElements ? " Feature the exact product shown in the reference photo; keep its look, colors and packaging unchanged." : "",
    useElements ? " Keep the presenter's face and the product's look and packaging exactly as in their photos." : "",
  ].join("");
  const textRule = productPhoto ? "no on-screen text overlays" : "not holding any cards, papers or signs, no written words anywhere in the scene";
  const style = clip(`${String(body.style || "").replace(/talking[\s-]*heads?/gi, "one person speaking directly to the camera, framed from the chest up")} Exactly one person in frame, realistic human anatomy, no reflections of the person, ${textRule}.${photoLine}`, 1000);
  const shots = (Array.isArray(body.shots) ? body.shots : [])
    .slice(0, 6)
    .map((s) => ({
      prompt: s.line
        ? clip(`${who} says to camera: "${clip(s.line, 300)}". ${style}`, 1500)
        : clip(String(s.prompt || "").replace(/talking[\s-]*heads?/gi, "one person speaking to the camera"), 1500),
      duration: Math.min(15, Math.max(1, Math.round(Number(s.duration) || 3))),
    }))
    .filter((s) => s.prompt);
  // Total length is capped at 15 seconds.
  let total = 0;
  const fitted = [];
  for (const s of shots) {
    if (total >= 15) break;
    const duration = Math.min(s.duration, 15 - total);
    fitted.push({ ...s, duration });
    total += duration;
  }
  const prompt = clip(body.prompt, 2500);
  if (!fitted.length && !prompt) throw new HttpError(400, "Write the ad script first.");

  // Admins can make landscape/square videos (e.g. website headers); members get vertical ads.
  const aspectRatio = isAdminUser(user) && ["16:9", "1:1"].includes(body.aspect_ratio) ? body.aspect_ratio : "9:16";
  const adminExtras = isAdminUser(user) ? { quality: body.quality === "pro" ? "pro" : "", sound: body.sound !== false } : {};
  const submitted = await submitVideo({ shots: fitted, prompt, duration: 15, imageUrl, elements, aspectRatio, ...adminExtras });
  const owner = { id: user.id, email: user.email };
  const job = await adminDb().VideoJob.create({
    status: "queued",
    provider: submitted.provider,
    model: submitted.model,
    title: clip(body.title, 120),
    request_id: submitted.request_id,
    status_url: submitted.status_url || "",
    response_url: submitted.response_url || "",
    seconds: total || 15,
    reference_photo: [personPhoto && "person", productPhoto && "product"].filter(Boolean).join("+"),
    charged: !free,
  }, { as: owner });
  if (!free) await addCredits(user.id, -1, { reason: "video", job_id: job.id });
  return { job: jobView(job) };
}

async function status(user, body) {
  const store = adminDb().VideoJob;
  const job = await store.get(String(body.job_id || "")).catch(() => null);
  if (!job || job.created_by_id !== user.id) throw new HttpError(404, "Video not found.");
  if (job.status === "done" || job.status === "failed") return { job: jobView(job) };

  const result = await checkVideo(job);
  if (result.state === "done") {
    const url = await keepVideo(user.id, job.id, result.url);
    return { job: jobView(await store.update(job.id, { status: "done", video_url: url })) };
  }
  if (result.state === "failed") {
    const updated = await store.update(job.id, { status: "failed", error: result.error });
    if (job.charged && !job.refunded) {
      await addCredits(user.id, 1, { reason: "refund", job_id: job.id });
      await store.update(job.id, { refunded: true });
    }
    return { job: jobView(updated), refunded: Boolean(job.charged) };
  }
  if (result.state !== job.status) await store.update(job.id, { status: result.state });
  return { job: { ...jobView(job), status: result.state, position: result.position ?? null } };
}

const handler = postHandler(async (req, body) => {
  const { user } = await requireUser(req);
  const action = String(req.query?.action || "");
  if (action === "credits") return credits(user);
  if (action === "buy") return buy(req, user, body);
  if (action === "confirm") return confirm(user, body);
  if (action === "start") return start(user, body);
  if (action === "status") return status(user, body);
  throw new HttpError(404, "Unknown video action.");
}, { name: "video" });

export default handler;
