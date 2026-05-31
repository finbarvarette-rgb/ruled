import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DemandLetterClient } from "./DemandLetterClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function DemandLetterPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  const meta = {
    hasDemandTier: caseRow.tier_purchased === "demand" || caseRow.tier_purchased === "full",
    hasFullTier: caseRow.tier_purchased === "full",
    hasDemandLetter: !!caseRow.demand_letter?.trim(),
  };

  if (!meta.hasDemandTier) redirect(`/dashboard/cases/${id}`);

  return <DemandLetterClient caseRecord={caseRow} />;
}
