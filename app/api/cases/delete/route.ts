import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
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

    // Verify the case belongs to this user before deleting anything
    const { data: caseRow, error: fetchError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Delete evidence files from storage
    const { data: files } = await supabase.storage
      .from("evidence")
      .list(caseId);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${caseId}/${f.name}`);
      await supabase.storage.from("evidence").remove(paths);
    }

    // Delete case_evidence records
    await supabase.from("case_evidence").delete().eq("case_id", caseId);

    // Delete the case row
    const { error: deleteError } = await supabase
      .from("cases")
      .delete()
      .eq("id", caseId)
      .eq("user_id", user.id);

    if (deleteError) {
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
