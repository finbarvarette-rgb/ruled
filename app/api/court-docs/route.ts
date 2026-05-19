import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { FORMATTING_RULE } from "@/lib/prompts";

const SYSTEM_PROMPT = `${FORMATTING_RULE}You are a Canadian small claims court filing specialist. Based on the case assessment and province provided, give the claimant everything they need to physically file their claim. Structure your response as follows:

COURT NAME AND ADDRESS
The exact court they need to visit or mail documents to based on the province and case description.

FILING FEE
Exact amount for their claim size.

WHAT TO BRING
Numbered list of every document they must bring: completed claim form, copies of evidence, copy of demand letter, government ID, payment for filing fee.

HOW TO FILL THE CLAIM FORM
Step by step instructions for completing their province-specific small claims form. What to write in each field.

WHAT HAPPENS AFTER FILING
Exact timeline: when defendant gets served, when they must respond, when the hearing gets scheduled.

SERVICE OF DOCUMENTS
How to serve the defendant, what methods are allowed in their province, what proof of service looks like.

IMPORTANT DEADLINES
Limitation periods and any other critical dates.

Be extremely specific and practical. This person has never done this before.`;

export async function POST(req: NextRequest) {
  try {
    const { caseAssessment, province } = (await req.json()) as {
      caseAssessment?: string;
      province?: string;
    };

    if (!caseAssessment || !province) {
      return NextResponse.json(
        { error: "Missing caseAssessment or province" },
        { status: 400 }
      );
    }

    const message = await getAnthropicClient().messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Province: ${province}\n\nCase assessment:\n${caseAssessment}`,
        },
      ],
    });

    const content =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Court docs error:", err);
    return NextResponse.json(
      { error: "Failed to generate court documents guidance" },
      { status: 500 }
    );
  }
}
