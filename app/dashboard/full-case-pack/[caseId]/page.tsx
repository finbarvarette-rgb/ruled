import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCaseMeta } from "../../case-utils";
import { FullCasePackPurchase } from "./FullCasePackPurchase";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

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

export default async function DashboardFullCasePackPage({ params }: PageProps) {
  const { caseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await syncUserCases(supabase, user.id, user.email ?? undefined);

  const filter = user.email
    ? `user_id.eq.${user.id},email.eq.${user.email}`
    : `user_id.eq.${user.id}`;

  const { data: caseRow } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .or(filter)
    .maybeSingle();

  if (!caseRow) {
    notFound();
  }

  const meta = getCaseMeta(caseRow);
  if (meta.hasFullTier) {
    redirect("/dashboard/documents");
  }

  return <FullCasePackPurchase caseRecord={caseRow} />;
}
