"use client";

import { useState } from "react";
import Link from "next/link";
import type { Case } from "@/lib/supabase";
import { startCheckout } from "@/lib/checkout";
import { buildAssessmentSections } from "@/lib/pdf-generator";
import { Spinner } from "@/components/Spinner";
import {
  extractClaimAmount,
  generateCaseTitle,
} from "../../case-utils";
import { saveCaseToSession } from "../../components/dashboard-session";
import { dash } from "../../theme";

const BLUE = "#C8392B";
const NAVY = "#0F172A";
const AMBER = "#F59E0B";

const INCLUDED = [
  "Province-specific court filing instructions",
  "All court documents prepared for you",
  "Step-by-step hearing script — opening and closing statements",
  "Anticipated defence arguments and how to respond",
  "Day of court checklist",
  "Unlimited AI Q&A",
  "Everything downloadable as PDF",
];

const PACK_PREVIEW = `YOUR OPENING STATEMENT
Your Honour, my name is [Name] and I am here today because the defendant failed to complete contracted work after receiving payment in full.

PRESENTING YOUR EVIDENCE
1. Exhibit A — the signed agreement (what it requires)
2. Exhibit B — proof of payment (amount and date)
3. Exhibit C — photos of incomplete work

WHAT THE DEFENDANT WILL SAY
"They completed the job." Your response: the dated photos and messages show work stopped with key items unfinished.

DAY OF COURT CHECKLIST
☐ Photo ID and evidence binder (3 copies)
☐ Filed claim + claim number
☐ Opening and closing statements printed`;

function caseSummary(caseRecord: Case): string {
  const sections = buildAssessmentSections(
    caseRecord.case_assessment,
    caseRecord.intake_text,
    caseRecord.province
  );
  const summary = sections.find((s) => s.title === "Summary")?.content;
  if (summary?.trim()) {
    return summary.length > 420 ? `${summary.slice(0, 420)}…` : summary;
  }
  const intake = caseRecord.intake_text.trim();
  return intake.length > 420 ? `${intake.slice(0, 420)}…` : intake;
}

function PackPreview() {
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        borderLeft: `4px solid ${BLUE}`,
        boxShadow: dash.panel.boxShadow,
      }}
    >
      <div
        className="px-4 sm:px-6 py-6 text-left whitespace-pre-wrap text-sm leading-relaxed break-words"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: NAVY,
        }}
      >
        {PACK_PREVIEW}
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
        style={{
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(248, 247, 244, 0.35) 35%, rgba(248, 247, 244, 0.95) 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}

export function FullCasePackPurchase({ caseRecord }: { caseRecord: Case }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const title = generateCaseTitle(caseRecord);
  const amount = extractClaimAmount(
    caseRecord.case_assessment,
    caseRecord.intake_text
  );
  const summary = caseSummary(caseRecord);

  async function handleCheckout() {
    setError("");
    setLoading(true);
    saveCaseToSession(caseRecord);
    try {
      await startCheckout("full", caseRecord.id, caseRecord.email);
    } catch {
      setError("Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 py-8 md:py-10 max-w-3xl mx-auto w-full flex flex-col gap-8">
      <Link
        href="/dashboard/case-assessments"
        className="text-sm font-medium w-fit hover:underline"
        style={{ color: dash.mainMuted }}
      >
        ← Back to my cases
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: AMBER }}>
          Full Case Pack — $199
        </p>
        <h1
          className="text-2xl md:text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: NAVY }}
        >
          {title}
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: dash.mainMuted }}>
          Everything you need to file in {caseRecord.province} small claims court and
          present your case with confidence.
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm" style={{ color: dash.mainMuted }}>
          <span>{caseRecord.province}</span>
          {amount && (
            <>
              <span aria-hidden>·</span>
              <span>${Number(amount).toLocaleString("en-CA")} claimed</span>
            </>
          )}
        </div>
      </header>

      <section
        className="rounded-2xl p-5 sm:p-6 flex flex-col gap-3"
        style={{ ...dash.panel }}
      >
        <h2 className="text-sm font-semibold" style={{ color: NAVY }}>
          Your case summary
        </h2>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: dash.mainText }}>
          {summary}
        </p>
      </section>

      <section
        className="rounded-2xl p-5 sm:p-6 flex flex-col gap-4"
        style={{ ...dash.panel }}
      >
        <h2 className="text-sm font-semibold" style={{ color: NAVY }}>
          What&apos;s included
        </h2>
        <ul className="flex flex-col gap-2.5">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="shrink-0 font-bold" style={{ color: BLUE }}>
                ✓
              </span>
              <span style={{ color: dash.mainText }}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm text-center" style={{ color: dash.mainMuted }}>
          A preview of your personalized court pack
        </p>
        <PackPreview />
      </section>

      <div className="flex flex-col gap-3 pb-2">
        {error && (
          <p className="text-sm text-center" style={{ color: BLUE }}>
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={handleCheckout}
          className="w-full min-h-12 rounded-full px-6 py-4 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          style={{ background: BLUE, color: "#ffffff" }}
        >
          {loading && <Spinner />}
          {loading ? "Redirecting to checkout…" : "Get My Full Case Pack — $199"}
        </button>
      </div>
    </div>
  );
}
