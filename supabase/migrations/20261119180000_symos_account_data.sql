create table public.symos_account_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  revision integer not null default 1 check (revision >= 1),
  data jsonb not null check (
    jsonb_typeof(data) = 'object'
    and data @> '{"version": 1}'::jsonb
    and coalesce(jsonb_typeof(data -> 'projects') = 'array', false)
  )
);

alter table public.symos_account_data enable row level security;

revoke all on public.symos_account_data from public, anon, authenticated;
grant select, insert, update on public.symos_account_data to authenticated;

create policy "Read own SymOS data"
  on public.symos_account_data for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Create own SymOS data"
  on public.symos_account_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Update own SymOS data"
  on public.symos_account_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
