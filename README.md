# Millionaire Business OS

React (Vite) app hosted on **Vercel**, with **Supabase** for logins, database and file uploads,
**Claude (Anthropic API)** for all AI, and **Resend** for email. No Base44 dependency.

```
src/                 the app (pages unchanged from Base44)
src/api/             Base44-compatible client on Supabase (entities, auth, AI, functions)
api/                 Vercel server functions
  llm.js             AI for the pages (Claude)
  send-email.js      email to the signed-in user
  fn/[name].js       the 9 app functions (agents, funnel generator, GHL, public funnels…)
  cron/              daily briefing (runs 13:00 UTC via vercel.json)
supabase/migrations/ database tables + security rules (run once)
```

## Go live (about 20 minutes)

1. **Supabase** → New project → SQL Editor → paste `supabase/migrations/001_init.sql` → Run.
2. **Supabase → Authentication → URL Configuration**: set Site URL to your app URL (e.g. `https://app.yourdomain.com`)
   and add `https://app.yourdomain.com/**` to Redirect URLs.
3. **GitHub**: push this folder to a new private repo (branch `main`).
4. **Vercel** → Add New Project → import the repo (framework: Vite). Add every variable from `.env.example`
   under Settings → Environment Variables, then Deploy.
5. **Resend**: verify your sending domain, then set `EMAIL_FROM` to an address on it.
6. Add your custom domain in Vercel → Domains.
7. Sign up in the app, then put your email in `ADMIN_EMAILS` and redeploy.

## Turn on paid plans (Stripe, about 15 minutes)

Until `STRIPE_SECRET_KEY` is set, every signed-up account gets the full app. Once it's set, accounts without
an active plan only see the plan picker, and the AI, agents and funnel generator refuse requests (HTTP 402).
Admins (`ADMIN_EMAILS`) always have access. Public funnel pages keep working for everyone.

1. Supabase → SQL Editor → run `supabase/migrations/002_billing.sql`.
2. Stripe → Product catalog → create recurring prices: Founding $27/mo, Pro $47/mo, Pro Annual $470/yr,
   Pro + Coaching $197/mo. Copy each price ID into the matching `STRIPE_PRICE_*` variable.
3. Stripe → Developers → Webhooks → Add endpoint `https://YOUR-APP/api/billing/webhook` with events
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Stripe → Settings → Billing → Customer portal → turn it on (lets members update cards, switch plans, cancel).
5. Add `STRIPE_SECRET_KEY` and `APP_URL` in Vercel, then redeploy.
6. Test in Stripe test mode first (test keys + card 4242 4242 4242 4242), then switch to live keys.

Founding Member closes automatically after `FOUNDING_LIMIT` (default 50) active founding subscriptions.
Plan names, prices and descriptions shown in the app are in `api/_lib/billing.js`.

Invite-only access: Supabase → Authentication → Sign In / Providers → turn off "Allow new users to sign up",
set `VITE_ALLOW_SIGNUP=false`, and invite buyers from Supabase → Authentication → Users → Invite.

## Local development

```
npm install
cp .env.example .env.local   # fill in values
npx vercel dev               # serves the app and /api on http://localhost:3000
```

## Notes
- Every table has Row Level Security: each account sees only its own rows. GHL tokens live in a server-only table.
- Video ad generation (Ad Engine) was a Base44-only feature and is hidden until a video provider is added.
- Logos are still loaded from Base44's image CDN. Before closing the Base44 account, save them into `public/brand/`
  and update `AppLayout.jsx`, `Dashboard.jsx` and `index.html`.
