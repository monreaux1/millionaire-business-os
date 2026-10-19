// Runs the app's server functions: POST /api/fn/<name>
// (the browser calls these through base44.functions.invoke(name, payload)).
import { readBody, sendJson } from "../_lib/server.js";
import { toWebRequest } from "../_lib/base44-compat.js";
import dailyBriefing from "../_functions/dailyBriefing.js";
import deleteAccount from "../_functions/deleteAccount.js";
import funnelAcquisitionAgent from "../_functions/funnelAcquisitionAgent.js";
import funnelBuilderGenerate from "../_functions/funnelBuilderGenerate.js";
import ghlDeploy from "../_functions/ghlDeploy.js";
import hormoziOfferAgent from "../_functions/hormoziOfferAgent.js";
import launchSequenceAgent from "../_functions/launchSequenceAgent.js";
import pricingAgent from "../_functions/pricingAgent.js";
import publicFunnel from "../_functions/publicFunnel.js";

export const config = { maxDuration: 300 };

const FUNCTIONS = {
  dailyBriefing,
  deleteAccount,
  funnelAcquisitionAgent,
  funnelBuilderGenerate,
  ghlDeploy,
  hormoziOfferAgent,
  launchSequenceAgent,
  pricingAgent,
  publicFunnel,
};

export default async function handler(req, res) {
  const name = String(req.query?.name || "");
  const fn = Object.prototype.hasOwnProperty.call(FUNCTIONS, name) ? FUNCTIONS[name] : null;
  if (!fn) return sendJson(res, 404, { error: "Unknown function" });
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  try {
    const response = await fn(toWebRequest(req, readBody(req)));
    const text = await response.text();
    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (error) {
    const status = Number(error?.status) || 500;
    if (status >= 500) console.error(`fn/${name} error`, error);
    return sendJson(res, status, { error: status >= 500 ? "Something went wrong. Please try again." : error.message });
  }
}
