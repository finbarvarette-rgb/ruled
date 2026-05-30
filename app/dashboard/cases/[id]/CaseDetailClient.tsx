"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { Case } from "@/lib/supabase";
import { startCheckout } from "@/lib/checkout";
import { buildAssessmentSections } from "@/lib/pdf-generator";
import { deliveryHref } from "@/lib/case-pack";
import { extractClaimAmount, generateCaseTitle, getCaseMeta, inferDisputeType } from "../../case-utils";
import { saveCaseToSession } from "../../components/dashboard-session";
import { Spinner } from "@/components/Spinner";

const NAVY = "#0A0F1E";
const CARD = "#151C2E";
const CARD2 = "#1A2236";
const GOLD = "#D4A853";
const GOLD_DIM = "rgba(212,168,83,0.12)";
const GREEN = "#10B981";
const AMBER = "#F59E0B";
const RED = "#C8392B";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(212,168,83,0.25)";
const MUTED = "rgba(255,255,255,0.5)";
const WHITE = "#FFFFFF";

function extractCaseStrength(assessment: string): { score: number | null; label: string } {
  const match = assessment.match(/(\d{2,3})\s*\/\s*100/);
  const score = match ? parseInt(match[1]) : null;
  if (!score) return { score: null, label: "Strong Case" };
  if (score >= 75) return { score, label: "Strong Case" };
  if (score >= 55) return { score, label: "Moderate Case" };
  return { score, label: "Weak Case" };
}

function extractEvidenceItems(
  intake: string,
  assessment: string
): Array<{ label: string; have: boolean; note?: string }> {
  const text = (intake + " " + assessment).toLowerCase();
  const items: Array<{ label: string; have: boolean; note?: string }> = [];

  if (/payment|receipt|invoice|e-transfer|etransfer|deposit|paid/.test(text)) {
    items.push({ label: "Payment records", have: true });
  }
  if (/text message|text history|email|message history|sms|whatsapp|correspondence/.test(text)) {
    items.push({ label: "Message history", have: true });
  }
  if (/photo|picture|image|video|screenshot/.test(text)) {
    items.push({ label: "Photos / screenshots", have: true });
  }
  if (/lease|rental agreement|tenancy agreement/.test(text)) {
    items.push({ label: "Lease agreement", have: true });
  }
  if (/verbal|no written contract|no contract|no written agreement|verbal only/.test(text)) {
    items.push({ label: "Written contract", have: false, note: "verbal only" });
  } else if (/written contract|signed contract|written agreement|signed agreement/.test(text)) {
    items.push({ label: "Written contract", have: true });
  }
  if (/witness/.test(text)) {
    items.push({ label: "Witness", have: true });
  }

  if (items.length === 0) {
    return [{ label: "Case documentation", have: true }];
  }

  return items.slice(0, 5);
}

export function CaseDetailClient({ caseRecord }: { caseRecord: Case }) {
  const meta = getCaseMeta(caseRecord);
  const amount = extractClaimAmount(caseRecord.case_assessment, caseRecord.intake_text);
  const title = generateCaseTitle(caseRecord);
  const disputeType = inferDisputeType(caseRecord.intake_text);
  const strength = extractCaseStrength(caseRecord.case_assessment);

  const sections = buildAssessmentSections(
    caseRecord.case_assessment,
    caseRecord.intake_text,
    caseRecord.province
  );
  const summarySection = sections.find((s) => s.title === "Summary");
  const summaryText = summarySection?.content ?? caseRecord.intake_text.slice(0, 400);

  const evidenceItems = extractEvidenceItems(
    caseRecord.intake_text,
    caseRecord.case_assessment
  );

  const openedDate = new Date(caseRecord.created_at).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [checkoutLoading, setCheckoutLoading] = useState<"demand" | "full" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCheckout(tier: "demand" | "full") {
    setCheckoutLoading(tier);
    saveCaseToSession(caseRecord);
    try {
      await startCheckout(tier, caseRecord.id, caseRecord.email);
    } catch {
      setCheckoutLoading(null);
    }
  }

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("caseId", caseRecord.id);
        Array.from(files).forEach((f) => fd.append("files", f));
        await fetch("/api/cases/upload-evidence", { method: "POST", body: fd });
        setUploadDone(true);
      } finally {
        setUploading(false);
      }
    },
    [caseRecord.id]
  );

  // Stage pipeline states (3-step version)
  const step2State = meta.hasFullTier ? "done" : "active";
  const step3State = meta.hasFullTier ? "active" : "locked";

  // FCP step completion
  const hasDemandLetter = !!caseRecord.demand_letter?.trim();
  const isFiled =
    caseRecord.outcome === "filed" ||
    caseRecord.outcome === "hearing" ||
    caseRecord.outcome === "won" ||
    caseRecord.outcome === "lost";
  const isHearing =
    caseRecord.outcome === "hearing" ||
    caseRecord.outcome === "won" ||
    caseRecord.outcome === "lost";

  // Demand letter deadline
  const daysSinceCase = Math.floor(
    (Date.now() - new Date(caseRecord.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = 14 - daysSinceCase;

  // Stage badge
  let badgeStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.5px",
    padding: "8px 16px",
    borderRadius: 20,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };
  if (meta.statusBadge === "Demand Letter Sent") {
    badgeStyle = { ...badgeStyle, background: "rgba(16,185,129,0.15)", color: GREEN };
  } else if (meta.statusBadge === "Filed" || meta.statusBadge === "Hearing Scheduled") {
    badgeStyle = { ...badgeStyle, background: "rgba(200,57,43,0.15)", color: RED };
  } else {
    badgeStyle = { ...badgeStyle, background: "rgba(212,168,83,0.15)", color: GOLD };
  }

  return (
    <main style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Back button */}
      <Link
        href="/dashboard/case-assessments"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: MUTED,
          fontSize: 13,
          textDecoration: "none",
          marginBottom: 24,
        }}
      >
        ← Back to My Cases
      </Link>

      {/* Case header card */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 28,
          marginBottom: 24,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 8,
            }}
          >
            {disputeType} · {caseRecord.province}
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 26,
              color: WHITE,
              marginBottom: 6,
            }}
          >
            {title}
          </h1>
          <div style={{ fontSize: 13, color: MUTED }}>
            {amount ? `$${Number(amount).toLocaleString("en-CA")} at stake · ` : ""}
            Case opened {openedDate}
            {strength.score ? ` · ${strength.label} (${strength.score}/100)` : ` · ${strength.label}`}
          </div>
        </div>
        <span style={badgeStyle}>{meta.statusBadge}</span>
      </div>

      {/* Stage pipeline */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          background: CARD2,
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        {/* Step 1 — always done */}
        <PipelineStep state="done" number={1} label="Assessment" />
        <div style={{ width: 1, background: BORDER }} />
        <PipelineStep state={step2State} number={2} label="Demand Letter" />
        <div style={{ width: 1, background: BORDER }} />
        <PipelineStep state={step3State} number={3} label="Court Prep" />
      </div>

      {/* Two column: Assessment + Evidence */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
        className="grid-cols-1 md:grid-cols-2"
      >
        {/* Case Assessment card */}
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Case Assessment
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                background: "rgba(16,185,129,0.15)",
                color: GREEN,
              }}
            >
              {strength.label}{strength.score ? ` — ${strength.score}/100` : ""}
            </span>
          </div>

          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {summaryText.length > 400 ? summaryText.slice(0, 400) + "…" : summaryText}
          </p>
        </div>

        {/* Evidence card */}
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Your Evidence
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {evidenceItems.map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom:
                    i < evidenceItems.length - 1
                      ? `1px solid ${BORDER}`
                      : "none",
                  fontSize: 13,
                  color: WHITE,
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    color: item.have ? GREEN : MUTED,
                    flexShrink: 0,
                  }}
                >
                  {item.have ? "✓" : "–"}
                </span>
                {item.label}
                {item.note && (
                  <span style={{ color: AMBER, fontSize: 11, marginLeft: 4 }}>
                    {item.note}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Upload zone */}
          <div style={{ marginTop: 16 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? GOLD : BORDER_GOLD}`,
                borderRadius: 12,
                padding: "16px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(212,168,83,0.08)" : GOLD_DIM,
                transition: "all 0.2s",
              }}
            >
              <div style={{ color: WHITE, fontSize: 13, fontWeight: 600 }}>
                {uploadDone ? "✓ Evidence uploaded" : uploading ? "Uploading…" : "+ Add more evidence"}
              </div>
              <p style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>
                Photos, invoices, emails, contracts
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>
      </div>

      {/* Unlock section */}
      {meta.hasFullTier ? (
        <FullCasePackExperience
          caseRecord={caseRecord}
          hasDemandLetter={hasDemandLetter}
          isFiled={isFiled}
          isHearing={isHearing}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 20,
          }}
          className="grid-cols-1 md:grid-cols-2"
        >
          {/* Left card */}
          {meta.hasDemandTier ? (
            /* Demand letter purchased — show status */
            <div
              style={{
                borderRadius: 14,
                padding: 28,
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${GREEN}`,
                background: `linear-gradient(135deg, ${CARD2} 0%, rgba(16,185,129,0.06) 100%)`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(16,185,129,0.15)",
                  color: GREEN,
                  fontSize: 10,
                  letterSpacing: 1,
                  padding: "4px 10px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                ✓ Purchased
              </span>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
                Demand Letter
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 20,
                  color: WHITE,
                  marginBottom: 8,
                }}
              >
                {hasDemandLetter ? "Your demand letter is ready." : "Your letter is being prepared."}
              </h3>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 20 }}>
                {daysRemaining > 0 ? (
                  <>Response deadline: <span style={{ color: AMBER }}>{daysRemaining} days remaining.</span></>
                ) : (
                  <>The 14-day response window has passed. Consider next steps.</>
                )}
              </p>
              {hasDemandLetter && (
                <a
                  href={deliveryHref(caseRecord.id, "demand")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    textDecoration: "none",
                    textAlign: "center",
                    background: "transparent",
                    color: GREEN,
                    border: `1px solid ${GREEN}`,
                  }}
                >
                  View My Letter
                </a>
              )}
            </div>
          ) : (
            /* No demand letter — upsell */
            <div
              style={{
                borderRadius: 14,
                padding: 28,
                position: "relative",
                overflow: "hidden",
                border: `1px solid rgba(212,168,83,0.4)`,
                background: `linear-gradient(135deg, ${CARD2} 0%, rgba(212,168,83,0.08) 100%)`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(212,168,83,0.15)",
                  color: GOLD,
                  fontSize: 10,
                  letterSpacing: 1,
                  padding: "4px 10px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Recommended Next Step
              </span>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
                Demand Letter
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 20,
                  color: WHITE,
                  marginBottom: 8,
                }}
              >
                Send a demand letter first.
              </h3>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 4 }}>
                40% of cases resolve right here. One letter, sent professionally, often gets results before you ever file in court.
              </p>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 26,
                  color: GOLD,
                  margin: "16px 0",
                }}
              >
                $49
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0" }}>
                {[
                  "Province-specific legal language",
                  "14-day payment demand",
                  "Professional formatting",
                  "Saved to your dashboard",
                ].map((f) => (
                  <li key={f} style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", padding: "3px 0", display: "flex", gap: 8 }}>
                    <span style={{ color: GOLD, flexShrink: 0 }}>—</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleCheckout("demand")}
                disabled={!!checkoutLoading}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  border: "none",
                  background: GOLD,
                  color: NAVY,
                  opacity: checkoutLoading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {checkoutLoading === "demand" && <Spinner />}
                Get My Demand Letter →
              </button>
            </div>
          )}

          {/* Right card — Full Case Pack upsell */}
          <div
            style={{
              borderRadius: 14,
              padding: 28,
              border: `1px solid ${BORDER_GOLD}`,
              background: `linear-gradient(135deg, ${CARD2} 0%, rgba(16,185,129,0.06) 100%)`,
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
              Full Case Pack
            </div>
            <h3
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 20,
                color: WHITE,
                marginBottom: 8,
              }}
            >
              {meta.hasDemandTier
                ? "They haven't responded? Here's what's next."
                : "Go straight to court. Your choice."}
            </h3>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 4 }}>
              {meta.hasDemandTier
                ? "Get everything you need to file in small claims court and walk in prepared."
                : "Skip the letter and go all in. Everything you need to file and walk into court prepared."}
            </p>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 26,
                color: GOLD,
                margin: "16px 0",
              }}
            >
              $199
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0" }}>
              {[
                "Province-specific filing instructions",
                "All court documents prepared",
                "Opening and closing scripts",
                "Day of court checklist",
              ].map((f) => (
                <li key={f} style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", padding: "3px 0", display: "flex", gap: 8 }}>
                  <span style={{ color: GOLD, flexShrink: 0 }}>—</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleCheckout("full")}
              disabled={!!checkoutLoading}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                cursor: "pointer",
                background: meta.hasDemandTier ? GOLD : "transparent",
                color: meta.hasDemandTier ? NAVY : GOLD,
                border: meta.hasDemandTier ? "none" : `1px solid ${GOLD}`,
                opacity: checkoutLoading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {checkoutLoading === "full" && <Spinner />}
              {meta.hasDemandTier ? "Get Full Case Pack →" : "Get Full Case Pack"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function PipelineStep({
  state,
  number,
  label,
}: {
  state: "done" | "active" | "locked";
  number: number;
  label: string;
}) {
  const bgColor =
    state === "done"
      ? "rgba(16,185,129,0.08)"
      : state === "active"
      ? "rgba(212,168,83,0.10)"
      : "transparent";
  const borderBottom =
    state === "active" ? `2px solid ${GOLD}` : "2px solid transparent";
  const nameColor =
    state === "done" ? GREEN : state === "active" ? GOLD : MUTED;

  return (
    <div
      style={{
        flex: 1,
        padding: "16px 20px",
        textAlign: "center",
        background: bgColor,
        borderBottom,
        opacity: state === "locked" ? 0.4 : 1,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: MUTED,
          marginBottom: 4,
        }}
      >
        Step {number}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: nameColor }}>
        {state === "done" ? `✓ ${label}` : label}
      </div>
    </div>
  );
}

function FullCasePackExperience({
  caseRecord,
  hasDemandLetter,
  isFiled,
  isHearing,
}: {
  caseRecord: Case;
  hasDemandLetter: boolean;
  isFiled: boolean;
  isHearing: boolean;
}) {
  const steps = [
    {
      num: 1,
      title: "Review your demand letter",
      desc: "Review the demand letter and confirm it was sent to the other party.",
      done: hasDemandLetter,
      action: hasDemandLetter ? (
        <a
          href={deliveryHref(caseRecord.id, "demand")}
          style={{ fontSize: 12, color: GREEN, textDecoration: "none" }}
        >
          ✓ Complete — View letter
        </a>
      ) : (
        <span style={{ fontSize: 12, color: MUTED }}>Waiting for letter generation</span>
      ),
      locked: false,
    },
    {
      num: 2,
      title: "Confirm intent to file",
      desc: `You've confirmed you want to proceed to small claims court in ${caseRecord.province}.`,
      done: isFiled,
      action: isFiled ? (
        <span style={{ fontSize: 12, color: GREEN }}>✓ Complete</span>
      ) : (
        <span style={{ fontSize: 12, color: GOLD }}>→ Confirm you're ready to file</span>
      ),
      locked: !hasDemandLetter,
    },
    {
      num: 3,
      title: "File your claim at the courthouse",
      desc: `Your claim form is ready. Bring it to the ${caseRecord.province} Small Claims Court and pay the filing fee.`,
      done: isFiled,
      action: isFiled ? (
        <span style={{ fontSize: 12, color: GREEN }}>✓ Filed</span>
      ) : (
        <a
          href={deliveryHref(caseRecord.id, "full", "court")}
          style={{ fontSize: 12, color: GOLD, textDecoration: "none" }}
        >
          → Download Claim Form · View Filing Instructions
        </a>
      ),
      locked: !hasDemandLetter,
    },
    {
      num: 4,
      title: "Serve the defendant",
      desc: `After filing, you need to formally serve the defendant. We'll walk you through exactly how.`,
      done: isHearing,
      action: isHearing ? (
        <span style={{ fontSize: 12, color: GREEN }}>✓ Complete</span>
      ) : (
        <span style={{ fontSize: 12, color: GOLD }}>→ View service instructions</span>
      ),
      locked: !isFiled,
    },
    {
      num: 5,
      title: "Prepare for your hearing",
      desc: "Opening script, closing script, anticipated defence arguments, and day-of checklist — built for your case.",
      done: false,
      action: (
        <a
          href={deliveryHref(caseRecord.id, "full", "hearing")}
          style={{ fontSize: 12, color: GOLD, textDecoration: "none" }}
        >
          → Open hearing prep
        </a>
      ),
      locked: !isFiled,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 28,
          marginBottom: 20,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: GREEN,
              marginBottom: 8,
            }}
          >
            Full Case Pack
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22,
              color: WHITE,
              marginBottom: 6,
            }}
          >
            Your court prep, step by step.
          </h2>
          <p style={{ fontSize: 13, color: MUTED }}>
            Everything you need. Follow each step in order.
          </p>
        </div>
        <span
          style={{
            background: "rgba(16,185,129,0.15)",
            color: GREEN,
            fontSize: 13,
            fontWeight: 700,
            padding: "8px 16px",
            borderRadius: 20,
            whiteSpace: "nowrap",
          }}
        >
          {completedCount} of {steps.length} Complete
        </span>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map((step) => (
          <div
            key={step.num}
            style={{
              background: CARD,
              border: `1px solid ${step.done ? "rgba(16,185,129,0.3)" : step.locked ? BORDER : "rgba(212,168,83,0.4)"}`,
              borderRadius: 12,
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              padding: 20,
              opacity: step.locked ? 0.5 : 1,
            }}
          >
            {/* Step number */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: step.done
                  ? "rgba(16,185,129,0.1)"
                  : GOLD_DIM,
                border: `1px solid ${step.done ? GREEN : BORDER_GOLD}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 16,
                color: step.done ? GREEN : GOLD,
                flexShrink: 0,
              }}
            >
              {step.done ? "✓" : step.num}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: WHITE,
                  marginBottom: 4,
                }}
              >
                {step.title}
              </div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 8 }}>
                {step.desc}
              </div>
              {step.locked ? (
                <div style={{ fontSize: 12, color: MUTED }}>
                  Unlocks after Step {step.num - 1}
                </div>
              ) : (
                step.action
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
