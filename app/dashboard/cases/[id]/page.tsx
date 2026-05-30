import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CaseDetailClient } from "./CaseDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function syncUserCases(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined
) {
  if (!email) return;
  await supabase.from("cases").update({ user_id: userId }).eq("email", email).is("user_id", null);
  await supabase.from("cases").update({ email }).eq("user_id", userId).is("email", null);
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await syncUserCases(supabase, user.id, user.email ?? undefined);

  const filter = user.email
    ? `user_id.eq.${user.id},email.eq.${user.email}`
    : `user_id.eq.${user.id}`;

  const { data: caseRow } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .or(filter)
    .maybeSingle();

  if (!caseRow) notFound();

  return <CaseDetailClient caseRecord={caseRow} />;
}
