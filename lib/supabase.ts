import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Missing Supabase environment variables");
    }
    client = createClient(url, key);
  }
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = Reflect.get(
      getSupabase() as unknown as Record<string | symbol, unknown>,
      prop
    );
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(getSupabase())
      : value;
  },
});

export type Case = {
  id: string;
  created_at: string;
  intake_text: string;
  province: string;
  case_assessment: string;
  email: string | null;
  outcome: string | null;
  paid: boolean;
  tier_purchased: string | null;
  user_id: string | null;
  demand_letter: string | null;
  court_docs: string | null;
  hearing_prep: string | null;
  // Status tracking
  demand_letter_sent?: boolean | null;
  demand_letter_sent_date?: string | null;
  filing_confirmed?: boolean | null;
  filing_confirmed_date?: string | null;
  service_confirmed?: boolean | null;
  hearing_date?: string | null;
  // Billing
  purchased_at?: string | null;
  amount_paid_cents?: number | null;
  receipt_url?: string | null;
};

export type WaitlistEntry = {
  id: string;
  created_at: string;
  email: string;
};
