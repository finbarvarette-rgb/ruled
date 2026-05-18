import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a Canadian legal document specialist drafting a formal demand letter for a small claims dispute. Write in plain text only — no markdown, no asterisks, no hashes, no bold formatting. Use this exact structure: Line 1: sender full name. Line 2: sender business name (omit if not provided). Line 3: sender email. Line 4: blank line. Line 5: date written out in full (e.g. May 18, 2026). Line 6: blank line. Line 7: defendant full name. Line 8: defendant address. Line 9: blank line. Line 10: RE: Formal Demand for Payment — $[amount]. Line 11: blank line. Then four paragraphs separated by blank lines: Paragraph 1 — state the contract, how it was formed, and that the work was performed. Paragraph 2 — state that payment was made and work was accepted, proving completion. Paragraph 3 — state the dispute, why the chargeback or non-payment is unjustified, and reference the evidence. Paragraph 4 — formal demand for $[amount] within 14 days of this letter, and that failure to pay will result in filing in [Province] Small Claims Court without further notice. End with: Yours truly, blank line, sender full name, sender business name if provided. Write firmly and professionally. Use the case assessment provided to make the letter factually specific to this dispute.`;

type DemandBody = {
  senderName: string;
  senderBusiness?: string;
  senderEmail: string;
  defendantName: string;
  defendantAddress: string;
  claimAmount: string;
  disputeDate: string;
  province: string;
  caseAssessment: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DemandBody;
    const {
      senderName,
      senderBusiness,
      senderEmail,
      defendantName,
      defendantAddress,
      claimAmount,
      disputeDate,
      province,
      caseAssessment,
    } = body;

    if (
      !senderName ||
      !senderEmail ||
      !defendantName ||
      !defendantAddress ||
      !claimAmount ||
      !disputeDate ||
      !province ||
      !caseAssessment
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userContent = [
      `Sender full name: ${senderName}`,
      senderBusiness ? `Sender business: ${senderBusiness}` : null,
      `Sender email: ${senderEmail}`,
      `Defendant full name: ${defendantName}`,
      `Defendant address: ${defendantAddress}`,
      `Claim amount: $${claimAmount}`,
      `Date of last payment or chargeback: ${disputeDate}`,
      `Province: ${province}`,
      "",
      "Case assessment:",
      caseAssessment,
    ]
      .filter(Boolean)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const letter =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ letter });
  } catch (err) {
    console.error("Demand letter error:", err);
    return NextResponse.json(
      { error: "Failed to generate demand letter" },
      { status: 500 }
    );
  }
}
