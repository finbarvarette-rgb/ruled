import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Case = {
  id: string;
  created_at: string;
  intake_text: string;
  province: string;
  case_assessment: string;
  email: string | null;
};

export type WaitlistEntry = {
  id: string;
  created_at: string;
  email: string;
};
