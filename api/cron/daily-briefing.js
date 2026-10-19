// Vercel Cron → daily briefing emails (schedule in vercel.json).
// Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
import { sendJson } from "../_lib/server.js";
import dailyBriefing from "../_functions/dailyBriefing.js";

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers?.authorization !== `Bearer ${secret}`) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  const request = new Request("https://cron.local/api/cron/daily-briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ args: { cron_secret: secret } }),
  });
  const response = await dailyBriefing(request);
  const text = await response.text();
  res.status(response.status).setHeader("Content-Type", "application/json");
  return res.send(text);
}
