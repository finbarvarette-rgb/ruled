-- Transactional email tracking & demand letter send date for reminders
alter table public.cases add column if not exists assessment_email_sent_at timestamptz;
alter table public.cases add column if not exists demand_delivery_email_sent_at timestamptz;
alter table public.cases add column if not exists full_pack_delivery_email_sent_at timestamptz;
alter table public.cases add column if not exists demand_letter_sent_at timestamptz;
alter table public.cases add column if not exists demand_reminder_sent_at timestamptz;
