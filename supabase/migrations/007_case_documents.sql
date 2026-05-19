-- Store court filing guide and hearing prep per case
alter table public.cases add column if not exists court_docs text;
alter table public.cases add column if not exists hearing_prep text;

-- Index user_id for fast per-user lookups on dashboard
create index if not exists cases_user_id_idx on public.cases (user_id);

-- RLS: users can only read/write their own cases
alter table public.cases enable row level security;

create policy if not exists "Users can view own cases"
  on public.cases for select
  using (
    auth.uid() = user_id
    or email = auth.email()
  );

create policy if not exists "Users can insert own cases"
  on public.cases for insert
  with check (true);

create policy if not exists "Users can update own cases"
  on public.cases for update
  using (
    auth.uid() = user_id
    or email = auth.email()
  );
