import { base44 } from "@/api/base44Client";

export const funnelBuilderGenerate = (payload) => base44.functions.invoke("funnelBuilderGenerate", payload);
