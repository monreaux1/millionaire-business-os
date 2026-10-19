import { base44 } from "@/api/base44Client";

export const ghlDeploy = (payload) => base44.functions.invoke("ghlDeploy", payload);
