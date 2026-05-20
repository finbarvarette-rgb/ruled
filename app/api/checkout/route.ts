import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
const TIERS = {
  demand: {
    amount: 4900,
    name: "Ruled — Demand Letter",
    description:
      "Professional demand letter drafted to your specific case. Sent within minutes of payment. Includes: AI-drafted letter referencing your evidence, proper legal language, 14-day payment deadline, and small claims filing threat.",
  },
  full: {
    amount: 19900,
    name: "Ruled — Full Case Pack",
    description:
      "Everything you need for small claims court. Includes: demand letter, all province-specific court filing documents, complete hearing preparation script, evidence checklist, and unlimited Q&A.",
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    const { tier, caseId, email } = (await req.json()) as {
      tier?: string;
      caseId?: string | null;
      email?: string | null;
    };

    if (tier !== "demand" && tier !== "full") {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const trimmedCaseId = caseId?.trim();
    if (!trimmedCaseId) {
      return NextResponse.json(
        { error: "A case is required before checkout" },
        { status: 400 }
      );
    }

    const config = TIERS[tier];
    const baseUrl =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      new URL(req.url).origin;

    const logoUrl = `${baseUrl}/logo.svg`;
    const successPath =
      tier === "full" ? "/success/full-case-pack" : "/success/demand-letter";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      currency: "cad",
      customer_email: email?.trim() || undefined,
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: config.name,
              description: config.description,
              images: [logoUrl],
            },
            unit_amount: config.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/results`,
      metadata: {
        tier,
        caseId: trimmedCaseId,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    // Store stripe session id on the case for billing/receipts.
    try {
      const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
      await getSupabaseAdmin()
        .from("cases")
        .update({ stripe_session_id: session.id })
        .eq("id", trimmedCaseId);
    } catch {
      // non-critical
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 }
    );
  }
}
