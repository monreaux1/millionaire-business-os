import { base44 } from "@/api/base44Client";

// Options for agents that can run from a Business profile (created by Idea Intake,
// Business Setup or Money Model) or from a legacy saved Strategy.
// Business profiles come first so new customers always have something to pick.
export async function loadAgentSources() {
  const [strategies, businesses] = await Promise.all([
    base44.entities.Strategy.list("-created_date").catch(() => []),
    base44.entities.Business.list("-updated_date").catch(() => []),
  ]);
  const nameFor = (id) => businesses.find((b) => b.id === id)?.business_name || "Unnamed business";

  return [
    ...businesses.map((b) => ({
      value: `business:${b.id}`,
      label: `${b.business_name || "Unnamed business"} — business profile`,
      payload: { business_id: b.id },
    })),
    ...strategies.map((s) => ({
      value: `strategy:${s.id}`,
      label: `${nameFor(s.business_id)} — saved strategy`,
      payload: { strategy_id: s.id },
    })),
  ];
}

export const agentErrorMessage = (e, fallback) =>
  e?.data?.error || e?.response?.data?.error || fallback;
