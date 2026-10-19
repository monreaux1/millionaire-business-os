import { base44 } from "@/api/base44Client";

export const deleteAccount = (payload) => base44.functions.invoke("deleteAccount", payload);
