import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function jsonResponse(
  body: Record<string, unknown>,
  status: number
): NextResponse {
  return NextResponse.json(body, { status, headers: JSON_HEADERS });
}

/** Save generated documents after Stripe checkout (no auth session required). */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: string;
      caseId?: string;
      demandLetter?: string;
      courtDocs?: string;
      hearingPrep?: string;
    };

    const sessionId = body.sessionId?.trim();
    const caseId = body.caseId?.trim();

    if (!sessionId) {
      return jsonResponse({ error: "Missing sessionId" }, 400);
    }
    if (!caseId || !UUID_RE.test(caseId)) {
      return jsonResponse({ error: "Invalid or missing caseId" }, 400);
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return jsonResponse({ error: "Payment not completed" }, 400);
    }

    const metaCaseId = session.metadata?.caseId?.trim();
    if (!metaCaseId || metaCaseId !== caseId) {
      return jsonResponse({ error: "Case does not match payment session" }, 403);
    }

    const updates: Record<string, string> = {};
    if (body.demandLetter?.trim()) {
      updates.demand_letter = body.demandLetter.trim();
    }
    if (body.courtDocs?.trim()) {
      updates.court_docs = body.courtDocs.trim();
    }
    if (body.hearingPrep?.trim()) {
      updates.hearing_prep = body.hearingPrep.trim();
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "No document content provided" }, 400);
    }

    const admin = getSupabaseAdmin();
    const { data: caseRow, error: fetchErr } = await admin
      .from("cases")
      .select("id,paid,tier_purchased")
      .eq("id", caseId)
      .maybeSingle();

    if (fetchErr || !caseRow) {
      return jsonResponse({ error: "Case not found" }, 404);
    }

    if (!caseRow.paid) {
      return jsonResponse({ error: "Purchase required" }, 403);
    }

    const { error: updateErr } = await admin
      .from("cases")
      .update(updates)
      .eq("id", caseId);

    if (updateErr) {
      console.error("Save after payment error:", updateErr.message);
      return jsonResponse({ error: "Failed to save documents" }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    console.error("Save after payment error:", err);
    return jsonResponse({ error: "Failed to save documents" }, 500);
  }
}
