import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const CONTACT_RECIPIENT = "finbarvarette@gmail.com";

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

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: "Ruled <hello@ruled.ca>",
      to: CONTACT_RECIPIENT,
      replyTo: trimmedEmail,
      subject: `Contact form — ${trimmedName}`,
      text: `Name: ${trimmedName}\nEmail: ${trimmedEmail}\n\n${trimmedMessage}`,
    });

    const sent = !sendError;
    if (sendError) {
      console.error("Resend contact email error:", sendError);
    }
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
