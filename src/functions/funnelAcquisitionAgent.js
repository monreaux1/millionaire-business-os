import { base44 } from "@/api/base44Client";

export const funnelAcquisitionAgent = (payload) => base44.functions.invoke("funnelAcquisitionAgent", payload);
