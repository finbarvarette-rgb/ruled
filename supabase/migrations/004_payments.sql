alter table public.cases add column if not exists paid boolean default false;
alter table public.cases add column if not exists tier_purchased text;
