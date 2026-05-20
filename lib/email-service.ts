import { Resend } from "resend";

const FROM = "Ruled <hello@ruled.ca>";

export const EMAIL_BRAND = {
  navy: "#0F172A",
  blue: "#2563EB",
  amber: "#F59E0B",
  green: "#10B981",
  muted: "#64748B",
  surface: "#F1F5F9",
  border: "#E2E8F0",
  white: "#FFFFFF",
  bg: "#FAFAFA",
} as const;

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://ruled.ca").replace(/\/$/, "");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(body: string, preheader?: string): string {
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ruled</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${EMAIL_BRAND.white};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${EMAIL_BRAND.navy};">ruled</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${EMAIL_BRAND.blue};">.ca</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:${EMAIL_BRAND.navy};font-size:15px;line-height:1.6;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background:${EMAIL_BRAND.surface};border-top:1px solid ${EMAIL_BRAND.border};font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};">
              Ruled provides legal information, not legal advice. We are not a law firm.<br />
              Questions? Reply to this email or contact <a href="mailto:hello@ruled.ca" style="color:${EMAIL_BRAND.blue};">hello@ruled.ca</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function cta(href: string, label: string): string {
  return `<p style="margin:28px 0 0;">
    <a href="${href}" style="display:inline-block;background:${EMAIL_BRAND.blue};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 28px;border-radius:9999px;">${escapeHtml(label)}</a>
  </p>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${EMAIL_BRAND.navy};line-height:1.3;">${escapeHtml(text)}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;color:${EMAIL_BRAND.navy};">${text}</p>`;
}

function amberNote(text: string): string {
  return `<p style="margin:16px 0 0;padding:14px 16px;background:#FFFBEB;border-left:4px solid ${EMAIL_BRAND.amber};border-radius:0 8px 8px 0;color:${EMAIL_BRAND.navy};font-size:14px;">${text}</p>`;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  const { error } = await client.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    console.error("Resend send error:", error);
    return false;
  }
  return true;
}

/** Welcome — account created */
export async function sendWelcomeEmail(
  to: string,
  firstName?: string | null
): Promise<boolean> {
  const appUrl = getAppUrl();
  const name = firstName?.trim() ? escapeHtml(firstName.trim()) : "there";
  const html = layout(
    `${heading("Welcome to Ruled")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph("You&rsquo;re in the right place. Ruled helps Canadians fight back in small claims disputes&nbsp;&mdash; without hiring a lawyer.")}
    ${paragraph("Your free case assessment is the best place to start. Tell us what happened and we&rsquo;ll analyze your case in plain English.")}
    ${cta(`${appUrl}/onboarding`, "Start your free assessment")}
    ${amberNote("<strong>Tip:</strong> Save your assessment and demand letters in your dashboard so you can pick up anytime.")}`,
    "Your account is ready — start your free case assessment"
  );
  const text = `Welcome to Ruled

Hi ${firstName?.trim() || "there"},

You're in the right place. Ruled helps Canadians fight back in small claims disputes without hiring a lawyer.

Start your free assessment: ${appUrl}/onboarding

— Ruled · hello@ruled.ca`;

  return sendEmail({
    to,
    subject: "Welcome to Ruled — let's get your money back",
    html,
    text,
  });
}

/** Case assessment ready */
export function formatAssessmentPlainText(assessment: string): string {
  const sections = [
    "CASE STRENGTH",
    "LEGAL BASIS",
    "KEY EVIDENCE IN YOUR FAVOUR",
    "WEAKNESSES",
    "WHAT THE OTHER SIDE WILL ARGUE",
    "RECOMMENDED NEXT STEP",
    "ESTIMATED CLAIM AMOUNT",
    "PROVINCE RULES",
  ];

  let body = "YOUR RULED CASE ASSESSMENT\n";
  body += "═".repeat(40) + "\n\n";

  let remaining = assessment;
  for (let i = 0; i < sections.length; i++) {
    const header = sections[i];
    const next = sections[i + 1];
    const idx = remaining.indexOf(header);
    if (idx === -1) continue;
    const start = idx + header.length;
    const end = next ? remaining.indexOf(next) : remaining.length;
    const content = remaining
      .slice(start, end === -1 ? remaining.length : end)
      .trim();
    body += `${header}\n${"-".repeat(header.length)}\n${content}\n\n`;
  }

  if (body.trim() === "YOUR RULED CASE ASSESSMENT\n" + "═".repeat(40)) {
    body += assessment + "\n\n";
  }

  body +=
    "─".repeat(40) +
    "\nRuled provides legal information, not legal advice.\nruled.ca";

  return body;
}

export async function sendCaseAssessmentDeliveryEmail(
  to: string,
  options: { caseId?: string | null; assessment: string }
): Promise<boolean> {
  const appUrl = getAppUrl();
  const resultsUrl = options.caseId
    ? `${appUrl}/results?case=${options.caseId}`
    : `${appUrl}/results`;
  const dashboardUrl = `${appUrl}/dashboard`;

  const html = layout(
    `${heading("Your case assessment is ready")}
    ${paragraph("We&rsquo;ve analyzed your case. Here&rsquo;s what you need to know&nbsp;&mdash; case strength, legal basis, evidence, and your recommended next step.")}
    ${cta(resultsUrl, "View your assessment")}
    ${paragraph(`Or open your <a href="${dashboardUrl}" style="color:${EMAIL_BRAND.blue};">dashboard</a> anytime.`)}
    ${amberNote("<strong>Next step:</strong> Many disputes resolve with a formal demand letter ($49) before going to court.")}`,
    "Your structured case analysis is ready to review"
  );

  const text = `Your case assessment is ready

View it here: ${resultsUrl}
Dashboard: ${dashboardUrl}

${formatAssessmentPlainText(options.assessment)}

— Ruled · hello@ruled.ca`;

  return sendEmail({
    to,
    subject: "Your case assessment is ready",
    html,
    text,
  });
}

/** Demand letter purchased & generated */
export async function sendDemandLetterDeliveryEmail(
  to: string,
  caseId?: string | null
): Promise<boolean> {
  const appUrl = getAppUrl();
  const letterUrl = caseId
    ? `${appUrl}/success/demand-letter?case=${caseId}`
    : `${appUrl}/success/demand-letter`;

  const html = layout(
    `${heading("Your demand letter is ready to send")}
    ${paragraph("Your personalized demand letter is drafted and waiting in your account. Review it, download it, and send it by email and registered mail.")}
    ${cta(letterUrl, "Open your demand letter")}
    ${paragraph("After you send it, note the date&nbsp;&mdash; your 14-day response window starts when they receive the letter.")}
    ${amberNote("<strong>Remember:</strong> Keep proof you sent it (read receipt, tracking, or mailing receipt).")}`,
    "Your demand letter is ready — review and send today"
  );

  const text = `Your demand letter is ready to send

Open it here: ${letterUrl}

After you send it, note the date — your 14-day response window starts when they receive the letter.

— Ruled · hello@ruled.ca`;

  return sendEmail({
    to,
    subject: "Your demand letter is ready to send",
    html,
    text,
  });
}

/** Full case pack purchased & generated */
export async function sendFullCasePackDeliveryEmail(
  to: string,
  caseId?: string | null
): Promise<boolean> {
  const appUrl = getAppUrl();
  const packUrl = caseId
    ? `${appUrl}/success/full-case-pack?case=${caseId}`
    : `${appUrl}/success/full-case-pack`;

  const html = layout(
    `${heading("Your full case pack is ready")}
    ${paragraph("You&rsquo;re prepared to win. Your pack includes your demand letter, court filing guide, hearing prep, and everything you need to move forward.")}
    ${cta(packUrl, "Open your case pack")}
    ${paragraph("Review each section before filing or attending your hearing.")}
    ${amberNote("<strong>You&rsquo;ve got this:</strong> Small claims court is built for self-represented Canadians.")}`,
    "Demand letter, court docs, and hearing prep — all in one place"
  );

  const text = `Your full case pack is ready — you're prepared to win

Open your pack: ${packUrl}

— Ruled · hello@ruled.ca`;

  return sendEmail({
    to,
    subject: "Your full case pack is ready — you're prepared to win",
    html,
    text,
  });
}

/** 14 days after demand letter marked as sent */
export async function sendDemandReminderEmail(
  to: string,
  options: { province?: string | null; caseId?: string | null }
): Promise<boolean> {
  const appUrl = getAppUrl();
  const demandUrl = options.caseId
    ? `${appUrl}/success/demand-letter?case=${options.caseId}`
    : `${appUrl}/success/demand-letter`;
  const provinceLabel = options.province?.trim()
    ? escapeHtml(options.province.trim())
    : "your province";

  const html = layout(
    `${heading("Have they responded yet?")}
    ${paragraph("It&rsquo;s been 14 days since you sent your demand letter. If the other party hasn&rsquo;t paid or responded, your next step is usually filing in small claims court.")}
    ${cta(`${appUrl}/full-case-pack-preview`, "Get your Full Case Pack — $199")}
    ${paragraph(`<a href="${demandUrl}" style="color:${EMAIL_BRAND.blue};">Review your demand letter and timeline</a>`)}
    ${amberNote(`Your case was analyzed for <strong>${provinceLabel}</strong> rules. Filing limits and fees vary by province.`)}`,
    "14 days since your demand letter — time to plan your next move"
  );

  const text = `Have they responded yet?

It's been 14 days since you sent your demand letter. If they haven't paid or responded, consider filing in small claims court.

Full Case Pack ($199): ${appUrl}/full-case-pack-preview
Review your letter: ${demandUrl}

— Ruled · hello@ruled.ca`;

  return sendEmail({
    to,
    subject: "Have they responded yet?",
    html,
    text,
  });
}

/** Contact form (internal) */
export async function sendContactFormEmail(
  name: string,
  email: string,
  message: string
): Promise<boolean> {
  const client = getResend();
  if (!client) return false;

  const { error } = await client.emails.send({
    from: FROM,
    to: "hello@ruled.ca",
    replyTo: email,
    subject: `Contact form — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });

  if (error) {
    console.error("Resend contact email error:", error);
    return false;
  }
  return true;
}
