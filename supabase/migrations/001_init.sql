-- Millionaire Business OS — initial database (Supabase / Postgres)
-- Run once in Supabase → SQL Editor → New query → paste → Run.
--
-- Every app record is stored as a JSON document ("data") plus a few standard
-- columns, mirroring how the app stored records on Base44. Row Level Security
-- makes every row visible ONLY to the account that owns it.

set client_min_messages = warning;
create extension if not exists pgcrypto;

-- Keeps updated_date current on every update.
create or replace function public.touch_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date := now();
  return new;
end $$;

-- Creates one document table with standard columns, trigger and owner-only RLS.
-- client_access = false → no policies at all: only server code (service role) can touch it.
create or replace function public.mbos_make_table(tbl text, client_access boolean default true)
returns void language plpgsql as $$
begin
  execute format($f$
    create table if not exists public.%1$I (
      id            uuid primary key default gen_random_uuid(),
      created_by_id uuid references auth.users(id) on delete cascade default auth.uid(),
      created_by    text default (auth.jwt() ->> 'email'),
      created_date  timestamptz not null default now(),
      updated_date  timestamptz not null default now(),
      data          jsonb not null default '{}'::jsonb
    );
    create index if not exists %1$s_owner_idx on public.%1$I (created_by_id, updated_date desc);
    drop trigger if exists %1$s_touch on public.%1$I;
    create trigger %1$s_touch before update on public.%1$I
      for each row execute function public.touch_updated_date();
    alter table public.%1$I enable row level security;
    revoke all on public.%1$I from anon;
    grant all on public.%1$I to service_role;
  $f$, tbl);

  if client_access then
    execute format('grant select, insert, update, delete on public.%I to authenticated', tbl);
  else
    execute format('revoke all on public.%I from authenticated', tbl);
  end if;

  if client_access then
    execute format($f$
      drop policy if exists "%1$s_select_own" on public.%1$I;
      drop policy if exists "%1$s_insert_own" on public.%1$I;
      drop policy if exists "%1$s_update_own" on public.%1$I;
      drop policy if exists "%1$s_delete_own" on public.%1$I;
      create policy "%1$s_select_own" on public.%1$I for select to authenticated using (created_by_id = auth.uid());
      create policy "%1$s_insert_own" on public.%1$I for insert to authenticated with check (created_by_id = auth.uid());
      create policy "%1$s_update_own" on public.%1$I for update to authenticated using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
      create policy "%1$s_delete_own" on public.%1$I for delete to authenticated using (created_by_id = auth.uid());
    $f$, tbl);
  end if;
end $$;

select public.mbos_make_table('business');
select public.mbos_make_table('strategy');
select public.mbos_make_table('money_model');
select public.mbos_make_table('brand_profile');
select public.mbos_make_table('asset_project');
select public.mbos_make_table('funnel_project');
select public.mbos_make_table('commerce_settings');

-- Leads are written only by the server (public funnel form) but readable/updatable by their owner.
select public.mbos_make_table('funnel_lead');
drop policy if exists "funnel_lead_insert_own" on public.funnel_lead;

-- GHL tokens never reach the browser: server-only table, no client policies.
select public.mbos_make_table('ghl_connection', false);

-- Lookup used by public funnel pages.
create index if not exists funnel_project_slug_idx on public.funnel_project ((data ->> 'slug'));

-- Daily briefing de-duplication helper index.
create index if not exists business_owner_idx2 on public.business (created_by_id, created_date);

-- ── File uploads (logos, photos) ────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "uploads_insert_own_folder" on storage.objects;
create policy "uploads_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "uploads_delete_own_folder" on storage.objects;
create policy "uploads_delete_own_folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
