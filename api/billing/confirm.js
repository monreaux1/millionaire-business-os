// Called when the buyer returns from Stripe: activates access immediately,
// even if the webhook hasn't arrived yet.
import { postHandler, requireUser, HttpError } from "../_lib/server.js";
import { getStripe, upsertSubscription } from "../_lib/billing.js";

export default postHandler(async (req, body) => {
  const { user } = await requireUser(req);
  const sessionId = String(body.session_id || "");
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new HttpError(400, "Invalid checkout session.");
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== user.id) throw new HttpError(403, "This checkout belongs to another account.");
  if (!session.subscription) return { active: false };
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const saved = await upsertSubscription(sub, user.id);
  return { active: ["active", "trialing", "past_due"].includes(saved?.status), plan: saved?.plan || "" };
}, { name: "billing-confirm" });
