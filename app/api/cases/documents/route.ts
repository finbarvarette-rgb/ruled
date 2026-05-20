import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      caseId?: string;
      demandLetter?: string;
      courtDocs?: string;
      hearingPrep?: string;
    };

    const caseId = body.caseId?.trim();
    if (!caseId || !UUID_RE.test(caseId)) {
      return jsonResponse({ error: "Invalid or missing caseId" }, 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonResponse({ error: "Sign in required" }, 401);
    }

    const admin = getSupabaseAdmin();
    const { data: caseRow, error: fetchErr } = await admin
      .from("cases")
      .select("id,user_id,email,paid,tier_purchased")
      .eq("id", caseId)
      .maybeSingle();

    if (fetchErr) {
      console.error("Save documents lookup error:", fetchErr.message);
      return jsonResponse({ error: "Failed to save documents" }, 500);
    }

    if (!caseRow) {
      return jsonResponse({ error: "Case not found" }, 404);
    }

    const owns =
      caseRow.user_id === user.id ||
      (user.email &&
        caseRow.email?.trim().toLowerCase() === user.email.trim().toLowerCase());

    if (!owns) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    if (!caseRow.paid) {
      return jsonResponse({ error: "Purchase required" }, 403);
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

    const { error: updateErr } = await admin
      .from("cases")
      .update(updates)
      .eq("id", caseId);

    if (updateErr) {
      console.error("Save documents error:", updateErr.message);
      return jsonResponse({ error: "Failed to save documents" }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    console.error("Save documents error:", err);
    return jsonResponse({ error: "Failed to save documents" }, 500);
  }
}
