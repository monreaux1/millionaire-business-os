// Sends plain-text email through Resend (https://resend.com).
import { HttpError } from "./server.js";

export async function sendEmail({ to, subject, text, fromName } = {}) {
  const apiKey = String(process.env.RESEND_API_KEY || "").replace(/\s+/g, "");
  const fromAddress = process.env.EMAIL_FROM; // e.g. briefing@yourdomain.com (verified in Resend)
  if (!apiKey || !fromAddress) throw new HttpError(500, "Email is not configured yet (RESEND_API_KEY / EMAIL_FROM).");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromName ? `${String(fromName).replace(/[<>"]/g, "")} <${fromAddress}>` : fromAddress,
      to: [to],
      subject: String(subject || "").slice(0, 200),
      text: String(text || "").slice(0, 50000),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("Resend error", res.status, data?.message);
    throw new HttpError(502, "The email could not be sent.");
  }
  return { success: true };
}
