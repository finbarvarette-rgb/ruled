-- Link cases to authenticated users; index email for dashboard lookups
alter table public.cases add column if not exists user_id uuid references auth.users(id);

create index if not exists cases_email_idx on public.cases (email);
