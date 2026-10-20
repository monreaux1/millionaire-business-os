// Help chat.
//   POST /api/support {action:"ask", messages:[{role,content}]}  → { answer }   (signed-in only)
//   POST /api/support {action:"send", message, email?, name?, page?, transcript?} → { sent: true }
// "send" emails the request to the owner's support inbox, with Reply-To set to the
// customer so the owner can answer straight from their email.
import { postHandler, requireUser, bearerToken, HttpError } from "./_lib/server.js";
import { callClaude } from "./_lib/claude.js";
import { accessFor } from "./_lib/billing.js";
import { sendEmail } from "./_lib/email.js";

export const config = { maxDuration: 60 };

const clip = (value, max) => String(value || "").replace(/\r/g, "").trim().slice(0, max);
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i;

export const supportInbox = () =>
  String(process.env.SUPPORT_EMAIL || process.env.EMAIL_REPLY_TO || process.env.ADMIN_EMAILS || "")
    .split(",").map((v) => v.trim()).find((v) => EMAIL_RE.test(v)) || "";

// Light per-instance throttle so the public form can't be used to spam the inbox.
const hits = new Map();
function throttle(key, limit, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= limit) throw new HttpError(429, "Too many messages. Please wait a few minutes and try again.");
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
}
const clientIp = (req) => String(req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "unknown").split(",")[0].trim();

const HELP_GUIDE = `You are the friendly support assistant for Millionaire Business OS, an app by AI Wealth Systems that turns one business idea into an offer, pricing, funnel, launch plan and ads.

HOW THE APP WORKS (menu names in quotes):
- Start: "Business Foundation" (business details) and "Brand Board" (logo, colors, fonts, voice, contact info). Everything the app writes uses the Brand Board, so fill it in first.
- Build path: "1. Idea Intake" → "2. Offer Builder" → "3. Offer Ladder" → "4. Asset Creator" (freebies/lead magnets) → "5. Funnel Studio" (funnel pages; publish to get a public link) → "6. VSL Generator" (video sales letter scripts) → "7. Ad Engine" (ad copy and AI video ads).
- Planning: "Build My Money Model", "Strategy Generator" (generate a strategy first; other tools use it), "Launch Calendar", "Launch Partner", "Launch Battle Plan", "Daily Briefing".
- Content and sales: "Content Generator", "Sales Scripts", "Deployment Center".
- AI strategists: "Offer Agent", "Pricing Agent", "Launch Sequence", "Funnel Acquisition", "Business Strategist".
- "Lead Dashboard" shows people who opted in through published funnels. "Payments & Delivery" covers getting paid and delivering products.
- Video ads (Ad Engine → Video Ad tab): every member gets 1 free video. More videos use credits: 5 for $19, 15 for $49, 40 for $119. A video takes a few minutes; failed videos are refunded automatically. Optional photos of yourself and your product make the ad look like you.
- Plans: Founding Member $27/month (first 50, rate locked while subscribed), Pro $47/month, Pro Annual $470/year, Pro + Coaching $197/month. Manage, upgrade, update card or cancel anytime in "My Plan & Billing".
- Fixes for common issues: if a page looks blank or stuck, refresh the page; if AI generation fails, wait a moment and try again; if a tool says to generate a strategy first, run "Strategy Generator"; forgot password → "Forgot password" on the sign-in page; the app works on phone and desktop.

RULES:
- Answer in 2-5 short sentences, plain words, step by step when giving directions. No markdown headings.
- Only answer questions about using this app or the account. For general business advice, point them to "Business Strategist".
- Never promise income or results. Never invent features, prices or policies not listed above.
- For refunds, billing errors or double charges, missing credits, bugs that a refresh doesn't fix, account access problems, or anything you're not sure about: say a real person will help and tell them to tap "Send to support" below the chat.`;

async function optionalUser(req) {
  if (!bearerToken(req)) return null;
  try { return (await requireUser(req)).user; } catch { return null; }
}

async function ask(req, body) {
  const user = await optionalUser(req);
  if (!user) throw new HttpError(401, "Sign in to chat, or send us a message below.");
  throttle(`ask:${user.id}`, 30, 60 * 60 * 1000);
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-8)
    .map((m) => `${m.role === "user" ? "MEMBER" : "SUPPORT"}: ${clip(m.content, 1200)}`)
    .filter((line) => line.length > 9);
  if (!messages.length) throw new HttpError(400, "Type your question first.");
  const answer = await callClaude({
    system: HELP_GUIDE,
    prompt: `Conversation so far:\n${messages.join("\n\n")}\n\nWrite SUPPORT's next reply to the member.`,
    maxTokens: 600,
  });
  return { answer: clip(answer, 2000) || "I'm not sure about that one. Tap \"Send to support\" and a real person will help." };
}

async function send(req, body) {
  if (body.website) return { sent: true }; // honeypot: bots fill hidden fields
  const inbox = supportInbox();
  if (!inbox) throw new HttpError(503, "Support email isn't set up yet.");
  const user = await optionalUser(req);
  const email = user?.email || clip(body.email, 200);
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Enter a valid email so we can reply.");
  const message = clip(body.message, 4000);
  if (message.length < 5) throw new HttpError(400, "Tell us a little about what's going on.");
  throttle(`send:${user?.id || clientIp(req)}`, 5, 60 * 60 * 1000);

  let plan = "not signed in";
  if (user) {
    try {
      const access = await accessFor(user);
      plan = access.admin ? "admin" : access.active ? `active (${access.subscription?.plan || "plan"})` : "no active plan";
    } catch { plan = "unknown"; }
  }
  const name = clip(user?.full_name || body.name, 120);
  const transcript = (Array.isArray(body.transcript) ? body.transcript : [])
    .slice(-12)
    .map((m) => `${m.role === "user" ? "Member" : "Assistant"}: ${clip(m.content, 1500)}`)
    .join("\n\n");

  const text = [
    `New support request — reply to this email to answer ${email} directly.`,
    "",
    `From: ${name ? `${name} <${email}>` : email}`,
    `Account: ${user ? `signed in (id ${user.id})` : "visitor (not signed in)"}`,
    `Plan: ${plan}`,
    `Page: ${clip(body.page, 300) || "unknown"}`,
    `Sent: ${new Date().toISOString()}`,
    "",
    "MESSAGE",
    message,
    ...(transcript ? ["", "HELP CHAT BEFORE THIS", transcript] : []),
  ].join("\n");

  await sendEmail({
    to: inbox,
    subject: `Support: ${message.replace(/\s+/g, " ").slice(0, 70)}`,
    text,
    fromName: "Millionaire Business OS Support",
    replyTo: email,
  });

  // Receipt for the customer (best effort).
  try {
    await sendEmail({
      to: email,
      subject: "We got your message — Millionaire Business OS",
      text: `Hi${name ? ` ${name.split(" ")[0]}` : ""},\n\nThanks for reaching out. A real person on our team has your message and will reply to this email address, usually within one business day.\n\nYour message:\n${message}\n\n— Millionaire Business OS Support`,
      fromName: "Millionaire Business OS Support",
      replyTo: inbox,
    });
  } catch { /* the owner still got the request */ }

  return { sent: true };
}

export default postHandler(async (req, body) => {
  if (body.action === "ask") return ask(req, body);
  if (body.action === "send") return send(req, body);
  throw new HttpError(400, "Unknown support action.");
}, { name: "support" });
