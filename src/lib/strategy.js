// Strategies saved by older and newer versions name the main offer differently.
export function coreOfferOf(strategy) {
  const stack = strategy?.offer_stack || {};
  return stack.core_offer || stack.mid_ticket || stack.low_ticket || stack.high_ticket || {};
}

export const coreOfferName = (strategy, fallback = "Main offer") => coreOfferOf(strategy).name || fallback;
