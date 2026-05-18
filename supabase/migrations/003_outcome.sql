alter table public.cases add column if not exists outcome text;

create policy "Allow case updates" on public.cases
  for update using (true) with check (true);
