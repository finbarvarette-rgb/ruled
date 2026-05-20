import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { caseId } = (await req.json()) as { caseId?: string };
    if (!caseId) {
      return NextResponse.json({ error: "caseId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = getSupabaseAdmin();
    const { data: caseRow, error: fetchErr } = await admin
      .from("cases")
      .select("id,user_id,email,demand_letter_sent_at")
      .eq("id", caseId)
      .single();

    if (fetchErr || !caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (user) {
      if (caseRow.user_id && caseRow.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (caseRow.user_id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    if (caseRow.demand_letter_sent_at) {
      return NextResponse.json({ ok: true, alreadyMarked: true });
    }

    const { error: updateErr } = await admin
      .from("cases")
      .update({ demand_letter_sent_at: new Date().toISOString() })
      .eq("id", caseId);

    if (updateErr) {
      console.error("mark-demand-sent update error:", updateErr);
      return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mark-demand-sent error:", err);
    return NextResponse.json({ error: "Failed to mark sent" }, { status: 500 });
  }
}
