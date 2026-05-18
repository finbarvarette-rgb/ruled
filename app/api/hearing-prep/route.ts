import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";

const SYSTEM_PROMPT = `You are a Canadian small claims court hearing coach. Write in plain text only — no markdown, no asterisks, no hashes. Structure your response with these exact section headers on their own lines:

OPENING STATEMENT
A script the claimant can read or memorize to open their case (2-3 short paragraphs).

KEY POINTS IN ORDER
Numbered list of the strongest points to make, in the order they should make them.

EVIDENCE PRESENTATION ORDER
Numbered order for presenting each piece of evidence, with a sentence on what to say for each.

ANTICIPATED DEFENCE AND REBUTTALS
For each likely defence argument, a short rebuttal the claimant can use.

CLOSING STATEMENT
A short closing script asking the judge for judgment in their favour.

PRESENTATION TIPS
What to wear, how to address the judge, body language, and tone — keep it practical and respectful.

Use the case assessment to make every section specific to this dispute.`;

export async function POST(req: NextRequest) {
  try {
    const { caseAssessment, province } = (await req.json()) as {
      caseAssessment?: string;
      province?: string;
    };

    if (!caseAssessment) {
      return NextResponse.json(
        { error: "Missing caseAssessment" },
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
          content: `Province: ${province ?? "Canada"}\n\nCase assessment:\n${caseAssessment}`,
        },
      ],
    });

    const content =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Hearing prep error:", err);
    return NextResponse.json(
      { error: "Failed to generate hearing preparation" },
      { status: 500 }
    );
  }
}
