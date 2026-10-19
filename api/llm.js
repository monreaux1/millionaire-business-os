// Replacement for Base44's InvokeLLM: signed-in users only.
import { postHandler, requireUser } from "./_lib/server.js";
import { callClaude } from "./_lib/claude.js";
import { requireActiveSubscription } from "./_lib/billing.js";

export const config = { maxDuration: 300 };

export default postHandler(async (req, body) => {
  const { user } = await requireUser(req);
  await requireActiveSubscription(user);
  const result = await callClaude({
    prompt: body.prompt,
    schema: body.response_json_schema,
    system: body.system,
  });
  return { result };
}, { name: "llm" });
