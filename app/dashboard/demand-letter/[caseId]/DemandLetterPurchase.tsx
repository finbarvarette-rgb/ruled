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

const BLUE = "#2563EB";
const NAVY = "#0F172A";

const INCLUDED = [
  "Custom demand letter based on your case details",
  "Proper legal language and tone",
  "14-day payment demand (standard legal timeline)",
  "Step-by-step sending instructions",
  "What to expect after sending",
  "Saved to your dashboard",
];

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

function SampleLetterPreview() {
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
        className="px-4 sm:px-6 py-6 text-left break-words"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: NAVY,
        }}
      >
        <p className="text-sm leading-relaxed">Alex Morgan</p>
        <p className="text-sm leading-relaxed">Morgan Contracting</p>
        <p className="text-sm leading-relaxed mb-4">alex.morgan@email.com</p>
        <p className="text-sm leading-relaxed mb-4">May 18, 2026</p>
        <p className="text-sm leading-relaxed mb-4">
          Summit Renovations Ltd.
          <br />
          456 King Street West, Toronto, ON M5H 1A1
        </p>
        <p className="text-sm font-semibold mb-3">
          RE: Formal Demand for Payment — $5,000.00
        </p>
        <p className="text-sm leading-relaxed">
          Dear Summit Renovations Ltd., I am writing regarding the renovation
          contract we entered into on March 1, 2026. I paid a deposit of
          $5,000.00 on March 5, 2026. You began work but ceased before
          completion and have not responded to my requests to resolve this
          matter.
        </p>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-[58%] pointer-events-none"
        style={{
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(248, 247, 244, 0.4) 35%, rgba(248, 247, 244, 0.95) 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}

export function DemandLetterPurchase({ caseRecord }: { caseRecord: Case }) {
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
      await startCheckout("demand", caseRecord.id, caseRecord.email);
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
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: BLUE }}>
          Demand Letter — $49
        </p>
        <h1
          className="text-2xl md:text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: NAVY }}
        >
          {title}
        </h1>
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
          Your letter will look like this — personalized to your case
        </p>
        <SampleLetterPreview />
      </section>

      <div className="flex flex-col gap-3 sticky bottom-0 pb-2">
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
          {loading ? "Redirecting to checkout…" : "Generate My Demand Letter — $49"}
        </button>
      </div>
    </div>
  );
}
