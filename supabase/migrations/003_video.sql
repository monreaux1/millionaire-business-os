-- Millionaire Business OS — AI video ads (credit packs + video jobs)
-- Run once in Supabase → SQL Editor after 002_billing.sql.
--
-- video_credit: ledger (+N per purchase, -1 per video, +1 refund on failure).
-- video_job:    one row per generated video ad.
-- Both are written ONLY by the server; users can read their own rows.

set client_min_messages = warning;

select public.mbos_make_table('video_credit', false);
select public.mbos_make_table('video_job', false);

drop policy if exists "video_credit_select_own" on public.video_credit;
create policy "video_credit_select_own" on public.video_credit
  for select to authenticated using (created_by_id = auth.uid());
grant select on public.video_credit to authenticated;

drop policy if exists "video_job_select_own" on public.video_job;
create policy "video_job_select_own" on public.video_job
  for select to authenticated using (created_by_id = auth.uid());
grant select on public.video_job to authenticated;

-- A Stripe checkout can only add credits once.
create unique index if not exists video_credit_stripe_session_idx
  on public.video_credit ((data ->> 'stripe_session_id'))
  where data ->> 'stripe_session_id' is not null;
create index if not exists video_credit_owner_idx on public.video_credit (created_by_id);
create index if not exists video_job_owner_idx on public.video_job (created_by_id, created_date desc);
