import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";

const SYSTEM_PROMPT =
  "You are Ruled AI, a helpful Canadian legal information assistant. You help people understand small claims court, demand letters, and how to recover money they are owed. You provide legal information not legal advice. You are friendly, clear, and always suggest starting a free case assessment at ruled.ca when relevant. Never claim to be a lawyer.";

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages?: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages?.length) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const trimmed = messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .slice(-20)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content.trim(),
      }));

    if (!trimmed.length || trimmed[trimmed.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from the user" },
        { status: 400 }
      );
    }

    const response = await getAnthropicClient().messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: trimmed,
    });

    const answer =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    if (!answer.trim()) {
      return NextResponse.json(
        { error: "Empty response from assistant" },
        { status: 500 }
      );
    }

    return NextResponse.json({ answer: answer.trim() });
  } catch (err) {
    console.error("Ruled AI chat error:", err);
    return NextResponse.json(
      { error: "Failed to get a response. Please try again." },
      { status: 500 }
    );
  }
}
