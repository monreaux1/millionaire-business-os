// Public: how many Founding Member spots are left (for the landing page).
import { sendJson } from "../_lib/server.js";
import { billingEnabled, countActiveFounding, foundingLimit, priceIdFor } from "../_lib/billing.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  const limit = foundingLimit();
  try {
    if (!billingEnabled() || !priceIdFor("founding")) return sendJson(res, 200, { limit, taken: 0, left: limit, open: true });
    const taken = await countActiveFounding();
    return sendJson(res, 200, { limit, taken, left: Math.max(0, limit - taken), open: taken < limit });
  } catch (error) {
    console.error("founding count failed", error?.message);
    return sendJson(res, 200, { limit, taken: null, left: null, open: true });
  }
}
