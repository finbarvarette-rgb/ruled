import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { billingFromSession } from "@/lib/stripe-billing";
import { maybeSendPurchaseConfirmationEmail } from "@/lib/purchase-email";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const caseId = session.metadata?.caseId;
    const tier = session.metadata?.tier;

    if (caseId && tier) {
      const admin = getSupabaseAdmin();
      let receiptUrl: string | null = null;
      let amountPaidCents: number | null = null;

      try {
        const billing = await billingFromSession(session);
        receiptUrl = billing.receiptUrl;
        amountPaidCents = billing.amountPaidCents;
      } catch (err) {
        console.error("Webhook billing fetch:", err);
      }

      const { data: caseRow, error: fetchErr } = await admin
        .from("cases")
        .select("email")
        .eq("id", caseId)
        .single();

      const { error } = await admin
        .from("cases")
        .update({
          paid: true,
          tier_purchased: tier,
          stripe_session_id: session.id,
          amount_paid_cents: amountPaidCents,
          receipt_url: receiptUrl,
          purchased_at: new Date().toISOString(),
        })
        .eq("id", caseId);

      if (error) {
        console.error("Failed to update case payment status:", error);
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }

      const email =
        caseRow?.email ??
        session.customer_details?.email ??
        session.customer_email ??
        null;

      void maybeSendPurchaseConfirmationEmail({
        caseId,
        tier,
        email,
        amountPaidCents,
      }).catch((err) => console.error("Purchase confirmation email:", err));
    }
  }

  return NextResponse.json({ received: true });
}
