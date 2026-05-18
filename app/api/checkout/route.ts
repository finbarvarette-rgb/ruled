import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

const TIERS = {
  demand: {
    amount: 4900,
    name: "Ruled — Demand Letter",
  },
  full: {
    amount: 19900,
    name: "Ruled — Full Case Pack",
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    const { tier, caseId } = (await req.json()) as {
      tier?: string;
      caseId?: string | null;
    };

    if (tier !== "demand" && tier !== "full") {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const config = TIERS[tier];
    const baseUrl =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      new URL(req.url).origin;

    const caseIdParam = caseId ?? "";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: { name: config.name },
            unit_amount: config.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&caseId=${encodeURIComponent(caseIdParam)}`,
      cancel_url: `${baseUrl}/results`,
      metadata: {
        tier,
        caseId: caseIdParam,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
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
