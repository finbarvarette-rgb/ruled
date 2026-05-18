import { Resend } from "resend";

const FROM = "Ruled <hello@ruled.ca>";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

export function formatAssessmentEmailBody(assessment: string): string {
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

export async function sendAssessmentEmail(
  to: string,
  assessment: string
): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  const { error } = await client.emails.send({
    from: FROM,
    to,
    subject: "Your Ruled Case Assessment",
    text: formatAssessmentEmailBody(assessment),
  });

  if (error) {
    console.error("Resend assessment email error:", error);
    return false;
  }
  return true;
}

export async function sendPaymentConfirmationEmail(
  to: string,
  tier: string
): Promise<boolean> {
  const client = getResend();
  if (!client) return false;

  const isFull = tier === "full";
  const product = isFull ? "Full Case Pack" : "Demand Letter";
  const nextStep = isFull
    ? "Visit ruled.ca/full-case-pack to access your demand letter, court filing guide, hearing prep, and Q&A."
    : "Visit ruled.ca/demand to generate your demand letter, or check your dashboard for your assessment.";

  const text = `Payment confirmed — thank you.

You purchased: Ruled ${product}

${nextStep}

Questions? Reply to this email or contact hello@ruled.ca.

—
Ruled
Fight back. Win.
ruled.ca`;

  const { error } = await client.emails.send({
    from: FROM,
    to,
    subject: `Payment confirmed — Ruled ${product}`,
    text,
  });

  if (error) {
    console.error("Resend payment email error:", error);
    return false;
  }
  return true;
}

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
