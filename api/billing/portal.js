// Opens Stripe's billing portal (update card, switch plan, cancel).
import { postHandler, requireUser, HttpError } from "../_lib/server.js";
import { getStripe, getStripeCustomerId, appOrigin } from "../_lib/billing.js";

export default postHandler(async (req) => {
  const { user } = await requireUser(req);
  const customer = await getStripeCustomerId(user.id);
  if (!customer) throw new HttpError(404, "No billing account yet. Choose a plan first.");
  const session = await getStripe().billingPortal.sessions.create({ customer, return_url: `${appOrigin(req)}/billing` });
  return { url: session.url };
}, { name: "billing-portal" });
