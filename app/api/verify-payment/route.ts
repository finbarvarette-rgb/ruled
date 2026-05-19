import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = (await req.json()) as { sessionId?: string };

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    const tier = session.metadata?.tier ?? "demand";
    const caseId = session.metadata?.caseId;

    if (!caseId) {
      return NextResponse.json({ error: "Missing case reference" }, { status: 400 });
    }

    const { data: caseRow, error } = await getSupabase()
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (error || !caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    await getSupabase()
      .from("cases")
      .update({
        paid: true,
        tier_purchased: tier,
        email: caseRow.email ?? session.customer_details?.email ?? session.customer_email,
      })
      .eq("id", caseId);

    return NextResponse.json({
      tier,
      caseId,
      assessment: caseRow.case_assessment,
      intake: caseRow.intake_text,
      province: caseRow.province,
      email: caseRow.email ?? session.customer_details?.email ?? session.customer_email,
      demandLetter: caseRow.demand_letter ?? null,
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
