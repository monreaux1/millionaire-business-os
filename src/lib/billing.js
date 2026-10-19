import { callApi } from "@/api/base44Client";

export const getBillingStatus = () => callApi("/api/billing/status", {});
export const startCheckout = (plan) => callApi("/api/billing/checkout", { plan });
export const confirmCheckout = (sessionId) => callApi("/api/billing/confirm", { session_id: sessionId });
export const openBillingPortal = () => callApi("/api/billing/portal", {});
