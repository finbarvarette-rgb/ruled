import { createClient } from "@/lib/supabase/server";
import { CaseAssessmentsClient } from "./CaseAssessmentsClient";

async function syncUserCases(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined
) {
  if (!email) return;

  await supabase
    .from("cases")
    .update({ user_id: userId })
    .eq("email", email)
    .is("user_id", null);

  await supabase
    .from("cases")
    .update({ email })
    .eq("user_id", userId)
    .is("email", null);
}

export default async function CaseAssessmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await syncUserCases(supabase, user!.id, user!.email ?? undefined);

  const filter = user!.email
    ? `user_id.eq.${user!.id},email.eq.${user!.email}`
    : `user_id.eq.${user!.id}`;

  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .or(filter)
    .order("created_at", { ascending: false });

  return <CaseAssessmentsClient cases={cases ?? []} />;
}

