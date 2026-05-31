import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_FIELDS = [
  "demand_letter_sent",
  "demand_letter_sent_date",
  "filing_confirmed",
  "filing_confirmed_date",
  "service_confirmed",
  "hearing_date",
  "outcome",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    caseId?: string;
    field?: string;
    value?: unknown;
  };
  const { caseId, field, value } = body;

  if (!caseId || !field) {
    return NextResponse.json({ error: "Missing caseId or field" }, { status: 400 });
  }

  if (!ALLOWED_FIELDS.includes(field as AllowedField)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const filter = user.email
    ? `user_id.eq.${user.id},email.eq.${user.email}`
    : `user_id.eq.${user.id}`;

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .or(filter)
    .maybeSingle();

  if (!caseRow) {
    return NextResponse.json({ error: "Case not found or access denied" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("cases")
    .update({ [field]: value })
    .eq("id", caseId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
