"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Case } from "@/lib/supabase";
import { startCheckout } from "@/lib/checkout";
import { Spinner } from "@/components/Spinner";
import { extractClaimAmount, generateCaseTitle, getCaseMeta, getNextStep } from "../case-utils";
import { saveCaseToSession } from "../components/dashboard-session";
import { dash } from "../theme";
import {
  buildAssessmentSections,
  downloadAssessmentPdf,
} from "@/lib/pdf-generator";

const NAVY = "#0F172A";
const BODY_TEXT = "#0F172A";
const SECTION_BORDER = "#E2E8F0";

export function CaseAssessmentsClient({ cases }: { cases: Case[] }) {
  const [openCase, setOpenCase] = useState<Case | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<"demand" | "full" | null>(null);

  const sorted = useMemo(() => cases, [cases]);

  useEffect(() => {
    const target = sessionStorage.getItem("dashboard_open_case_id");
    if (!target) return;
    sessionStorage.removeItem("dashboard_open_case_id");
    const match = cases.find((c) => c.id === target);
    if (match) {
      setOpenCase(match);
    }
  }, [cases]);

  async function handleCheckout(tier: "demand" | "full", c: Case) {
    setCheckoutLoading(tier);
    saveCaseToSession(c);
    try {
      await startCheckout(tier, c.id, c.email);
    } catch {
      setCheckoutLoading(null);
    }
  }

  return (
    <main className="px-4 sm:px-6 py-8 md:py-10">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Case Assessments</h1>
          <p className="text-sm" style={{ color: dash.mainMuted }}>
            Your assessments, progress, and next steps.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {sorted.map((c) => {
            const meta = getCaseMeta(c);
            const next = getNextStep(c, meta);
            const amount = extractClaimAmount(c.case_assessment, c.intake_text);
            const title = generateCaseTitle(c);
            return (
              <article
                key={c.id}
                className="rounded-2xl p-6 flex flex-col gap-5"
                style={{ ...dash.panel }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex flex-col gap-2">
                    <h2 className="text-base font-semibold leading-snug truncate">
                      {title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: dash.mainMuted }}>
                      <span>{c.province}</span>
                      <span style={{ color: dash.rowDivider }}>•</span>
                      <span>{amount ? `$${Number(amount).toLocaleString("en-CA")}` : "—"}</span>
                      <span style={{ color: dash.rowDivider }}>•</span>
                      <span>
                        {new Date(c.created_at).toLocaleDateString("en-CA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={dash.statusBadge}
                  >
                    {meta.statusBadge}
                  </span>
                </div>

                <Pipeline currentIndex={meta.pipelineIndex} />

                {next && (
                  <div
                    className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    style={{
                      background: dash.nested.background,
                      border: dash.accentPanel.border,
                    }}
                  >
                    <p className="text-sm font-medium leading-snug min-w-0" style={{ color: dash.mainText }}>
                      {next.label}
                    </p>
                    {next.kind === "checkout" && (
                      <button
                        type="button"
                        onClick={() => handleCheckout(next.tier, c)}
                        disabled={!!checkoutLoading}
                        className="rounded-lg px-4 py-2.5 min-h-11 text-xs font-semibold disabled:opacity-60 cursor-pointer shrink-0 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                        style={dash.primaryBtn}
                      >
                        {checkoutLoading === next.tier && <Spinner />}
                        {next.tier === "demand" ? "$49" : "$199"}
                      </button>
                    )}
                    {next.kind === "link" && (
                      <button
                        type="button"
                        onClick={() => {
                          saveCaseToSession(c);
                          window.location.href = next.href;
                        }}
                        className="rounded-lg px-4 py-2.5 min-h-11 text-xs font-semibold cursor-pointer shrink-0 w-full sm:w-auto inline-flex items-center justify-center"
                        style={dash.primaryBtn}
                      >
                        Open
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenCase(c)}
                    className="rounded-lg px-4 py-3 min-h-11 text-sm font-semibold cursor-pointer w-full sm:w-auto"
                    style={dash.primaryBtn}
                  >
                    View Full Assessment
                  </button>
                  {!meta.hasDemandTier && (
                    <Link
                      href={`/dashboard/demand-letter/${c.id}`}
                      className="rounded-lg px-4 py-3 min-h-11 text-sm font-semibold inline-flex items-center justify-center w-full sm:w-auto"
                      style={{
                        background: "transparent",
                        color: dash.mainText,
                        border: dash.chromeBorder,
                      }}
                    >
                      Get Demand Letter
                    </Link>
                  )}
                  {!meta.hasFullTier && (
                    <Link
                      href={`/dashboard/full-case-pack/${c.id}`}
                      className="rounded-lg px-4 py-3 min-h-11 text-sm font-semibold inline-flex items-center justify-center w-full sm:w-auto"
                      style={{
                        background: "transparent",
                        color: dash.mainText,
                        border: dash.chromeBorder,
                      }}
                    >
                      Get Full Case Pack
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {openCase && (
        <AssessmentModal
          caseRecord={openCase}
          onClose={() => setOpenCase(null)}
        />
      )}
    </main>
  );
}

function AssessmentModal({
  caseRecord,
  onClose,
}: {
  caseRecord: Case;
  onClose: () => void;
}) {
  const sections = useMemo(
    () =>
      buildAssessmentSections(
        caseRecord.case_assessment,
        caseRecord.intake_text,
        caseRecord.province
      ),
    [caseRecord]
  );

  const title = generateCaseTitle(caseRecord);

  function handleDownloadPdf() {
    downloadAssessmentPdf({
      assessment: caseRecord.case_assessment,
      intake: caseRecord.intake_text,
      province: caseRecord.province,
      filename: `ruled-assessment-${caseRecord.id.slice(0, 8)}.pdf`,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:px-4 sm:py-6"
      style={{ background: "rgba(15, 23, 42, 0.55)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full sm:max-w-3xl rounded-t-2xl sm:rounded-xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl"
        style={{ background: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="assessment-modal-title"
      >
        <div
          className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4 shrink-0"
          style={{ background: NAVY }}
        >
          <div className="min-w-0 flex flex-col gap-0.5">
            <h2
              id="assessment-modal-title"
              className="text-base sm:text-lg font-semibold text-white tracking-tight"
            >
              Your Case Assessment
            </h2>
            <p className="text-xs text-white/75 truncate">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 min-h-10 min-w-10 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-opacity hover:opacity-80"
            style={{ color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)" }}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-5 sm:px-6 py-6 bg-white">
          <div className="flex flex-col">
            {sections.map((section, index) => (
              <article
                key={section.title}
                className="py-5 first:pt-0 last:pb-0"
                style={
                  index < sections.length - 1
                    ? { borderBottom: `1px solid ${SECTION_BORDER}` }
                    : undefined
                }
              >
                <h3
                  className="text-sm font-semibold tracking-tight mb-3"
                  style={{
                    color: NAVY,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                  }}
                >
                  {section.title}
                </h3>
                <AssessmentSectionBody content={section.content} />
              </article>
            ))}
          </div>
        </div>

        <div
          className="shrink-0 px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t bg-white"
          style={{ borderColor: SECTION_BORDER }}
        >
          <p className="text-xs" style={{ color: "#64748B" }}>
            {caseRecord.province}
            <span className="mx-2" aria-hidden>
              ·
            </span>
            Ruled provides legal information, not legal advice.
          </p>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto rounded-full px-6 py-3 min-h-11 text-sm font-semibold cursor-pointer shrink-0"
            style={dash.primaryBtn}
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function AssessmentSectionBody({ content }: { content: string }) {
  const paragraphs = content
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className="text-sm leading-relaxed whitespace-pre-wrap break-words"
          style={{ color: BODY_TEXT }}
        >
          {para.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

function Pipeline({ currentIndex }: { currentIndex: number }) {
  const steps = [
    "Case Assessment",
    "Demand Letter Sent",
    "Filed in Court",
    "Hearing Scheduled",
    "Resolved",
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const active = i <= currentIndex;
          return (
            <div key={s} className="flex items-center flex-1 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: active ? dash.pipelineActive : dash.trackMuted }}
                title={s}
              />
              {i < steps.length - 1 && (
                <div
                  className="h-0.5 flex-1 mx-2"
                  style={{
                    background: active ? dash.pipelineConnector : dash.trackMuted,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs" style={{ color: dash.mainMuted }}>
        {steps[Math.min(currentIndex, steps.length - 1)]}
      </p>
    </div>
  );
}

