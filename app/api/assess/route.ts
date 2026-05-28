import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "@/lib/supabase";
import { FORMATTING_RULE, sanitizeText } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { sendCaseAssessmentDeliveryEmail } from "@/lib/email-service";

const SYSTEM_PROMPT = `${FORMATTING_RULE}You are a Canadian small claims court specialist. Your job is to assess a claimant's case based ONLY on what they explicitly told you. You are not a lawyer and do not provide legal advice — you provide legal information and procedural guidance only.

CRITICAL RULES — follow these exactly:
- Only reference evidence the claimant explicitly confirmed having. If they said "None of the above" for evidence, do not invent or imply evidence.
- If they said they have NO written contract, never mention a contract in a positive light.
- Begin every evidence bullet with "You indicated that..." or "Based on what you described..."
- If intake information is thin or vague, say so honestly — do not pad the assessment with assumptions.
- Never infer facts not provided. Do not fill gaps with guesses.
- Base the estimated claim amount on the dollar figure they gave you, not an estimate.
- Every section must open with a complete sentence that has its own subject and verb. Never begin any section content with a word or phrase starting with "to" (e.g. never write "to Weak", "to Moderate", "to Strong" as the start of content). Do not combine ratings with "to" (e.g. do not write "Moderate to Weak" or "Strong to Moderate").

For every case, output these exact section headers:

CASE STRENGTH
Write the rating word (Strong, Moderate, or Weak) as a standalone word, then on the next line write one complete explanation sentence beginning with a subject (e.g. "This case is...", "The claimant has...", "Without a written contract..."). Do not combine two ratings with "to".

LEGAL BASIS
What law or principle supports their claim in plain English. No jargon.

KEY EVIDENCE IN YOUR FAVOUR
Bullet list. Each point must start with "You indicated that..." or "Based on what you described...". Only include evidence they confirmed having. If they confirmed no evidence, say so honestly.

WEAKNESSES
Honest assessment of what could hurt their case, including any gaps in what they described.

WHAT THE OTHER SIDE WILL ARGUE
Anticipate the defence based on the reason they gave (if any) or the nature of the dispute.

RECOMMENDED NEXT STEP
One of: Send demand letter first, File immediately, or Gather more evidence. Brief explanation.

ESTIMATED CLAIM AMOUNT
Use the exact dollar figure they provided.

PROVINCE RULES
Confirm which province's rules apply, the small claims filing limit, and the approximate filing fee.

Write like a knowledgeable friend, not a lawyer billing by the hour. Be direct and honest. If the information provided is limited, say so rather than generating a superficial assessment.`;

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
    const { intake, province, email: bodyEmail } = body as {
      intake: string;
      province: string;
      email?: string;
    };

    if (!intake || !province) {
      return NextResponse.json(
        { error: "Missing intake or province" },
        { status: 400 }
      );
    }

    const totalWords = intake.trim().split(/\s+/).filter(Boolean).length;
    if (totalWords < 50) {
      return NextResponse.json(
        { error: "Please provide more detail about your situation. We need at least a brief description of what happened to generate a useful assessment." },
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
    const rawAssessment =
      firstBlock?.type === "text" ? firstBlock.text : "";
    const assessment = sanitizeText(rawAssessment);

    let caseId: string | null = null;
    try {
      // Attach authenticated user + email if available
      let userId: string | null = null;
      let userEmail: string | null = null;
      try {
        const serverClient = await createClient();
        const {
          data: { user },
        } = await serverClient.auth.getUser();
        if (user) {
          userId = user.id;
          userEmail = user.email ?? null;
        }
      } catch { /* anonymous assessment is fine */ }

      // IMPORTANT: use the authenticated server client for inserts when logged in,
      // otherwise the case may be written without a user/email link, making it
      // invisible to the dashboard under RLS.
      const caseEmail = userEmail ?? bodyEmail?.trim() ?? null;
      const insertPayload = {
        intake_text: intake,
        province,
        case_assessment: assessment,
        ...(userId ? { user_id: userId } : {}),
        ...(caseEmail ? { email: caseEmail } : {}),
      };

      const { data, error: dbErr } = userId
        ? await (await createClient())
            .from("cases")
            .insert(insertPayload)
            .select("id")
            .single()
        : await getSupabase()
            .from("cases")
            .insert(insertPayload)
            .select("id")
            .single();

      if (dbErr) console.error("Supabase insert error:", dbErr);
      else if (data) caseId = data.id;

      const deliveryEmail = caseEmail;
      if (deliveryEmail && caseId) {
        const { data: existing } = await getSupabase()
          .from("cases")
          .select("assessment_email_sent_at")
          .eq("id", caseId)
          .single();

        if (!existing?.assessment_email_sent_at) {
          const sent = await sendCaseAssessmentDeliveryEmail(deliveryEmail, {
            caseId,
            assessment,
          });
          if (sent) {
            await getSupabase()
              .from("cases")
              .update({ assessment_email_sent_at: new Date().toISOString() })
              .eq("id", caseId);
          }
        }
      }
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
