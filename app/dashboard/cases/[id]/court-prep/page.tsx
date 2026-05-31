import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourtPrepClient } from "./CourtPrepClient";
import { getProvinceFiling, inferClaimantName, buildDayOfCourtChecklist } from "@/lib/case-pack";

type PageProps = { params: Promise<{ id: string }> };

export default async function CourtPrepPage({ params }: PageProps) {
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
  if (caseRow.tier_purchased !== "full") redirect(`/dashboard/cases/${id}`);

  const filing = getProvinceFiling(caseRow.province);
  const claimantName = inferClaimantName(caseRow.intake_text, caseRow.email);
  const checklist = buildDayOfCourtChecklist(caseRow.province, claimantName);

  return (
    <CourtPrepClient
      caseRecord={caseRow}
      filing={filing}
      claimantName={claimantName}
      checklist={checklist}
    />
  );
}
