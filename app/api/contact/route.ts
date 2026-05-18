import { NextRequest, NextResponse } from "next/server";
import { sendContactFormEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = (await req.json()) as {
      name?: string;
      email?: string;
      message?: string;
    };

    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim();
    const trimmedMessage = message?.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const sent = await sendContactFormEmail(
      trimmedName,
      trimmedEmail,
      trimmedMessage
    );
    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
