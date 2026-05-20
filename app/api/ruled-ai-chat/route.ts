import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";

const SYSTEM_PROMPT =
  "You are Ruled AI, a friendly Canadian legal information assistant built into ruled.ca. Keep responses short, clear, and conversational — maximum 3-4 sentences or a short bullet list. Never write long essays. Use plain language, no legal jargon. Do not use markdown headers (##). You can use bold for key terms and short bullet lists when helpful, but keep it minimal. Always be warm and direct. If someone describes a situation, give them a quick take and suggest next steps. You provide legal information not legal advice. Never claim to be a lawyer. After 2-3 exchanges with a logged-out user, naturally suggest starting a free case assessment at ruled.ca.";

export async function POST(req: NextRequest) {
  try {
    const { messages, loggedIn } = (await req.json()) as {
      messages?: { role: "user" | "assistant"; content: string }[];
      loggedIn?: boolean;
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

    const userTurns = trimmed.filter((m) => m.role === "user").length;
    let system = SYSTEM_PROMPT;
    if (loggedIn === false && userTurns >= 2) {
      system +=
        "\n\nThis visitor is not signed in and has already had a few messages with you. When it fits the conversation, naturally mention the free case assessment at ruled.ca — do not sound salesy.";
    }

    const response = await getAnthropicClient().messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 400,
      system,
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
