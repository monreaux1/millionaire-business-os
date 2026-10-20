// Stripe → database. Endpoint: https://YOUR-APP/api/billing/webhook
// Events: checkout.session.completed (plans + video credit packs),
//         customer.subscription.created/updated/deleted
import { sendJson } from "../_lib/server.js";
import { getStripe, upsertSubscription, env } from "../_lib/billing.js";
import { grantPurchase } from "../_lib/video.js";

async function rawBody(req) {
  if (typeof req.rawBody === "string" || Buffer.isBuffer(req.rawBody)) return req.rawBody;
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const secret = env("STRIPE_WEBHOOK_SECRET");
  if (!secret) return sendJson(res, 500, { error: "STRIPE_WEBHOOK_SECRET is not set" });

  let event;
  try {
    const stripe = getStripe();
    event = await stripe.webhooks.constructEventAsync(await rawBody(req), req.headers["stripe-signature"], secret);
  } catch (error) {
    console.error("Stripe webhook signature check failed", error?.message);
    return sendJson(res, 400, { error: "Invalid signature" });
  }

  try {
    const stripe = getStripe();
    const object = event.data.object;
    if (event.type === "checkout.session.completed" && object.mode === "subscription" && object.subscription) {
      const id = typeof object.subscription === "string" ? object.subscription : object.subscription.id;
      await upsertSubscription(await stripe.subscriptions.retrieve(id), object.client_reference_id);
    } else if (event.type === "checkout.session.completed" && object.mode === "payment" && object.metadata?.kind === "video_credits") {
      await grantPurchase(object);
    } else if (event.type.startsWith("customer.subscription.")) {
      await upsertSubscription(object);
    }
    return sendJson(res, 200, { received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed", error);
    return sendJson(res, 500, { error: "Webhook handling failed" });
  }
}

// Stripe needs the exact raw body to verify the signature.
export const config = { api: { bodyParser: false } };
