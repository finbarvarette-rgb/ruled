import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  sendDemandLetterDeliveryEmail,
  sendFullCasePackDeliveryEmail,
} from "@/lib/email-service";

type NotifyType = "demand" | "full";

export async function POST(req: NextRequest) {
  try {
    const { type, caseId } = (await req.json()) as {
      type?: NotifyType;
      caseId?: string;
    };

    if (!caseId || (type !== "demand" && type !== "full")) {
      return NextResponse.json(
        { error: "caseId and type (demand|full) are required" },
        { status: 400 }
      );
    }

    const { data: caseRow, error } = await getSupabase()
      .from("cases")
      .select(
        "id,email,tier_purchased,paid,demand_letter,demand_delivery_email_sent_at,full_pack_delivery_email_sent_at"
      )
      .eq("id", caseId)
      .single();

    if (error || !caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const email = caseRow.email?.trim();
    if (!email) {
      return NextResponse.json({ error: "No email on case" }, { status: 400 });
    }

    if (type === "demand") {
      if (caseRow.demand_delivery_email_sent_at) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      if (!caseRow.demand_letter?.trim()) {
        return NextResponse.json(
          { error: "Demand letter not generated yet" },
          { status: 400 }
        );
      }

      const sent = await sendDemandLetterDeliveryEmail(email, caseId);
      if (!sent) {
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
      }

      await getSupabase()
        .from("cases")
        .update({ demand_delivery_email_sent_at: new Date().toISOString() })
        .eq("id", caseId);

      return NextResponse.json({ ok: true });
    }

    if (caseRow.full_pack_delivery_email_sent_at) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const tier = caseRow.tier_purchased;
    if (tier !== "full" && !caseRow.paid) {
      return NextResponse.json(
        { error: "Full Case Pack purchase required" },
        { status: 400 }
      );
    }

    const sent = await sendFullCasePackDeliveryEmail(email, caseId);
    if (!sent) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    await getSupabase()
      .from("cases")
      .update({ full_pack_delivery_email_sent_at: new Date().toISOString() })
      .eq("id", caseId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email notify error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
