// Current user's plan + which plans can be bought.
import { postHandler, requireUser } from "../_lib/server.js";
import { accessFor, availablePlans } from "../_lib/billing.js";

export default postHandler(async (req) => {
  const { user } = await requireUser(req);
  const access = await accessFor(user);
  const sub = access.subscription;
  return {
    enabled: access.enabled,
    active: access.active,
    admin: Boolean(access.admin),
    subscription: sub ? {
      plan: sub.plan, status: sub.status, current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end, has_customer: Boolean(sub.stripe_customer_id),
    } : null,
    plans: access.enabled ? await availablePlans() : [],
  };
}, { name: "billing-status" });
