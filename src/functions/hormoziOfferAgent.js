import { base44 } from "@/api/base44Client";

export const hormoziOfferAgent = (payload) => base44.functions.invoke("hormoziOfferAgent", payload);
