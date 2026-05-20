alter table public.cases
  add column if not exists purchase_confirmation_email_sent_at timestamptz;
