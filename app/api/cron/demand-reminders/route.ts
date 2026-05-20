import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendDemandReminderEmail } from "@/lib/email-service";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  const { data: cases, error } = await getSupabase()
    .from("cases")
    .select("id,email,province,demand_letter_sent_at,demand_reminder_sent_at")
    .not("demand_letter_sent_at", "is", null)
    .is("demand_reminder_sent_at", null)
    .not("email", "is", null)
    .lte("demand_letter_sent_at", cutoff.toISOString());

  if (error) {
    console.error("demand-reminders query error:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const row of cases ?? []) {
    const email = row.email?.trim();
    if (!email) continue;

    const ok = await sendDemandReminderEmail(email, {
      province: row.province,
      caseId: row.id,
    });

    if (!ok) {
      failed++;
      continue;
    }

    await getSupabase()
      .from("cases")
      .update({ demand_reminder_sent_at: new Date().toISOString() })
      .eq("id", row.id);

    sent++;
  }

  return NextResponse.json({
    ok: true,
    candidates: cases?.length ?? 0,
    sent,
    failed,
  });
}
