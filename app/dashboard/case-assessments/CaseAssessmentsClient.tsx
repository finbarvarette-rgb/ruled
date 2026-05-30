"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { Case } from "@/lib/supabase";
import { extractClaimAmount, generateCaseTitle, getCaseMeta, inferDisputeType } from "../case-utils";

const NAVY = "#0A0F1E";
const CARD = "#151C2E";
const GOLD = "#D4A853";
const GREEN = "#10B981";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(212,168,83,0.25)";
const MUTED = "rgba(255,255,255,0.5)";
const GOLD_DIM = "rgba(212,168,83,0.12)";
const WHITE = "#FFFFFF";

export function CaseAssessmentsClient({ cases: initialCases }: { cases: Case[] }) {
  const [caseList, setCaseList] = useState<Case[]>(initialCases);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  async function handleDeleteConfirmed() {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/cases/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: deleteConfirmId }),
      });
      if (res.ok) {
        setCaseList((prev) => prev.filter((c) => c.id !== deleteConfirmId));
        setDeleteConfirmId(null);
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <main style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 32,
            color: WHITE,
            marginBottom: 4,
          }}
        >
          My Cases
        </h1>
        <p style={{ color: MUTED, fontSize: 14 }}>
          Click a case to open it and manage your claim.
        </p>
      </div>

      {/* Case list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {caseList.map((c) => {
          const meta = getCaseMeta(c);
          const amount = extractClaimAmount(c.case_assessment, c.intake_text);
          const title = generateCaseTitle(c);
          const disputeType = inferDisputeType(c.intake_text);
          const dateStr = new Date(c.created_at).toLocaleDateString("en-CA", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const progress =
            meta.pipelineIndex === 0 ? 33 : meta.pipelineIndex === 1 ? 66 : 100;
          const progressColor = meta.pipelineIndex >= 1 ? GREEN : GOLD;

          let badgeStyle: React.CSSProperties = {
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.5px",
            padding: "4px 10px",
            borderRadius: 20,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          };
          if (meta.statusBadge === "Demand Letter Sent") {
            badgeStyle = { ...badgeStyle, background: "rgba(16,185,129,0.15)", color: GREEN };
          } else if (
            meta.statusBadge === "Filed" ||
            meta.statusBadge === "Hearing Scheduled"
          ) {
            badgeStyle = {
              ...badgeStyle,
              background: "rgba(200,57,43,0.15)",
              color: "#C8392B",
            };
          } else {
            badgeStyle = {
              ...badgeStyle,
              background: "rgba(212,168,83,0.15)",
              color: GOLD,
            };
          }

          return (
            <div key={c.id} style={{ position: "relative", marginBottom: 12 }}>
              <Link
                href={`/dashboard/cases/${c.id}`}
                style={{
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  textDecoration: "none",
                  color: WHITE,
                  paddingRight: 56,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: GOLD_DIM,
                    border: `1px solid ${BORDER_GOLD}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" fill="none" stroke={GOLD} viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      marginBottom: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {title}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED }}>
                    {disputeType} · {c.province}
                    {amount ? ` · $${Number(amount).toLocaleString("en-CA")} at stake` : ""}
                  </div>
                </div>

                {/* Stage */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <span style={badgeStyle}>{meta.statusBadge}</span>
                  <div
                    style={{
                      width: 120,
                      height: 4,
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: 2,
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: 4,
                        borderRadius: 2,
                        background: progressColor,
                      }}
                    />
                  </div>
                </div>

                {/* Amount */}
                {amount && (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: GOLD,
                      flexShrink: 0,
                    }}
                  >
                    ${Number(amount).toLocaleString("en-CA")}
                  </div>
                )}
              </Link>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => setDeleteConfirmId(c.id)}
                title="Delete case"
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: MUTED,
                  padding: 4,
                  opacity: 0.6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" />
                </svg>
              </button>
            </div>
          );
        })}

        {/* Start new case CTA */}
        <Link
          href="/onboarding"
          style={{
            background: GOLD_DIM,
            border: `1px dashed ${BORDER_GOLD}`,
            borderRadius: 12,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            textDecoration: "none",
            color: GOLD,
            fontSize: 14,
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round">
            <path d="M8 2v12M2 8h12" />
          </svg>
          Start a New Case
        </Link>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => { if (!deleteLoading) setDeleteConfirmId(null); }}
          role="presentation"
        >
          <div
            style={{
              background: "#151C2E",
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: 24,
              maxWidth: 380,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, color: WHITE, marginBottom: 12 }}>
              Delete this case?
            </h2>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, marginBottom: 20 }}>
              This will permanently delete your case assessment and all associated documents. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteLoading}
                style={{
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "transparent",
                  color: MUTED,
                  border: `1px solid ${BORDER}`,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={deleteLoading}
                style={{
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "#C8392B",
                  color: WHITE,
                  border: "none",
                  opacity: deleteLoading ? 0.6 : 1,
                }}
              >
                {deleteLoading ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
