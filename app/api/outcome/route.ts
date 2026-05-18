import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { caseId, outcome } = (await req.json()) as {
      caseId?: string;
      outcome?: string;
    };

    if (!caseId || (outcome !== "won" && outcome !== "lost")) {
      return NextResponse.json(
        { error: "Invalid caseId or outcome" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("cases")
      .update({ outcome })
      .eq("id", caseId);

    if (error) {
      console.error("Outcome update error:", error);
      return NextResponse.json(
        { error: "Failed to save outcome" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Outcome error:", err);
    return NextResponse.json(
      { error: "Failed to save outcome" },
      { status: 500 }
    );
  }
}
