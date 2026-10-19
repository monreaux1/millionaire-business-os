import { base44 } from "@/api/base44Client";

export const launchSequenceAgent = (payload) => base44.functions.invoke("launchSequenceAgent", payload);
