-- Create cases table for Ruled
create table if not exists public.cases (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  intake_text text not null,
  province    text not null,
  case_assessment text not null,
  email       text
);

-- Enable Row Level Security (allow inserts from anon/service role)
alter table public.cases enable row level security;

-- Allow anyone to insert (service role bypasses RLS anyway)
create policy "Allow inserts" on public.cases
  for insert with check (true);
