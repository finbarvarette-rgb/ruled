"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { startCheckout } from "@/lib/checkout";
import { Spinner } from "@/components/Spinner";
import { updateRuledSession, readRuledSession } from "@/lib/session";
import {
  parseCaseStrength,
  type CaseStrength,
} from "@/lib/case-strength";
import {
  m,
  marketingBtnPrimary,
  marketingBtnSecondary,
  marketingCard,
  marketingPageMain,
  marketingStrengthBadgeStyle,
} from "@/lib/marketing-theme";

const OLD_SECTION_HEADERS = [
  "CASE STRENGTH",
  "LEGAL BASIS",
  "KEY EVIDENCE IN YOUR FAVOUR",
  "WEAKNESSES",
  "WHAT THE OTHER SIDE WILL ARGUE",
  "RECOMMENDED NEXT STEP",
  "ESTIMATED CLAIM AMOUNT",
  "PROVINCE RULES",
];

const NEW_SECTION_HEADERS = [
  "Summary of Your Situation",
  "What Evidence You Have",
  "What the Other Side May Argue",
  "Strengths of Your Case",
  "Weaknesses / Risks to Consider",
  "Overall Conclusion",
];

const DEMAND_INCLUDES = [
  "Custom-drafted demand letter based on your specific case",
  "Sending instructions (email and registered mail)",
  "14-day payment deadline with legal language",
  "What to do if they don't respond",
  "Saved to your Ruled dashboard",
];

function verdictLabel(strength: CaseStrength): string {
  switch (strength) {
    case "Strong":
      return "Strong Case";
    case "Moderate":
      return "Moderate Case";
    case "Weak":
      return "Weak Case";
  }
}

function inferCaseType(intake: string): string {
  const t = intake.toLowerCase();
  if (/contractor|renovation|trades|construction|deposit/.test(t)) {
    return "Contractor / trades dispute";
  }
  if (/landlord|tenant|rent|lease|deposit/.test(t)) {
    return "Landlord / tenant dispute";
  }
  if (/invoice|client|business|supplier|chargeback/.test(t)) {
    return "Business / contract dispute";
  }
  if (/wedding|event|service/.test(t)) {
    return "Service dispute";
  }
  return "Small claims dispute";
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

function stripHashAndRuleLines(text: string): string {
  return normalizeNewlines(text)
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^[#\s]+$/.test(trimmed)) return false;
      if (/^[-*_]{3,}\s*$/.test(trimmed)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findSectionContent(
  text: string,
  header: string,
  allHeaders: string[]
): string {
  const cleaned = stripHashAndRuleLines(text);
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:^|\\n)\\s*(?:#{1,6}\\s+)?(${escaped})\\s*(?:\\n|$)`,
    "i"
  );
  const match = cleaned.match(re);
  if (!match || match.index === undefined) return "";

  const contentStart = match.index + match[0].length;
  let contentEnd = cleaned.length;

  for (const other of allHeaders) {
    if (other.toUpperCase() === header.toUpperCase()) continue;
    const otherEscaped = other.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const otherRe = new RegExp(
      `(?:^|\\n)\\s*(?:#{1,6}\\s+)?(${otherEscaped})\\s*(?:\\n|$)`,
      "i"
    );
    const otherMatch = cleaned.slice(contentStart).match(otherRe);
    if (otherMatch && otherMatch.index !== undefined) {
      const end = contentStart + otherMatch.index;
      if (end < contentEnd) contentEnd = end;
    }
  }

  return cleaned.slice(contentStart, contentEnd).trim();
}

function extractCaseStrengthDetail(text: string): string {
  const block = findSectionContent(text, "CASE STRENGTH", OLD_SECTION_HEADERS);
  if (!block) return "";
  return block
    .replace(/^(Strong|Moderate|Weak)[.\s]*/i, "")
    .trim();
}

function parseLegacySections(text: string) {
  const all = [...OLD_SECTION_HEADERS, ...NEW_SECTION_HEADERS];
  return {
    caseStrength: findSectionContent(text, "CASE STRENGTH", OLD_SECTION_HEADERS),
    legalBasis: findSectionContent(text, "LEGAL BASIS", OLD_SECTION_HEADERS),
    evidence: findSectionContent(
      text,
      "KEY EVIDENCE IN YOUR FAVOUR",
      OLD_SECTION_HEADERS
    ),
    weaknesses: findSectionContent(text, "WEAKNESSES", OLD_SECTION_HEADERS),
    otherSide: findSectionContent(
      text,
      "WHAT THE OTHER SIDE WILL ARGUE",
      OLD_SECTION_HEADERS
    ),
    nextStep: findSectionContent(
      text,
      "RECOMMENDED NEXT STEP",
      OLD_SECTION_HEADERS
    ),
    claimAmount: findSectionContent(
      text,
      "ESTIMATED CLAIM AMOUNT",
      OLD_SECTION_HEADERS
    ),
    provinceRules: findSectionContent(text, "PROVINCE RULES", OLD_SECTION_HEADERS),
    strengthDetail: extractCaseStrengthDetail(text),
    newFormat: {
      summary: findSectionContent(
        text,
        "Summary of Your Situation",
        NEW_SECTION_HEADERS
      ),
      evidence: findSectionContent(
        text,
        "What Evidence You Have",
        NEW_SECTION_HEADERS
      ),
      otherSide: findSectionContent(
        text,
        "What the Other Side May Argue",
        NEW_SECTION_HEADERS
      ),
      strengths: findSectionContent(
        text,
        "Strengths of Your Case",
        NEW_SECTION_HEADERS
      ),
      weaknesses: findSectionContent(
        text,
        "Weaknesses / Risks to Consider",
        NEW_SECTION_HEADERS
      ),
      conclusion: findSectionContent(
        text,
        "Overall Conclusion",
        NEW_SECTION_HEADERS
      ),
    },
  };
}

function buildDisplaySections(
  assessment: string,
  intake: string,
  province: string
) {
  const legacy = parseLegacySections(assessment);
  const hasNewFormat = Boolean(legacy.newFormat.summary);

  const applicableLawHeader = `Applicable Law in ${province || "Your Province"}`;

  if (hasNewFormat) {
    const applicableFromLegacy = [legacy.legalBasis, legacy.provinceRules]
      .filter(Boolean)
      .join("\n\n");
    return [
      {
        title: "Summary of Your Situation",
        content: legacy.newFormat.summary || intake,
      },
      {
        title: "What Evidence You Have",
        content: legacy.newFormat.evidence || legacy.evidence,
      },
      {
        title: "What the Other Side May Argue",
        content: legacy.newFormat.otherSide || legacy.otherSide,
      },
      {
        title: applicableLawHeader,
        content: applicableFromLegacy,
      },
      {
        title: "Strengths of Your Case",
        content: legacy.newFormat.strengths || legacy.evidence,
      },
      {
        title: "Weaknesses / Risks to Consider",
        content: legacy.newFormat.weaknesses || legacy.weaknesses,
      },
      {
        title: "Overall Conclusion",
        content:
          legacy.newFormat.conclusion ||
          [legacy.nextStep, legacy.claimAmount].filter(Boolean).join("\n\n"),
      },
    ].filter((s) => s.content.trim());
  }

  const summaryParts = [
    intake.trim(),
    legacy.strengthDetail || legacy.caseStrength,
  ].filter(Boolean);

  const applicableLaw = [legacy.legalBasis, legacy.provinceRules]
    .filter(Boolean)
    .join("\n\n");

  const conclusionParts = [
    legacy.strengthDetail,
    legacy.nextStep,
    legacy.claimAmount,
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    {
      title: "Summary of Your Situation",
      content: summaryParts.join("\n\n"),
    },
    {
      title: "What Evidence You Have",
      content: legacy.evidence,
    },
    {
      title: "What the Other Side May Argue",
      content: legacy.otherSide,
    },
    {
      title: applicableLawHeader,
      content: applicableLaw,
    },
    {
      title: "Strengths of Your Case",
      content: legacy.evidence || legacy.legalBasis,
    },
    {
      title: "Weaknesses / Risks to Consider",
      content: legacy.weaknesses,
    },
    {
      title: "Overall Conclusion",
      content: conclusionParts,
    },
  ].filter((s) => s.content.trim());
}

function AssessmentBody({ content }: { content: string }) {
  const lines = stripHashAndRuleLines(content).split("\n");
  const elements: React.ReactNode[] = [];
  const pendingList: string[] = [];
  let k = 0;

  function flushList() {
    if (pendingList.length === 0) return;
    elements.push(
      <ul
        key={k++}
        className="list-disc pl-5 flex flex-col gap-1.5 marker:text-[#2563EB]"
        style={{ color: m.subtext }}
      >
        {pendingList.map((item, i) => (
          <li key={i} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    );
    pendingList.length = 0;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    const bullet = trimmed.match(/^(?:\s*[-*•]\s*)+(.+)$/);
    if (bullet) {
      pendingList.push(bullet[1].trim());
      continue;
    }
    flushList();
    elements.push(
      <p key={k++} className="leading-relaxed" style={{ color: m.subtext }}>
        {trimmed}
      </p>
    );
  }
  flushList();
  return <div className="flex flex-col gap-2">{elements}</div>;
}

function DemandLetterPreview() {
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: m.white,
        border: `1px solid ${m.border}`,
      }}
    >
      <div
        className="px-4 sm:px-6 py-5 text-left break-words"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: m.text,
        }}
      >
        <p className="text-xs font-bold tracking-widest uppercase mb-3">
          Formal Demand for Payment
        </p>
        <p className="text-sm leading-relaxed mb-2">[Date]</p>
        <p className="text-sm leading-relaxed mb-4">
          [Defendant Name]
          <br />
          [Defendant Address]
        </p>
        <p className="text-sm font-semibold mb-3">
          RE: Formal Demand for Payment — $[Amount]
        </p>
        <p className="text-sm leading-relaxed">
          Dear [Defendant Name], I am writing to formally demand payment of
          $[Amount] for [services/goods provided] on [date]. Despite repeated
          requests, this amount remains outstanding...
        </p>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none"
        style={{
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(250, 250, 250, 0.2) 40%, rgba(250, 250, 250, 0.85) 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [rawText, setRawText] = useState("");
  const [province, setProvince] = useState("");
  const [intake, setIntake] = useState("");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState<
    "demand" | "full" | null
  >(null);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    const s = readRuledSession();
    setRawText(s.assessment);
    setProvince(s.province);
    setIntake(s.intake);
    setCaseId(s.caseId);
    setEmail(s.email);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !rawText) router.replace("/onboarding");
  }, [mounted, rawText, router]);

  const strength = useMemo(() => parseCaseStrength(rawText), [rawText]);
  const caseType = useMemo(() => inferCaseType(intake), [intake]);
  const displaySections = useMemo(
    () => buildDisplaySections(rawText, intake, province),
    [rawText, intake, province]
  );

  function persistSessionForCheckout() {
    updateRuledSession({
      assessment: rawText,
      province,
      intake,
      caseId,
      email,
    });
  }

  async function handleCheckout(tier: "demand" | "full") {
    setCheckoutError("");
    setCheckoutLoading(tier);
    persistSessionForCheckout();
    try {
      await startCheckout(tier, caseId, email ?? undefined);
    } catch {
      setCheckoutError("Could not start checkout. Please try again.");
      setCheckoutLoading(null);
    }
  }

  async function handleSaveAssessment() {
    setSaveMessage("");
    setSaveLoading(true);
    persistSessionForCheckout();
    try {
      const res = await fetch("/api/cases/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          caseId,
          assessment: rawText,
          intake,
          province,
        }),
      });
      const data = (await res.json()) as { caseId?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Save failed");
      }
      if (data.caseId) {
        setCaseId(data.caseId);
        updateRuledSession({
          assessment: rawText,
          province,
          intake,
          caseId: data.caseId,
          email,
        });
      }
      setSaveMessage("Your assessment has been saved to your dashboard ✅");
    } catch (err) {
      setSaveMessage(
        err instanceof Error
          ? err.message
          : "Could not save your assessment. Please try again."
      );
    } finally {
      setSaveLoading(false);
    }
  }

  if (!mounted || !rawText) return null;

  const strengthStyle = strength ? marketingStrengthBadgeStyle(strength) : null;
  const isWeak = strength === "Weak";
  const nextHeadline = isWeak
    ? "Even a weaker case can benefit from a demand letter."
    : "You have a case worth pursuing. Here's your next move.";

  return (
    <main
      className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-10 md:py-14 overflow-x-hidden"
      style={marketingPageMain}
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 min-w-0">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <p
            className="text-xs font-medium tracking-wide uppercase"
            style={{ color: m.muted }}
          >
            Step 3 of 3 — Your results
          </p>
          <h1
            className="text-2xl md:text-3xl font-semibold tracking-tight break-words"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Your Case Assessment
          </h1>
          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              disabled={saveLoading}
              onClick={handleSaveAssessment}
              className="w-full sm:w-fit min-h-12 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              style={marketingBtnSecondary}
            >
              {saveLoading && <Spinner />}
              {saveLoading ? "Saving…" : "Save My Assessment"}
            </button>
            {saveMessage && (
              <p
                className="text-sm"
                style={{ color: saveMessage.includes("✅") ? m.green : m.blue }}
              >
                {saveMessage}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {province && (
              <span style={{ color: m.text }}>{province}</span>
            )}
            {province && (
              <span style={{ color: "#6b6560" }} aria-hidden>
                ·
              </span>
            )}
            <span style={{ color: m.subtext }}>{caseType}</span>
          </div>
          {strength && strengthStyle && (
            <span
              className="inline-flex self-start items-center text-sm font-bold px-4 py-2.5 rounded-full max-w-full break-words"
              style={strengthStyle}
            >
              {verdictLabel(strength)}
            </span>
          )}
        </header>

        {/* Assessment body */}
        <section className="flex flex-col gap-6">
          {displaySections.map((section) => (
            <article
              key={section.title}
              className="rounded-xl px-5 sm:px-6 py-5 flex flex-col gap-3"
              style={marketingCard}
            >
              <h2
                className="text-sm font-semibold tracking-tight break-words"
                style={{ color: m.text }}
              >
                {section.title}
              </h2>
              <AssessmentBody content={section.content} />
            </article>
          ))}
        </section>

        {/* What Should You Do Next? */}
        <section
          className="rounded-xl px-5 sm:px-6 py-6 md:py-8 flex flex-col gap-6"
          style={{
            ...marketingCard,
            border: `2px solid ${m.blue}`,
          }}
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight">
              What Should You Do Next?
            </h2>
            <p className="text-sm font-medium" style={{ color: m.blue }}>
              {nextHeadline}
            </p>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
            The fastest way to get your money back — before going to court — is a
            demand letter. It is a formal written notice that gives the other
            party one final chance to pay. About 40% of cases resolve at this
            stage alone, without ever filing in small claims court.
          </p>

          <DemandLetterPreview />

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold" style={{ color: m.text }}>
              What&apos;s included in your $49 demand letter:
            </p>
            <ul className="flex flex-col gap-2">
              {DEMAND_INCLUDES.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-relaxed"
                  style={{ color: m.subtext }}
                >
                  <span style={{ color: m.green }} aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {checkoutError && (
            <p className="text-sm" style={{ color: m.blue }}>
              {checkoutError}
            </p>
          )}

          <button
            type="button"
            disabled={checkoutLoading !== null}
            onClick={() => handleCheckout("demand")}
            className="w-full min-h-12 rounded-full px-6 py-4 text-base font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            style={marketingBtnPrimary}
          >
            {checkoutLoading === "demand" && <Spinner />}
            {checkoutLoading === "demand"
              ? "Redirecting to checkout…"
              : "Generate My Demand Letter — $49"}
          </button>

          <button
            type="button"
            disabled={checkoutLoading !== null}
            onClick={() => handleCheckout("full")}
            className="text-sm text-center cursor-pointer disabled:opacity-60 w-full min-h-11 py-2"
            style={{ color: m.muted }}
          >
            {checkoutLoading === "full"
              ? "Redirecting…"
              : "Skip to Full Case Pack — $199"}
          </button>

          <p
            className="text-xs text-center tracking-wide"
            style={{ color: m.muted }}
          >
            Secure checkout · Delivered in minutes · 30-day guarantee
          </p>
        </section>

        <p className="text-xs leading-relaxed pb-6" style={{ color: "#6b6560" }}>
          Ruled provides legal information, not legal advice. This is not a
          substitute for a lawyer.
        </p>
      </div>
    </main>
  );
}
