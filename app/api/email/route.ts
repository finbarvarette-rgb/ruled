import { NextRequest, NextResponse } from "next/server";
import { sendCaseAssessmentDeliveryEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const { email, assessment, caseId } = (await req.json()) as {
      email?: string;
      assessment?: string;
      caseId?: string;
    };

    const trimmedEmail = email?.trim();
    if (!trimmedEmail || !assessment) {
      return NextResponse.json(
        { error: "Email and assessment are required" },
        { status: 400 }
      );
    }

    const sent = await sendCaseAssessmentDeliveryEmail(trimmedEmail, {
      assessment,
      caseId: caseId ?? null,
    });
    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email API error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
