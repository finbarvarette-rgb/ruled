import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { sendPaymentConfirmationEmail } from "@/lib/email";

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
      let receiptUrl: string | null = null;
      let amountPaidCents: number | null = null;
      try {
        amountPaidCents =
          typeof session.amount_total === "number" ? session.amount_total : null;
        const piId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null;
        if (piId) {
          const pi = await getStripe().paymentIntents.retrieve(piId, {
            expand: ["latest_charge"],
          });
          const charge = pi.latest_charge as Stripe.Charge | null;
          receiptUrl = charge?.receipt_url ?? null;
        }
      } catch {
        // non-critical
      }

      const { error } = await getSupabase()
        .from("cases")
        .update({ paid: true, tier_purchased: tier })
        .eq("id", caseId);

      if (error) {
        console.error("Failed to update case payment status:", error);
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }

      // Store receipt/billing fields when available
      try {
        await getSupabase()
          .from("cases")
          .update({
            stripe_session_id: session.id,
            amount_paid_cents: amountPaidCents,
            receipt_url: receiptUrl,
            purchased_at: new Date().toISOString(),
          })
          .eq("id", caseId);
      } catch {
        // non-critical
      }
    }

    const customerEmail =
      session.customer_details?.email ?? session.customer_email ?? null;
    if (customerEmail && tier) {
      await sendPaymentConfirmationEmail(customerEmail, tier);
    }
  }

  return NextResponse.json({ received: true });
}
