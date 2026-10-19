// Replacement for Base44's SendEmail. Users can only email themselves
// (the Daily Briefing page), so this can't be abused to send spam.
import { postHandler, requireUser, HttpError } from "./_lib/server.js";
import { sendEmail } from "./_lib/email.js";

export default postHandler(async (req, body) => {
  const { user } = await requireUser(req);
  if (body.to && String(body.to).toLowerCase() !== String(user.email).toLowerCase()) {
    throw new HttpError(403, "You can only send emails to your own address.");
  }
  if (!body.subject || !body.body) throw new HttpError(400, "Subject and body are required.");
  return sendEmail({ to: user.email, subject: body.subject, text: body.body, fromName: "Millionaire Business OS" });
}, { name: "send-email" });
