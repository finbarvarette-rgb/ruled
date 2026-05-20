-- Billing fields for Stripe receipts
alter table public.cases
  add column if not exists stripe_session_id text,
  add column if not exists amount_paid_cents integer,
  add column if not exists receipt_url text,
  add column if not exists purchased_at timestamptz;

create index if not exists cases_stripe_session_id_idx on public.cases (stripe_session_id);
