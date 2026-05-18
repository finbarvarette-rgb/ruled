import { NextRequest, NextResponse } from "next/server";
import { sendAssessmentEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, assessment } = (await req.json()) as {
      email?: string;
      assessment?: string;
    };

    const trimmedEmail = email?.trim();
    if (!trimmedEmail || !assessment) {
      return NextResponse.json(
        { error: "Email and assessment are required" },
        { status: 400 }
      );
    }

    const sent = await sendAssessmentEmail(trimmedEmail, assessment);
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
