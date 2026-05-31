ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS demand_letter_sent       boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS demand_letter_sent_date  timestamptz,
  ADD COLUMN IF NOT EXISTS filing_confirmed         boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS filing_confirmed_date    timestamptz,
  ADD COLUMN IF NOT EXISTS service_confirmed        boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS hearing_date             date;
