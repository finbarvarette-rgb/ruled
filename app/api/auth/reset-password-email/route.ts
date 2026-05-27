import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const FROM = "Ruled <hello@ruled.ca>";

const BRAND = {
  navy: "#0F172A",
  blue: "#C8392B",
  amber: "#F59E0B",
  muted: "#64748B",
  surface: "#F1F5F9",
  border: "#E2E8F0",
  white: "#FFFFFF",
  bg: "#FAFAFA",
} as const;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resetPasswordEmailHtml(resetLink: string): string {
  const safeLink = escapeHtml(resetLink);
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.navy};line-height:1.3;">Reset your password</h1>
    <p style="margin:0 0 14px;color:${BRAND.navy};">We received a request to reset your Ruled account password. Click the button below to choose a new password.</p>
    <p style="margin:28px 0 0;">
      <a href="${safeLink}" style="display:inline-block;background:${BRAND.blue};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 28px;border-radius:9999px;">Reset password</a>
    </p>
    <p style="margin:16px 0 0;padding:14px 16px;background:#FFFBEB;border-left:4px solid ${BRAND.amber};border-radius:0 8px 8px 0;color:${BRAND.navy};font-size:14px;">
      This link expires soon. If you didn&rsquo;t request a reset, you can ignore this email.
    </p>
    <p style="margin:20px 0 0;font-size:13px;color:${BRAND.muted};">Or copy this link:<br /><a href="${safeLink}" style="color:${BRAND.blue};word-break:break-all;">${safeLink}</a></p>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reset your Ruled password</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Reset your Ruled password</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.white};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid ${BRAND.border};">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${BRAND.navy};">ruled</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${BRAND.blue};">.ca</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:${BRAND.navy};font-size:15px;line-height:1.6;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background:${BRAND.surface};border-top:1px solid ${BRAND.border};font-size:12px;line-height:1.5;color:${BRAND.muted};">
              Ruled provides legal information, not legal advice. We are not a law firm.<br />
              Questions? Contact <a href="mailto:hello@ruled.ca" style="color:${BRAND.blue};">hello@ruled.ca</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const trimmedEmail = email?.trim();

    if (!trimmedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email is not configured" },
        { status: 500 }
      );
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
    ).replace(/\/$/, "");
    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;

    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: trimmedEmail,
        options: { redirectTo },
      });

      const resetLink = data?.properties?.action_link;
      if (!error && resetLink) {
        const resend = new Resend(apiKey);
        const { error: sendError } = await resend.emails.send({
          from: FROM,
          to: trimmedEmail,
          subject: "Reset your Ruled password",
          html: resetPasswordEmailHtml(resetLink),
          text: `Reset your Ruled password\n\nOpen this link to set a new password:\n${resetLink}\n\nIf you didn't request this, you can ignore this email.\n\n— Ruled · hello@ruled.ca`,
        });

        if (sendError) {
          console.error("Resend password reset email error:", sendError);
          return NextResponse.json(
            { error: "Failed to send reset email" },
            { status: 500 }
          );
        }
      } else if (error) {
        console.error("Supabase generateLink error:", error.message);
      }
    } catch (err) {
      console.error("Password reset email error:", err);
      return NextResponse.json(
        { error: "Failed to send reset email" },
        { status: 500 }
      );
    }

    // Always succeed for valid email shape (avoid account enumeration)
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset-password-email route error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
