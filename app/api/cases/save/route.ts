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

    const body = (await req.json()) as {
      caseId?: string | null;
      assessment?: string;
      intake?: string;
      province?: string;
    };

    const assessment = body.assessment?.trim() ?? "";
    const intake = body.intake?.trim() ?? "";
    const province = body.province?.trim() ?? "";

    if (!assessment || !intake || !province) {
      return NextResponse.json(
        { error: "Missing assessment, intake, or province" },
        { status: 400 }
      );
    }

    const email = user.email ?? null;

    // If we already have a case id, ensure it's linked to this user/email.
    if (body.caseId) {
      const { error } = await supabase
        .from("cases")
        .update({ user_id: user.id, email })
        .eq("id", body.caseId);

      if (error) {
        // If this row was created without a link, RLS may block updates.
        // Fall back to inserting a fresh, correctly-linked case so the
        // assessment is still saved for the user.
        const { data: inserted, error: insertErr } = await supabase
          .from("cases")
          .insert({
            intake_text: intake,
            province,
            case_assessment: assessment,
            user_id: user.id,
            email,
          })
          .select("id")
          .single();

        if (insertErr || !inserted?.id) {
          return NextResponse.json(
            {
              error: `Failed to save assessment (${insertErr?.message ?? error.message})`,
            },
            { status: 500 }
          );
        }

        return NextResponse.json({ caseId: inserted.id });
      }

      return NextResponse.json({ caseId: body.caseId });
    }

    // Otherwise, create a new case row tied to the authenticated user.
    const { data, error } = await supabase
      .from("cases")
      .insert({
        intake_text: intake,
        province,
        case_assessment: assessment,
        user_id: user.id,
        email,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return NextResponse.json(
        { error: `Failed to save assessment (${error?.message ?? "unknown"})` },
        { status: 500 }
      );
    }

    return NextResponse.json({ caseId: data.id });
  } catch (err) {
    console.error("Save assessment error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Failed to save assessment (${err.message})`
            : "Failed to save assessment",
      },
      { status: 500 }
    );
  }
}

