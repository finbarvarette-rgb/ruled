import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { FORMATTING_RULE } from "@/lib/prompts";

const SYSTEM_PROMPT = `${FORMATTING_RULE}You are a Canadian small claims court specialist answering questions for someone preparing their case. You have full context of their case assessment. Answer questions directly and practically. If asked something outside your knowledge say so clearly. Always remind them at the end of answers that you provide legal information not legal advice.`;

export async function POST(req: NextRequest) {
  try {
    const { question, caseAssessment, history } = (await req.json()) as {
      question?: string;
      caseAssessment?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!question || !caseAssessment) {
      return NextResponse.json(
        { error: "Missing question or caseAssessment" },
        { status: 400 }
      );
    }

    const messages: { role: "user" | "assistant"; content: string }[] = [
      {
        role: "user",
        content: `Case assessment:\n${caseAssessment}\n\nI will ask questions about this case.`,
      },
      {
        role: "assistant",
        content:
          "I have reviewed your case assessment. Ask me anything about your small claims case, filing, evidence, or hearing preparation.",
      },
    ];

    if (history?.length) {
      for (const msg of history.slice(-8)) {
        messages.push(msg);
      }
    }

    messages.push({ role: "user", content: question });

    const message = await getAnthropicClient().messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const answer =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Case QA error:", err);
    return NextResponse.json(
      { error: "Failed to answer question" },
      { status: 500 }
    );
  }
}
