// Replacement for Base44's InvokeLLM: signed-in users only.
// Copy is written in the user's Brand Board voice when they have one.
import { postHandler, requireUser } from "./_lib/server.js";
import { callClaude } from "./_lib/claude.js";
import { requireActiveSubscription } from "./_lib/billing.js";

export const config = { maxDuration: 300 };

const clip = (value, max) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

async function brandVoiceFor(db, businessId) {
  try {
    const filter = businessId ? { business_id: String(businessId) } : {};
    const [brand] = await db.BrandProfile.filter(filter, "-updated_date", 1);
    if (!brand) return "";
    const lines = [
      brand.brand_name && `Brand name: ${clip(brand.brand_name, 120)}`,
      brand.brand_voice && `Voice: ${clip(brand.brand_voice, 600)}`,
      brand.tone && `Tone: ${clip(brand.tone, 300)}`,
      brand.phrases_to_use && `Phrases to use: ${clip(brand.phrases_to_use, 400)}`,
      brand.phrases_to_avoid && `Never use: ${clip(brand.phrases_to_avoid, 400)}`,
    ].filter(Boolean);
    if (lines.length < 2) return "";
    return `When you write customer-facing copy, write it in this brand's voice (Brand Board):\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

export default postHandler(async (req, body) => {
  const { user, db } = await requireUser(req);
  await requireActiveSubscription(user);
  const brandVoice = body.use_brand === false ? "" : await brandVoiceFor(db, body.business_id);
  const result = await callClaude({
    prompt: body.prompt,
    schema: body.response_json_schema,
    system: [body.system, brandVoice].filter(Boolean).join("\n\n"),
  });
  return { result };
}, { name: "llm" });
