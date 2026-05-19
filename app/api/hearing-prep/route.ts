import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { FORMATTING_RULE } from "@/lib/prompts";

const SYSTEM_PROMPT = `${FORMATTING_RULE}You are a Canadian small claims court hearing coach. Based on the case assessment provided, prepare this person completely for their hearing day. Structure as follows:

BEFORE THE HEARING
What to do in the week before: organize evidence, make copies, prepare your evidence binder (what goes in it and in what order), practice your opening statement.

WHAT TO WEAR AND HOW TO ACT
Specific guidance on appearance and demeanor. Judges notice everything.

WHEN YOU ARRIVE
What to do when you get to the courthouse, how to check in, where to sit, what to expect.

YOUR OPENING STATEMENT
Write a complete word-for-word opening statement script personalized to their specific case facts. It should be 2-3 minutes when read aloud. Start with: Your Honour, my name is [name] and I am here today because...

PRESENTING YOUR EVIDENCE
Exact order to present each piece of evidence. How to hand it to the judge. What to say for each item.

WHAT THE DEFENDANT WILL SAY
Based on the case assessment, list every argument the defendant is likely to make and give a specific rebuttal for each one.

YOUR CLOSING STATEMENT
Write a complete word-for-word closing statement.

KEY RULES
What you can and cannot say in small claims court. What to do if you do not know the answer to a question. How to address the judge.

AFTER THE HEARING
What happens next, how long for a decision, what if you win and they still do not pay (enforcement options).`;

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
      max_tokens: 4096,
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
