-- Millionaire Business OS — billing (Stripe subscriptions)
-- Run once in Supabase → SQL Editor after 001_init.sql.
--
-- One row per Stripe subscription. Written ONLY by the server (Stripe webhook);
-- each user can read their own rows so the app can show their plan.

set client_min_messages = warning;

select public.mbos_make_table('subscription', false);

drop policy if exists "subscription_select_own" on public.subscription;
create policy "subscription_select_own" on public.subscription
  for select to authenticated using (created_by_id = auth.uid());
grant select on public.subscription to authenticated;

create unique index if not exists subscription_stripe_id_idx
  on public.subscription ((data ->> 'stripe_subscription_id'));
create index if not exists subscription_plan_status_idx
  on public.subscription ((data ->> 'plan'), (data ->> 'status'));
