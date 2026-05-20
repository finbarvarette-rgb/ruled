import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchCheckoutBilling } from "@/lib/stripe-billing";
import { maybeSendPurchaseConfirmationEmail } from "@/lib/purchase-email";

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
    const caseId = session.metadata?.caseId?.trim();

    if (!caseId) {
      return NextResponse.json({ error: "Missing case reference" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: caseRow, error } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (error || !caseRow) {
      console.error("Verify payment case lookup:", error?.message);
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    let receiptUrl: string | null = caseRow.receipt_url ?? null;
    let amountPaidCents: number | null = caseRow.amount_paid_cents ?? null;

    try {
      const billing = await fetchCheckoutBilling(sessionId);
      if (billing.receiptUrl) receiptUrl = billing.receiptUrl;
      if (billing.amountPaidCents != null) {
        amountPaidCents = billing.amountPaidCents;
      }
    } catch (billingErr) {
      console.error("Verify payment billing fetch:", billingErr);
    }

    const customerEmail =
      caseRow.email ??
      session.customer_details?.email ??
      session.customer_email ??
      null;

    const { error: updateError } = await supabase
      .from("cases")
      .update({
        paid: true,
        tier_purchased: tier,
        email: customerEmail,
        stripe_session_id: sessionId,
        amount_paid_cents: amountPaidCents,
        receipt_url: receiptUrl,
        purchased_at: caseRow.purchased_at ?? new Date().toISOString(),
      })
      .eq("id", caseId);

    if (updateError) {
      console.error("Verify payment case update:", updateError.message);
      return NextResponse.json(
        { error: "Failed to update case" },
        { status: 500 }
      );
    }

    void maybeSendPurchaseConfirmationEmail({
      caseId,
      tier,
      email: customerEmail,
      amountPaidCents,
    }).catch((err) => console.error("Purchase confirmation email:", err));

    return NextResponse.json({
      tier,
      caseId,
      assessment: caseRow.case_assessment,
      intake: caseRow.intake_text,
      province: caseRow.province,
      email: customerEmail,
      demandLetter: caseRow.demand_letter ?? null,
      courtDocs: caseRow.court_docs ?? null,
      hearingPrep: caseRow.hearing_prep ?? null,
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
