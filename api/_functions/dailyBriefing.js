import { createClientFromRequest } from "../_lib/base44-compat.js";
const json = (body, status = 200) => Response.json(body, { status });
const todayKey = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
const dayNumberSince = (isoDate) => {
  const start = new Date(isoDate);
  if (Number.isNaN(start.getTime())) return null;
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const now = /* @__PURE__ */ new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((todayUtc - startUtc) / 864e5) + 1;
};
const safe = (value, max = 400) => String(value ?? "").trim().slice(0, max);
function buildEmail({ user, business, plan, offerName }) {
  return `
\u{1F3AF} DAILY BATTLE PLAN - DAY ${plan.day}

${safe(user.full_name, 80) || "Strategist"}, here's your mission for today.

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

\u{1F4C8} BUSINESS: ${safe(business?.business_name, 120) || "Your business"}
\u{1F3AF} TARGET: ${safe(business?.target_avatar, 100) || "Your ideal customer"}
${offerName ? `\u{1F4B0} CORE OFFER: ${safe(offerName, 120)}
` : ""}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
${plan.theme ? `
\u{1F9ED} TODAY'S THEME:
${safe(plan.theme)}
` : ""}
\u{1F525} TODAY'S HOOK:
${safe(plan.hook, 800) || "Share one result your customer cares about."}

\u26A1 YOUR CALL-TO-ACTION:
${safe(plan.cta, 400) || "Invite people to take the next step."}
${plan.content_type ? `
\u{1F4F1} CONTENT TYPE: ${safe(plan.content_type, 40).toUpperCase()}
` : ""}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

\u{1F680} Execution beats perfection. Get it done.

Built by Millionaire Business OS
`;
}
async function findTodaysPlan(base44, user) {
  const strategies = await base44.entities.Strategy.filter({ created_by: user.email }, "-created_date", 1);
  const strategy = strategies?.[0];
  if (strategy?.launch_calendar?.length) {
    const day = dayNumberSince(strategy.created_date);
    const plan = strategy.launch_calendar.find((p) => p.day === day);
    if (plan) {
      const business2 = strategy.business_id ? await base44.entities.Business.get(strategy.business_id).catch(() => null) : null;
      return { plan, business: business2, offerName: strategy.offer_stack?.core_offer?.name };
    }
  }
  const businesses = await base44.entities.Business.filter({ created_by: user.email }, "-updated_date", 1);
  const business = businesses?.[0];
  const launchPlan = business?.launch_system_snapshot?.result?.launch_plan;
  if (business && Array.isArray(launchPlan) && launchPlan.length) {
    const day = dayNumberSince(business.launch_started_at || business.created_date);
    const plan = launchPlan.find((p) => p.day === day);
    if (plan) {
      const ladder = business.launch_system_snapshot?.result?.offer_ladder;
      return { plan, business, offerName: ladder?.high_ticket?.name || ladder?.mid_ticket?.name };
    }
  }
  return null;
}
async function main(req) {
  const base44Client = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const args = body?.args ?? body ?? {};
  const expectedSecret = process.env.BRIEFING_CRON_SECRET || process.env.CRON_SECRET;
  const isScheduled = Boolean(expectedSecret) && args.cron_secret === expectedSecret;
  let isAdmin = false;
  if (!isScheduled) {
    try {
      const user = await base44Client.auth.me();
      isAdmin = user?.role === "admin";
    } catch {
    }
  }
  if (!isScheduled && !isAdmin) {
    if (!expectedSecret) console.error("dailyBriefing: BRIEFING_CRON_SECRET is not set, so scheduled runs are rejected.");
    return json({ error: "Forbidden" }, 403);
  }
  const base44 = base44Client.asServiceRole;
  const today = todayKey();
  const logs = [];
  let emailsSent = 0;
  try {
    const users = await base44.entities.User.list();
    for (const user of users) {
      if (!user?.email) continue;
      try {
        const found = await findTodaysPlan(base44, user);
        if (!found) {
          logs.push(`${user.email}: no plan for today`);
          continue;
        }
        const { plan, business, offerName } = found;
        if (business?.last_briefing_sent_on === today) {
          logs.push(`${user.email}: already sent today`);
          continue;
        }
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `\u{1F3AF} DAY ${plan.day}: Your Business Action Plan is Ready`,
          body: buildEmail({ user, business, plan, offerName }),
          from_name: "Millionaire Business OS"
        });
        if (business?.id) {
          await base44.entities.Business.update(business.id, { last_briefing_sent_on: today }).catch(() => null);
        }
        emailsSent += 1;
        logs.push(`${user.email}: sent day ${plan.day}`);
      } catch (error) {
        logs.push(`${user.email}: error ${error?.message || error}`);
      }
    }
    return json({ message: "Daily briefing job completed.", emailsSent, logs });
  } catch (error) {
    console.error("dailyBriefing error", error);
    return json({ error: "Daily briefing failed", details: error?.message }, 500);
  }
}
export {
  main as default
};
