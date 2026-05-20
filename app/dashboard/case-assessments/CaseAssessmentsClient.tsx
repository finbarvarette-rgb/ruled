"use client";

import { useMemo, useState } from "react";
import type { Case } from "@/lib/supabase";
import { startCheckout } from "@/lib/checkout";
import { Spinner } from "@/components/Spinner";
import { extractClaimAmount, generateCaseTitle, getCaseMeta, getNextStep } from "../case-utils";
import { saveCaseToSession } from "../components/dashboard-session";

export function CaseAssessmentsClient({ cases }: { cases: Case[] }) {
  const [openCase, setOpenCase] = useState<Case | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<"demand" | "full" | null>(null);

  const sorted = useMemo(() => cases, [cases]);

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
          <p className="text-sm" style={{ color: "#9a9590" }}>
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
                style={{ background: "#0f0e0c", border: "1px solid #1f1d19" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex flex-col gap-2">
                    <h2 className="text-base font-semibold leading-snug truncate">
                      {title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "#9a9590" }}>
                      <span>{c.province}</span>
                      <span style={{ color: "#1f1d19" }}>•</span>
                      <span>{amount ? `$${Number(amount).toLocaleString("en-CA")}` : "—"}</span>
                      <span style={{ color: "#1f1d19" }}>•</span>
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
                    style={{
                      background: "rgba(200, 57, 43, 0.12)",
                      color: "#c8392b",
                      border: "1px solid rgba(200, 57, 43, 0.30)",
                    }}
                  >
                    {meta.statusBadge}
                  </span>
                </div>

                <Pipeline currentIndex={meta.pipelineIndex} />

                {next && (
                  <div
                    className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                    style={{ background: "#0b0a08", border: "1px solid rgba(200, 57, 43, 0.30)" }}
                  >
                    <p className="text-sm font-medium leading-snug" style={{ color: "#f5f1eb" }}>
                      {next.label}
                    </p>
                    {next.kind === "checkout" && (
                      <button
                        type="button"
                        onClick={() => handleCheckout(next.tier, c)}
                        disabled={!!checkoutLoading}
                        className="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-60 cursor-pointer shrink-0 inline-flex items-center gap-2"
                        style={{ background: "#c8392b", color: "#f5f1eb" }}
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
                        className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer shrink-0"
                        style={{ background: "#c8392b", color: "#f5f1eb" }}
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
                    className="rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer"
                    style={{ background: "#c8392b", color: "#f5f1eb" }}
                  >
                    View Full Assessment
                  </button>
                  {!meta.hasDemandTier && (
                    <button
                      type="button"
                      onClick={() => handleCheckout("demand", c)}
                      disabled={checkoutLoading === "demand"}
                      className="rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
                      style={{ background: "transparent", color: "#f5f1eb", border: "1px solid #1f1d19" }}
                    >
                      {checkoutLoading === "demand" && <Spinner />}
                      Get Demand Letter
                    </button>
                  )}
                  {!meta.hasFullTier && (
                    <button
                      type="button"
                      onClick={() => handleCheckout("full", c)}
                      disabled={checkoutLoading === "full"}
                      className="rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
                      style={{ background: "transparent", color: "#f5f1eb", border: "1px solid #1f1d19" }}
                    >
                      {checkoutLoading === "full" && <Spinner />}
                      Get Full Case Pack
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {openCase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(5, 5, 5, 0.85)" }}
          onClick={() => setOpenCase(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-3xl rounded-2xl overflow-hidden"
            style={{ background: "#0f0e0c", border: "1px solid #1f1d19" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Full assessment"
          >
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "#1f1d19" }}>
              <p className="text-sm font-semibold">Full assessment</p>
              <button
                type="button"
                onClick={() => setOpenCase(null)}
                className="text-sm cursor-pointer"
                style={{ color: "#9a9590" }}
              >
                Close
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "#d4cfc9" }}>
                {openCase.case_assessment}
              </pre>
            </div>
          </div>
        </div>
      )}
    </main>
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
                style={{ background: active ? "#c8392b" : "#1f1d19" }}
                title={s}
              />
              {i < steps.length - 1 && (
                <div
                  className="h-0.5 flex-1 mx-2"
                  style={{ background: active ? "rgba(200, 57, 43, 0.6)" : "#1f1d19" }}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs" style={{ color: "#9a9590" }}>
        {steps[Math.min(currentIndex, steps.length - 1)]}
      </p>
    </div>
  );
}

