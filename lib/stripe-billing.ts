import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export type CheckoutBilling = {
  receiptUrl: string | null;
  amountPaidCents: number | null;
};

export async function fetchCheckoutBilling(
  sessionId: string
): Promise<CheckoutBilling> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent.latest_charge"],
  });
  return billingFromSession(session, stripe);
}

export async function billingFromSession(
  session: Stripe.Checkout.Session,
  stripe = getStripe()
): Promise<CheckoutBilling> {
  const amountPaidCents =
    typeof session.amount_total === "number" ? session.amount_total : null;

  let receiptUrl: string | null = null;
  const pi = session.payment_intent;

  if (pi && typeof pi === "object") {
    const charge = pi.latest_charge;
    if (charge && typeof charge === "object") {
      receiptUrl = charge.receipt_url ?? null;
    }
  }

  if (!receiptUrl) {
    const piId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : typeof pi === "object" && pi
          ? pi.id
          : null;
    if (piId) {
      try {
        const intent = await stripe.paymentIntents.retrieve(piId, {
          expand: ["latest_charge"],
        });
        const charge = intent.latest_charge;
        if (charge && typeof charge === "object") {
          receiptUrl = charge.receipt_url ?? null;
        }
      } catch {
        // non-critical
      }
    }
  }

  return { receiptUrl, amountPaidCents };
}
