// Replacement for Base44's InvokeLLM: signed-in users only.
import { postHandler, requireUser } from "./_lib/server.js";
import { callClaude } from "./_lib/claude.js";

export const config = { maxDuration: 300 };

export default postHandler(async (req, body) => {
  await requireUser(req);
  const result = await callClaude({
    prompt: body.prompt,
    schema: body.response_json_schema,
    system: body.system,
  });
  return { result };
}, { name: "llm" });
