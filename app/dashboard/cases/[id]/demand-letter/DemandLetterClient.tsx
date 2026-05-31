"use client";

import { useState } from "react";
import Link from "next/link";
import type { Case } from "@/lib/supabase";
import { downloadDemandLetterPdf } from "@/lib/pdf-generator";
import { extractClaimAmount, inferDisputeType } from "../../../case-utils";
import { Spinner } from "@/components/Spinner";

const NAVY = "#0A0F1E";
const CARD = "#151C2E";
const CARD2 = "#1A2236";
const GOLD = "#D4A853";
const GOLD_DIM = "rgba(212,168,83,0.10)";
const GREEN = "#10B981";
const AMBER = "#F59E0B";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(212,168,83,0.25)";
const MUTED = "rgba(255,255,255,0.5)";
const WHITE = "#FFFFFF";
const PF = "'Playfair Display', Georgia, serif";

export function DemandLetterClient({ caseRecord }: { caseRecord: Case }) {
  const [editMode, setEditMode] = useState(false);
  const [letterText, setLetterText] = useState(caseRecord.demand_letter ?? "");
  const [hasEdits, setHasEdits] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const amount = extractClaimAmount(caseRecord.case_assessment, caseRecord.intake_text);
  const disputeType = inferDisputeType(caseRecord.intake_text);

  const sentDate = caseRecord.demand_letter_sent_date
    ? new Date(caseRecord.demand_letter_sent_date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
    : caseRecord.demand_letter_sent
    ? new Date(caseRecord.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const deadlineDate = sentDate
    ? new Date(new Date(caseRecord.demand_letter_sent_date ?? caseRecord.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const daysRemaining = Math.ceil(
    (new Date(caseRecord.demand_letter_sent_date ?? caseRecord.created_at).getTime() + 14 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const hasDemandLetter = !!caseRecord.demand_letter?.trim();
  const hasFullTier = caseRecord.tier_purchased === "full";

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/cases/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseRecord.id, field: "demand_letter", value: letterText }),
      });
      setHasEdits(false);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(letterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadDemandLetterPdf(letterText, `ruled-demand-letter-${caseRecord.id.slice(0, 8)}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Back */}
      <Link href={`/dashboard/cases/${caseRecord.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 13, textDecoration: "none", marginBottom: 20 }}>
        ← Back to Case
      </Link>

      <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>
        Demand Letter
      </div>
      <h1 style={{ fontFamily: PF, fontSize: 28, color: WHITE, marginBottom: 4 }}>Your demand letter.</h1>
      {sentDate && (
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>
          Sent {sentDate} · Response deadline {deadlineDate}
          {daysRemaining > 0 && daysRemaining <= 7 && (
            <> · <span style={{ color: AMBER }}>{daysRemaining} days remaining</span></>
          )}
          {daysRemaining <= 0 && (
            <> · <span style={{ color: AMBER }}>Deadline passed</span></>
          )}
        </p>
      )}
      {!sentDate && (
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>
          {disputeType} · {caseRecord.province}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }} className="flex flex-col md:grid">
        {/* Left sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Letter details */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>
              Letter Details
            </div>
            {[
              { key: "Status", val: caseRecord.demand_letter_sent ? <span style={{ background: "rgba(16,185,129,0.15)", color: GREEN, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>Sent</span> : <span style={{ background: "rgba(212,168,83,0.15)", color: GOLD, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>Ready to send</span> },
              sentDate && { key: "Sent", val: sentDate },
              deadlineDate && { key: "Deadline", val: <span style={{ color: daysRemaining <= 7 && daysRemaining > 0 ? AMBER : WHITE }}>{deadlineDate}</span> },
              amount && amount !== "0" && { key: "Amount", val: <span style={{ color: GOLD }}>${Number(amount).toLocaleString("en-CA")}.00</span> },
              { key: "Province", val: caseRecord.province },
            ].filter(Boolean).map((row: any) => (
              <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
                <span style={{ color: MUTED }}>{row.key}</span>
                <span style={{ fontWeight: 500 }}>{row.val}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || !hasDemandLetter}
              style={{ width: "100%", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: GOLD, color: NAVY, border: "none", opacity: downloading ? 0.7 : 1 }}
            >
              {downloading && <Spinner />}
              ↓ Download PDF
            </button>
            <button
              type="button"
              onClick={() => { setEditMode(!editMode); setHasEdits(false); }}
              style={{ width: "100%", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", color: GOLD, border: `1px solid ${GOLD}` }}
            >
              {editMode ? "✕ Cancel Edit" : "✏ Edit Letter"}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              style={{ width: "100%", padding: 10, borderRadius: 8, fontSize: 13, cursor: "pointer", background: "transparent", color: MUTED, border: `1px solid ${BORDER}` }}
            >
              {copied ? "✓ Copied!" : "📋 Copy Text"}
            </button>
          </div>

          {/* What is a demand letter? */}
          <div style={{ background: GOLD_DIM, border: `1px solid ${BORDER_GOLD}`, borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>
            <strong style={{ color: GOLD }}>What is a demand letter?</strong>
            <br /><br />
            A demand letter is a formal legal document that tells whoever owes you money exactly what they owe, why they need to pay, and the consequences if they don't respond within the deadline.
            <br /><br />
            <strong style={{ color: GOLD }}>40% of cases</strong> resolve right here — before ever going to court.
          </div>

          {/* What's next? */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>What's next?</div>
            {daysRemaining > 0 ? (
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                Send it and wait. If they don't respond by{" "}
                <span style={{ color: WHITE }}>{deadlineDate ?? "the deadline"}</span>, you're ready to file in small claims court.
              </p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 14 }}>
                  The deadline has passed. If they haven't responded, it's time to file in court.
                </p>
                {!hasFullTier && (
                  <Link
                    href={`/dashboard/cases/${caseRecord.id}`}
                    style={{ display: "block", width: "100%", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: "center", textDecoration: "none", background: "transparent", color: GREEN, border: `1px solid ${GREEN}` }}
                  >
                    Get Full Case Pack →
                  </Link>
                )}
                {hasFullTier && (
                  <Link
                    href={`/dashboard/cases/${caseRecord.id}/court-prep`}
                    style={{ display: "block", width: "100%", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: "center", textDecoration: "none", background: GOLD, color: NAVY, border: "none" }}
                  >
                    Open Court Prep →
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: the letter */}
        <div>
          {hasDemandLetter ? (
            <>
              {editMode ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: MUTED }}>
                    <span style={{ background: GOLD_DIM, color: GOLD, padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>✏ Edit mode</span>
                    <span>Make changes below, then save.</span>
                  </div>
                  <textarea
                    value={letterText}
                    onChange={(e) => { setLetterText(e.target.value); setHasEdits(true); }}
                    style={{
                      width: "100%",
                      minHeight: 600,
                      background: WHITE,
                      color: "#1a1a1a",
                      fontFamily: "'Times New Roman', Georgia, serif",
                      fontSize: 14,
                      lineHeight: 1.8,
                      padding: "40px 48px",
                      borderRadius: 12,
                      border: "none",
                      outline: "none",
                      resize: "vertical",
                      boxShadow: "0 4px 40px rgba(0,0,0,0.4)",
                    }}
                  />
                  {hasEdits && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      style={{ alignSelf: "flex-end", background: GOLD, color: NAVY, border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {saving && <Spinner />}
                      Save Changes
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 11, color: MUTED }}>
                    <span style={{ background: GOLD_DIM, color: GOLD, padding: "2px 8px", borderRadius: 4 }}>✏ Click "Edit Letter" to make changes</span>
                  </div>
                  <LetterDisplay text={letterText} caseId={caseRecord.id} />
                </div>
              )}
            </>
          ) : (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
              <h3 style={{ fontFamily: PF, fontSize: 20, color: WHITE, marginBottom: 8 }}>Your letter is being prepared.</h3>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
                Your demand letter is being generated. It will appear here shortly. Refresh this page in a moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function LetterDisplay({ text, caseId }: { text: string; caseId: string }) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div style={{ background: WHITE, borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.4)" }}>
      {/* Toolbar */}
      <div style={{ background: "#F8F7F4", borderBottom: "1px solid #E5E5E5", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, color: "#888" }}>Demand Letter</div>
        <div style={{ fontSize: 11, color: "#888" }}>Scroll to read · Use "Edit Letter" to make changes</div>
      </div>
      {/* Letter body */}
      <div style={{ padding: "48px 56px", fontFamily: "'Times New Roman', Georgia, serif", color: "#1a1a1a", lineHeight: 1.7 }}>
        {paragraphs.map((para, i) => {
          const isDate = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d/.test(para);
          const isRE = /^RE:/i.test(para);
          const isDear = /^Dear\s/i.test(para);
          const isSincerely = /^Sincerely/i.test(para);
          const isAmount = /Total Amount Owing|TOTAL AMOUNT/i.test(para);

          if (isDate) {
            return <div key={i} style={{ textAlign: "right", marginBottom: 32, fontSize: 14 }}>{para}</div>;
          }
          if (isRE) {
            return (
              <div key={i} style={{ fontWeight: "bold", marginBottom: 24, fontSize: 14, borderBottom: "1px solid #ccc", paddingBottom: 12 }}>
                {para}
              </div>
            );
          }
          if (isAmount) {
            return (
              <div key={i} style={{ background: "#FFF9E6", borderLeft: "3px solid #D4A853", padding: "12px 16px", margin: "16px 0", fontWeight: "bold", fontSize: 15 }}>
                {para}
              </div>
            );
          }
          if (isSincerely) {
            return (
              <div key={i} style={{ marginTop: 40, fontSize: 14, whiteSpace: "pre-wrap" }}>
                {para.split("\n").map((line, j) => (
                  <div key={j} style={{ marginBottom: j === 0 ? 32 : 2 }}>{line}</div>
                ))}
              </div>
            );
          }
          return (
            <div key={i} style={{ marginBottom: i < paragraphs.length - 1 ? 16 : 0, fontSize: 14 }}>
              {para}
            </div>
          );
        })}
      </div>
    </div>
  );
}
