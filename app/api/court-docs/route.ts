import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";

const SYSTEM_PROMPT = `You are a Canadian small claims court filing specialist. Provide clear, plain-English guidance for filing a claim. Write in plain text only — no markdown, no asterisks, no hashes. Structure your response with these exact section headers on their own lines:

COURT NAME AND ADDRESS
List the exact small claims court name and full mailing/street address for the province provided.

STEP BY STEP FILING INSTRUCTIONS
Numbered steps from preparing the claim through serving the defendant.

DOCUMENTS TO BRING
Bullet list of every document and copy to bring when filing.

FILING FEE
State the current approximate filing fee for that province's small claims court.

WHAT TO SAY WHEN YOU ARRIVE
Brief script for what to tell the clerk at the counter.

Be specific to the province. Use the case assessment to tailor what documents they should emphasize.`;

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
      max_tokens: 2048,
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
