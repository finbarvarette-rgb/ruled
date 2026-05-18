import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";

const SYSTEM_PROMPT = `You are a Canadian small claims court advisor helping a self-represented claimant understand their case. Answer in plain English, 2-4 short paragraphs max. You provide legal information, not legal advice. You are not a lawyer. Base every answer on the case assessment provided. Be direct and practical. No markdown formatting.`;

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
