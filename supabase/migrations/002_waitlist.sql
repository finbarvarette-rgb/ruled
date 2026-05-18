create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email      text not null unique
);

alter table public.waitlist enable row level security;

create policy "Allow waitlist inserts" on public.waitlist
  for insert with check (true);
