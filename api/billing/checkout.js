// Starts a Stripe Checkout for the chosen plan and returns its URL.
import { postHandler, requireUser, HttpError } from "../_lib/server.js";
import { getStripe, priceIdFor, resolvePriceId, availablePlans, getActiveSubscription, getStripeCustomerId, appOrigin } from "../_lib/billing.js";

export default postHandler(async (req, body) => {
  const { user } = await requireUser(req);
  const plan = String(body.plan || "");
  if (!priceIdFor(plan)) throw new HttpError(400, "That plan isn't available.");
  const option = (await availablePlans()).find((p) => p.key === plan);
  if (!option?.available) throw new HttpError(409, "Founding spots are sold out. Choose Pro instead.");
  if (await getActiveSubscription(user.id)) {
    throw new HttpError(409, "You already have an active plan. Use Manage billing to change it.");
  }

  const price = await resolvePriceId(plan);
  const origin = appOrigin(req);
  const customer = await getStripeCustomerId(user.id);
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    ...(customer ? { customer } : { customer_email: user.email }),
    client_reference_id: user.id,
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
    allow_promotion_codes: true,
    success_url: `${origin}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing?status=canceled`,
  });
  return { url: session.url };
}, { name: "billing-checkout" });
