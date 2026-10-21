// Stripe subscriptions: plans, access checks and syncing Stripe → database.
import Stripe from "stripe";
import { adminDb, getAdmin, HttpError } from "./server.js";

// Prices are created in Stripe; their IDs go in Vercel env vars.
// Display text lives here — edit to change what the Plans page shows.
export const PLANS = [
  { key: "founding", name: "Founding Member", price: "$27", interval: "month", env: "STRIPE_PRICE_FOUNDING",
    blurb: "Full app, locked at $27/month for life. First 50 members only." },
  { key: "pro_monthly", name: "Pro", price: "$47", interval: "month", env: "STRIPE_PRICE_PRO_MONTHLY",
    blurb: "Full app: offers, money model, funnels, 4 AI strategists, launch plans." },
  { key: "pro_yearly", name: "Pro Annual", price: "$470", interval: "year", env: "STRIPE_PRICE_PRO_YEARLY",
    blurb: "Everything in Pro, 2 months free." },
  { key: "coaching", name: "Pro + Coaching", price: "$197", interval: "month", env: "STRIPE_PRICE_COACHING",
    blurb: "Everything in Pro plus a monthly live strategy call and a funnel review." },
];

// Values pasted into Vercel sometimes carry stray spaces, tabs or line breaks.
export const env = (name) => String(process.env[name] || "").replace(/\s+/g, "");

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];
export const foundingLimit = () => Number(process.env.FOUNDING_LIMIT || 50);

export const billingEnabled = () => Boolean(env("STRIPE_SECRET_KEY"));

let stripeClient;
export function getStripe() {
  if (!billingEnabled()) throw new HttpError(500, "Billing is not configured (missing STRIPE_SECRET_KEY).");
  if (!stripeClient) {
    stripeClient = new Stripe(env("STRIPE_SECRET_KEY"), { httpClient: Stripe.createFetchHttpClient() });
  }
  return stripeClient;
}

export const priceIdFor = (planKey) => {
  const plan = PLANS.find((p) => p.key === planKey);
  return plan ? env(plan.env) : "";
};
const planForPrice = (priceId) =>
  PLANS.find((p) => env(p.env) && (env(p.env) === priceId || resolvedPrices.get(env(p.env)) === priceId))?.key || "";

// The env var may hold a price ID (price_…) or, by mistake, the product ID
// (prod_…). A product ID is turned into its recurring price so checkout works.
const resolvedPrices = new Map();
export async function resolvePriceId(planKey) {
  const value = priceIdFor(planKey);
  if (!value || !value.startsWith("prod_")) return value;
  if (resolvedPrices.has(value)) return resolvedPrices.get(value);
  const stripe = getStripe();
  const product = await stripe.products.retrieve(value);
  let priceId = typeof product.default_price === "string" ? product.default_price : product.default_price?.id || "";
  let price = priceId ? await stripe.prices.retrieve(priceId) : null;
  if (!price?.active || !price?.recurring) {
    const list = await stripe.prices.list({ product: value, active: true, type: "recurring", limit: 1 });
    price = list.data[0] || null;
  }
  if (!price) throw new HttpError(500, `No active monthly/yearly price found on Stripe product ${value}.`);
  resolvedPrices.set(value, price.id);
  return price.id;
}

export const isAdminUser = (user) => user?.role === "admin";

export async function getSubscriptions(userId) {
  return adminDb().Subscription.filter({ created_by_id: userId }, "-updated_date", 20);
}

export async function getActiveSubscription(userId) {
  const subs = await getSubscriptions(userId);
  return subs.find((s) => ACTIVE_STATUSES.includes(s.status)) || null;
}

export async function getStripeCustomerId(userId) {
  const subs = await getSubscriptions(userId);
  return subs.find((s) => s.stripe_customer_id)?.stripe_customer_id || "";
}

export async function countActiveFounding() {
  const rows = await adminDb().Subscription.filter({ plan: "founding" });
  return rows.filter((s) => ACTIVE_STATUSES.includes(s.status)).length;
}

export async function accessFor(user) {
  if (!billingEnabled()) return { enabled: false, active: true, subscription: null };
  if (isAdminUser(user)) return { enabled: true, active: true, admin: true, subscription: await getActiveSubscription(user.id) };
  const subscription = await getActiveSubscription(user.id);
  return { enabled: true, active: Boolean(subscription), subscription };
}

// Blocks paid features (AI, agents, funnels) for accounts without an active plan.
export async function requireActiveSubscription(user) {
  const access = await accessFor(user);
  if (!access.active) throw new HttpError(402, "Choose a plan to use this feature.");
  return access;
}

export async function availablePlans() {
  const foundingFull = billingEnabled() && priceIdFor("founding")
    ? (await countActiveFounding()) >= foundingLimit()
    : false;
  return PLANS
    .filter((p) => env(p.env))
    .map(({ key, name, price, interval, blurb }) => ({
      key, name, price, interval, blurb,
      available: key === "founding" ? !foundingFull : true,
    }));
}

const periodEnd = (sub) => {
  const seconds = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
};

// Saves a Stripe subscription to our database (insert or update).
export async function upsertSubscription(stripeSub, userIdHint) {
  const userId = stripeSub.metadata?.user_id || userIdHint;
  if (!userId) {
    console.warn("Stripe subscription without a user id", stripeSub.id);
    return null;
  }
  const priceId = stripeSub.items?.data?.[0]?.price?.id || "";
  const record = {
    status: stripeSub.status,
    plan: stripeSub.metadata?.plan || planForPrice(priceId),
    price_id: priceId,
    stripe_customer_id: typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id || "",
    stripe_subscription_id: stripeSub.id,
    current_period_end: periodEnd(stripeSub),
    cancel_at_period_end: Boolean(stripeSub.cancel_at_period_end),
    synced_at: new Date().toISOString(),
  };

  const store = adminDb().Subscription;
  const existing = (await store.filter({ stripe_subscription_id: stripeSub.id }, "-updated_date", 1))[0];
  if (existing) return store.update(existing.id, record);

  let email = "";
  try {
    const { data } = await getAdmin().auth.admin.getUserById(userId);
    email = data?.user?.email || "";
  } catch { /* email is optional */ }
  return store.create(record, { as: { id: userId, email } });
}

export function appOrigin(req) {
  const configured = env("APP_URL").replace(/\/+$/, "");
  if (configured) return configured;
  const host = req.headers?.["x-forwarded-host"] || req.headers?.host;
  if (!host || !/^[A-Za-z0-9.-]+(:\d+)?$/.test(host)) throw new HttpError(500, "Set APP_URL in Vercel.");
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}
