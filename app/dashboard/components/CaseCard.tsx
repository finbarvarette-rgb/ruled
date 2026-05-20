"use client";

import { useState } from "react";
import type { Case } from "@/lib/supabase";
import { startCheckout } from "@/lib/checkout";
import { Spinner } from "@/components/Spinner";
import { getCaseMeta, getNextStep, type CaseMeta } from "../case-utils";
import { dash } from "../theme";
import { CasePipeline } from "./CasePipeline";
import { saveCaseToSession, downloadTextFile } from "./dashboard-session";

function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
      style={{
        background: "rgba(200, 57, 43, 0.15)",
        color: "#c8392b",
        border: "1px solid rgba(200, 57, 43, 0.35)",
      }}
    >
      {label}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 cursor-pointer text-left sm:text-center"
      style={
        primary
          ? { background: "#c8392b", color: "#f5f1eb" }
          : {
              background: dash.input.background,
              color: dash.mainText,
              border: dash.input.border,
            }
      }
    >
      {children}
    </button>
  );
}

export function CaseCard({ caseRecord }: { caseRecord: Case }) {
  const meta = getCaseMeta(caseRecord);
  const nextStep = getNextStep(caseRecord, meta);
  const [checkoutLoading, setCheckoutLoading] = useState<
    "demand" | "full" | null
  >(null);

  const createdLabel = new Date(caseRecord.created_at).toLocaleDateString(
    "en-CA",
    { year: "numeric", month: "long", day: "numeric" }
  );

  function viewAssessment() {
    saveCaseToSession(caseRecord);
    window.location.href = "/results";
  }

  function openDelivery(path: string) {
    saveCaseToSession(caseRecord);
    window.location.href = path;
  }

  async function handleCheckout(tier: "demand" | "full") {
    saveCaseToSession(caseRecord);
    setCheckoutLoading(tier);
    try {
      await startCheckout(tier, caseRecord.id, caseRecord.email);
    } catch {
      setCheckoutLoading(null);
    }
  }

  return (
    <article className="rounded-xl flex flex-col gap-6 p-6 md:p-8" style={{ ...dash.panel }}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 min-w-0">
          <h2 className="text-lg font-semibold leading-snug">{meta.title}</h2>
          <p className="text-sm" style={{ color: dash.mainMuted }}>
            Created {createdLabel}
          </p>
        </div>
        <StatusBadge label={meta.statusBadge} />
      </header>

      <CasePipeline currentIndex={meta.pipelineIndex} />

      {nextStep && (
        <NextStepsBlock
          nextStep={nextStep}
          checkoutLoading={checkoutLoading}
          onCheckout={handleCheckout}
          onNavigate={openDelivery}
        />
      )}

      <div className="flex flex-col gap-3">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: dash.mainMuted }}
        >
          Quick actions
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionButton primary onClick={viewAssessment}>
            View Assessment
          </ActionButton>
          {meta.hasDemandTier ? (
            <ActionButton onClick={() => openDelivery("/success/demand-letter")}>
              View Demand Letter
            </ActionButton>
          ) : (
            <ActionButton
              onClick={() => handleCheckout("demand")}
              disabled={!!checkoutLoading}
            >
              {checkoutLoading === "demand" ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Loading…
                </span>
              ) : (
                "Get Demand Letter"
              )}
            </ActionButton>
          )}
          {meta.hasFullTier ? (
            <ActionButton onClick={() => openDelivery("/success/full-case-pack")}>
              View Case Pack
            </ActionButton>
          ) : (
            <ActionButton
              onClick={() => handleCheckout("full")}
              disabled={!!checkoutLoading}
            >
              {checkoutLoading === "full" ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Loading…
                </span>
              ) : (
                "Get Full Case Pack"
              )}
            </ActionButton>
          )}
        </div>
      </div>

      <CaseDocuments meta={meta} caseRecord={caseRecord} />
    </article>
  );
}

function NextStepsBlock({
  nextStep,
  checkoutLoading,
  onCheckout,
  onNavigate,
}: {
  nextStep: NonNullable<ReturnType<typeof getNextStep>>;
  checkoutLoading: "demand" | "full" | null;
  onCheckout: (tier: "demand" | "full") => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <section
      className="rounded-lg px-5 py-4 flex flex-col gap-2"
      style={{
        ...dash.panel,
        border: "1px solid rgba(200, 57, 43, 0.35)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c8392b" }}>
        Next step
      </p>
      {nextStep.kind === "checkout" ? (
        <button
          type="button"
          disabled={!!checkoutLoading}
          onClick={() => onCheckout(nextStep.tier)}
          className="text-sm font-semibold text-left disabled:opacity-60 cursor-pointer flex items-center gap-2 rounded-lg px-4 py-2.5"
          style={{ background: "#c8392b", color: "#f5f1eb" }}
        >
          {checkoutLoading === nextStep.tier && <Spinner />}
          {nextStep.label}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onNavigate(nextStep.href)}
            className="text-sm font-medium text-left cursor-pointer"
            style={{ color: dash.mainText }}
          >
            {nextStep.label}
          </button>
          {nextStep.sublabel && (
            <p className="text-xs" style={{ color: dash.mainMuted }}>
              {nextStep.sublabel}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function CaseDocuments({
  meta,
  caseRecord,
}: {
  meta: CaseMeta;
  caseRecord: Case;
}) {
  const purchased = meta.documents.filter((d) => d.available);

  if (purchased.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t pt-6" style={{ borderColor: dash.rowDivider }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: dash.mainMuted }}>
        My documents
      </p>
      <ul className="flex flex-col gap-2">
        {purchased.map((doc) => (
          <li
            key={doc.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg px-4 py-3"
            style={{ ...dash.nested }}
          >
            <span className="text-sm font-medium">{doc.title}</span>
            <button
              type="button"
              disabled={!doc.content?.trim()}
              onClick={() => {
                if (!doc.content?.trim()) return;
                const slug = caseRecord.id.slice(0, 8);
                downloadTextFile(
                  `ruled-${doc.id}-${slug}.txt`,
                  doc.content
                );
              }}
              className="text-xs font-semibold rounded-md px-3 py-1.5 disabled:opacity-40 cursor-pointer shrink-0"
              style={{
                background: doc.content?.trim() ? "#c8392b" : "#e8e6e1",
                color: doc.content?.trim() ? "#f5f1eb" : dash.mainMuted,
              }}
            >
              {doc.content?.trim() ? "Download" : "Generating…"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
