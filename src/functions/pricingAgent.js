import { base44 } from "@/api/base44Client";

export const pricingAgent = (payload) => base44.functions.invoke("pricingAgent", payload);
