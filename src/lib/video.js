import { callApi } from "@/api/base44Client";

export const getVideoCredits = () => callApi("/api/video/credits", {});
export const buyVideoCredits = (pack, returnTo = "/AdEngine") => callApi("/api/video/buy", { pack, return_to: returnTo });
export const confirmVideoCredits = (sessionId) => callApi("/api/video/confirm", { session_id: sessionId });
export const startVideo = (payload) => callApi("/api/video/start", payload);
export const getVideoStatus = (jobId) => callApi("/api/video/status", { job_id: jobId });

// Polls until the video is done or failed. onUpdate gets each job state.
export async function waitForVideo(jobId, onUpdate, { intervalMs = 8000, timeoutMs = 15 * 60 * 1000 } = {}) {
  const started = Date.now();
  for (;;) {
    const { job, refunded } = await getVideoStatus(jobId);
    onUpdate?.(job);
    if (job.status === "done" || job.status === "failed") return { job, refunded };
    if (Date.now() - started > timeoutMs) return { job, timedOut: true };
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
