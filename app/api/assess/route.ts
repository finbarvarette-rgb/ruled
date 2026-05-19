import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "@/lib/supabase";
import { FORMATTING_RULE } from "@/lib/prompts";

const SYSTEM_PROMPT = `${FORMATTING_RULE}You are a Canadian small claims court specialist with deep knowledge of provincial small claims procedures, contract law, and evidence rules. Your job is to assess a claimant's case and produce a structured, plain-English case assessment. You are not a lawyer and do not provide legal advice — you provide legal information and procedural guidance only.

For every case you assess, output the following sections using these exact headers:

CASE STRENGTH
Rate as Strong, Moderate, or Weak. One sentence explanation.

LEGAL BASIS
What law or principle supports their claim in plain English. No jargon.

KEY EVIDENCE IN YOUR FAVOUR
Bullet list of what works for them based on what they described.

WEAKNESSES
Honest assessment of what could hurt their case.

WHAT THE OTHER SIDE WILL ARGUE
Anticipate the defence in plain English.

RECOMMENDED NEXT STEP
One of: Send demand letter first, File immediately, or Gather more evidence. Brief explanation.

ESTIMATED CLAIM AMOUNT
Based on what they described.

PROVINCE RULES
Confirm which province's rules apply, the small claims filing limit, and the approximate filing fee.

Write like a knowledgeable friend, not a lawyer billing by the hour. Be direct and honest.`;

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }
  return new Anthropic({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intake, province } = body as { intake: string; province: string };

    if (!intake || !province) {
      return NextResponse.json(
        { error: "Missing intake or province" },
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
          content: `Province: ${province}\n\nCase description:\n${intake}`,
        },
      ],
    });

    const firstBlock = message.content[0];
    const assessment =
      firstBlock?.type === "text" ? firstBlock.text : "";

    let caseId: string | null = null;
    try {
      const { data, error: dbErr } = await getSupabase()
        .from("cases")
        .insert({
          intake_text: intake,
          province,
          case_assessment: assessment,
        })
        .select("id")
        .single();

      if (dbErr) console.error("Supabase insert error:", dbErr);
      else if (data) caseId = data.id;
    } catch (dbErr) {
      console.error("Supabase insert error:", dbErr);
    }

    return NextResponse.json({ assessment, caseId });
  } catch (err) {
    console.error("Assessment error:", err);
    return NextResponse.json(
      { error: "Failed to generate assessment" },
      { status: 500 }
    );
  }
}
