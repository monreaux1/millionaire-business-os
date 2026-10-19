import { base44 } from "@/api/base44Client";

export const dailyBriefing = (payload) => base44.functions.invoke("dailyBriefing", payload);
