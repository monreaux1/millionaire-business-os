import { base44 } from "@/api/base44Client";

export const publicFunnel = (payload) => base44.functions.invoke("publicFunnel", payload);
