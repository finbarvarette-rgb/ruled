import { createClient } from "@/lib/supabase/server";
import { DocumentsClient } from "./DocumentsClient";

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

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await syncUserCases(supabase, user!.id, user!.email ?? undefined);

  const filter = user!.email
    ? `user_id.eq.${user!.id},email.eq.${user!.email}`
    : `user_id.eq.${user!.id}`;

  const { data: cases, error: casesError } = await supabase
    .from("cases")
    .select("*")
    .or(filter)
    .order("created_at", { ascending: false });

  if (casesError) {
    console.error("[dashboard/documents] cases query error:", casesError.message);
  } else {
    console.log("[dashboard/documents] user cases for Open links:", {
      userId: user!.id,
      email: user!.email,
      caseIds: (cases ?? []).map((c) => ({
        id: c.id,
        paid: c.paid,
        tier: c.tier_purchased,
      })),
    });
  }

  return <DocumentsClient cases={cases ?? []} />;
}

