import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    // Use the auth-aware client only to verify identity
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const body = (await req.json()) as { caseId?: string };
    const caseId = body.caseId?.trim();

    if (!caseId) {
      return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
    }

    // Use the admin client for all DB/storage operations so RLS cannot silently
    // swallow the delete. We still enforce ownership explicitly via user_id.
    const admin = getSupabaseAdmin();

    // Verify ownership before touching anything
    const { data: caseRow, error: fetchError } = await admin
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !caseRow) {
      console.error("Delete case: ownership check failed", { caseId, userId: user.id, fetchError });
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Delete evidence files from storage
    const { data: files, error: listError } = await admin.storage
      .from("evidence")
      .list(caseId);

    if (listError) {
      console.error("Delete case: failed to list evidence files", listError);
    }

    if (files && files.length > 0) {
      const paths = files.map((f) => `${caseId}/${f.name}`);
      const { error: storageError } = await admin.storage.from("evidence").remove(paths);
      if (storageError) {
        console.error("Delete case: failed to remove evidence files", storageError);
      }
    }

    // Delete case_evidence records
    const { error: evidenceError } = await admin
      .from("case_evidence")
      .delete()
      .eq("case_id", caseId);

    if (evidenceError) {
      console.error("Delete case: failed to delete case_evidence rows", evidenceError);
    }

    // Delete the case row
    const { error: deleteError } = await admin
      .from("cases")
      .delete()
      .eq("id", caseId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Delete case: failed to delete case row", deleteError);
      return NextResponse.json(
        { error: `Failed to delete case (${deleteError.message})` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete case error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Failed to delete case (${err.message})`
            : "Failed to delete case",
      },
      { status: 500 }
    );
  }
}
