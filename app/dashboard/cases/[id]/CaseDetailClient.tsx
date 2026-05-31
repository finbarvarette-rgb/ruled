"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Case } from "@/lib/supabase";
import { startCheckout } from "@/lib/checkout";
import { buildAssessmentSections, downloadAssessmentPdf } from "@/lib/pdf-generator";
import { inferDefendantName, getProvinceFiling } from "@/lib/case-pack";
import { extractClaimAmount, getCaseMeta, inferDisputeType } from "../../case-utils";
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
  if (/payment|receipt|invoice|e-transfer|etransfer|deposit|paid/.test(text))
    items.push({ label: "Payment records", have: true });
  if (/text message|text history|email|message history|sms|whatsapp|correspondence/.test(text))
    items.push({ label: "Message history", have: true });
  if (/photo|picture|image|video|screenshot/.test(text))
    items.push({ label: "Photos / screenshots", have: true });
  if (/lease|rental agreement|tenancy agreement/.test(text))
    items.push({ label: "Lease agreement", have: true });
  if (/verbal|no written contract|no contract|verbal only/.test(text))
    items.push({ label: "Written contract", have: false, note: "verbal only" });
  else if (/written contract|signed contract|written agreement/.test(text))
    items.push({ label: "Written contract", have: true });
  if (/witness/.test(text)) items.push({ label: "Witness", have: true });
  return items.length > 0 ? items.slice(0, 5) : [{ label: "Case documentation", have: true }];
}

export function CaseDetailClient({ caseRecord }: { caseRecord: Case }) {
  const router = useRouter();
  const meta = getCaseMeta(caseRecord);
  const amount = extractClaimAmount(caseRecord.case_assessment, caseRecord.intake_text);
  const disputeType = inferDisputeType(caseRecord.intake_text);
  const strength = extractCaseStrength(caseRecord.case_assessment);
  const defendantName = inferDefendantName(caseRecord.intake_text);

  const sections = buildAssessmentSections(
    caseRecord.case_assessment,
    caseRecord.intake_text,
    caseRecord.province
  );
  const summaryText =
    sections.find((s) => s.title === "Summary")?.content ??
    caseRecord.intake_text.slice(0, 400);

  const evidenceItems = extractEvidenceItems(
    caseRecord.intake_text,
    caseRecord.case_assessment
  );

  const openedDate = new Date(caseRecord.created_at).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const daysSinceCase = Math.floor(
    (Date.now() - new Date(caseRecord.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = 14 - daysSinceCase;

  const [checkoutLoading, setCheckoutLoading] = useState<"demand" | "full" | null>(null);
  const [markingSent, setMarkingSent] = useState(false);
  const [sentDone, setSentDone] = useState(!!caseRecord.demand_letter_sent);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assessmentRef = useRef<HTMLDivElement>(null);

  async function handleCheckout(tier: "demand" | "full") {
    setCheckoutLoading(tier);
    saveCaseToSession(caseRecord);
    try {
      await startCheckout(tier, caseRecord.id, caseRecord.email);
    } catch {
      setCheckoutLoading(null);
    }
  }

  async function handleMarkSent() {
    setMarkingSent(true);
    try {
      await fetch("/api/cases/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseRecord.id,
          field: "demand_letter_sent",
          value: true,
        }),
      });
      await fetch("/api/cases/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseRecord.id,
          field: "demand_letter_sent_date",
          value: new Date().toISOString(),
        }),
      });
      setSentDone(true);
    } finally {
      setMarkingSent(false);
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

  // Pipeline: step 2 = active if hasDemandTier but no full; done if hasFullTier
  const step2State = meta.hasFullTier ? "done" : "active";
  const step3State = meta.hasFullTier ? "active" : "locked";

  // FCP step progress
  const hasDemandLetter = !!caseRecord.demand_letter?.trim();
  const isFiled = caseRecord.filing_confirmed ?? caseRecord.outcome === "filed";
  const isHearing = caseRecord.service_confirmed ?? caseRecord.outcome === "hearing";

  let badgeStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, letterSpacing: "0.5px", padding: "8px 16px",
    borderRadius: 20, textTransform: "uppercase", whiteSpace: "nowrap",
  };
  if (meta.statusBadge === "Demand Letter Sent")
    badgeStyle = { ...badgeStyle, background: "rgba(16,185,129,0.15)", color: GREEN };
  else if (meta.statusBadge === "Filed" || meta.statusBadge === "Hearing Scheduled")
    badgeStyle = { ...badgeStyle, background: "rgba(200,57,43,0.15)", color: RED };
  else
    badgeStyle = { ...badgeStyle, background: "rgba(212,168,83,0.15)", color: GOLD };

  return (
    <main style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Back */}
      <Link href="/dashboard/case-assessments" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 13, textDecoration: "none", marginBottom: 24 }}>
        ← Back to My Cases
      </Link>

      {/* Case header */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
            {disputeType} · {caseRecord.province}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, color: WHITE, margin: "0 0 6px 0" }}>
            {defendantName !== "Defendant" ? defendantName : disputeType}
          </h1>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>
            {amount && amount !== "0" ? `$${Number(amount).toLocaleString("en-CA")} at stake · ` : ""}
            Case opened {openedDate}
            {strength.score ? ` · ${strength.label} (${strength.score}/100)` : ` · ${strength.label}`}
          </div>
        </div>
        <span style={badgeStyle}>{meta.statusBadge}</span>
      </div>

      {/* Stage pipeline */}
      <div style={{ display: "flex", alignItems: "stretch", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        <button
          onClick={() => assessmentRef.current?.scrollIntoView({ behavior: "smooth" })}
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <PipelineStep state="done" number={1} label="Assessment" />
        </button>
        <div style={{ width: 1, background: BORDER }} />
        {meta.hasDemandTier ? (
          <Link href={`/dashboard/cases/${caseRecord.id}/demand-letter`} style={{ flex: 1, textDecoration: "none" }}>
            <PipelineStep state={step2State} number={2} label="Demand Letter" />
          </Link>
        ) : (
          <div style={{ flex: 1 }}>
            <PipelineStep state={step2State} number={2} label="Demand Letter" />
          </div>
        )}
        <div style={{ width: 1, background: BORDER }} />
        {meta.hasFullTier ? (
          <Link href={`/dashboard/cases/${caseRecord.id}/court-prep`} style={{ flex: 1, textDecoration: "none" }}>
            <PipelineStep state={step3State} number={3} label="Court Prep" />
          </Link>
        ) : (
          <div style={{ flex: 1 }}>
            <PipelineStep state={step3State} number={3} label="Court Prep" />
          </div>
        )}
      </div>

      {/* Two-column: Assessment + Evidence */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="grid-cols-1 md:grid-cols-2">
        {/* Assessment card */}
        <div ref={assessmentRef} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: GOLD, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Case Assessment
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, background: "rgba(16,185,129,0.15)", color: GREEN }}>
              {strength.label}{strength.score ? ` — ${strength.score}/100` : ""}
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", marginBottom: 20 }}>
            {summaryText.length > 400 ? summaryText.slice(0, 400) + "…" : summaryText}
          </p>
          <button
            type="button"
            onClick={() => downloadAssessmentPdf({ assessment: caseRecord.case_assessment, intake: caseRecord.intake_text, province: caseRecord.province })}
            style={{ background: "transparent", color: GOLD, border: `1px solid ${BORDER_GOLD}`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            ↓ Download PDF
          </button>
        </div>

        {/* Evidence card */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: GOLD, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            Your Evidence
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {evidenceItems.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < evidenceItems.length - 1 ? `1px solid ${BORDER}` : "none", fontSize: 13, color: WHITE }}>
                <span style={{ fontSize: 16, color: item.have ? GREEN : MUTED, flexShrink: 0 }}>{item.have ? "✓" : "–"}</span>
                {item.label}
                {item.note && <span style={{ color: AMBER, fontSize: 11, marginLeft: 4 }}>{item.note}</span>}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 16 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? GOLD : BORDER_GOLD}`, borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(212,168,83,0.08)" : GOLD_DIM, transition: "all 0.2s" }}
            >
              <div style={{ color: WHITE, fontSize: 13, fontWeight: 600 }}>
                {uploadDone ? "✓ Evidence uploaded" : uploading ? "Uploading…" : "+ Add more evidence"}
              </div>
              <p style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>Photos, invoices, emails, contracts</p>
            </div>
            <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
          </div>
        </div>
      </div>

      {/* Unlock / action section */}
      {meta.hasFullTier ? (
        <FullCasePackTeaser caseId={caseRecord.id} isFiled={!!isFiled} isHearing={!!isHearing} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="grid-cols-1 md:grid-cols-2">
          {/* Left card */}
          {meta.hasDemandTier ? (
            <div style={{ borderRadius: 14, padding: 28, position: "relative", overflow: "hidden", border: `1px solid ${GREEN}`, background: `linear-gradient(135deg, ${CARD2} 0%, rgba(16,185,129,0.06) 100%)` }}>
              <span style={{ position: "absolute", top: 16, right: 16, background: "rgba(16,185,129,0.15)", color: GREEN, fontSize: 10, letterSpacing: 1, padding: "4px 10px", borderRadius: 20, textTransform: "uppercase", fontWeight: 700 }}>
                ✓ Purchased
              </span>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Demand Letter</div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: WHITE, marginBottom: 8 }}>
                {hasDemandLetter ? "Your demand letter is ready." : "Your letter is being prepared."}
              </h3>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 16 }}>
                {daysRemaining > 0
                  ? <>Response deadline: <span style={{ color: daysRemaining <= 7 ? AMBER : WHITE }}>{daysRemaining} days remaining.</span></>
                  : <>The 14-day response window has passed.</>}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {!sentDone && hasDemandLetter && (
                  <button
                    type="button"
                    onClick={handleMarkSent}
                    disabled={markingSent}
                    style={{ width: "100%", padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: GOLD, color: NAVY, border: "none", opacity: markingSent ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {markingSent && <Spinner />}
                    Mark as Sent
                  </button>
                )}
                {sentDone && <p style={{ fontSize: 12, color: GREEN, textAlign: "center" }}>✓ Marked as sent</p>}
                {hasDemandLetter && (
                  <Link
                    href={`/dashboard/cases/${caseRecord.id}/demand-letter`}
                    style={{ display: "block", width: "100%", padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "transparent", color: GREEN, border: `1px solid ${GREEN}`, textAlign: "center", textDecoration: "none" }}
                  >
                    View My Letter
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div style={{ borderRadius: 14, padding: 28, position: "relative", overflow: "hidden", border: `1px solid rgba(212,168,83,0.4)`, background: `linear-gradient(135deg, ${CARD2} 0%, rgba(212,168,83,0.08) 100%)` }}>
              <span style={{ position: "absolute", top: 16, right: 16, background: "rgba(212,168,83,0.15)", color: GOLD, fontSize: 10, letterSpacing: 1, padding: "4px 10px", borderRadius: 20, textTransform: "uppercase", fontWeight: 700 }}>
                Recommended Next Step
              </span>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Demand Letter</div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: WHITE, marginBottom: 8 }}>Send a demand letter first.</h3>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 4 }}>40% of cases resolve right here. One letter often gets results before you ever file in court.</p>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, color: GOLD, margin: "16px 0" }}>$49</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0" }}>
                {["Province-specific legal language", "14-day payment demand", "Professional formatting", "Saved to your dashboard"].map((f) => (
                  <li key={f} style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", padding: "3px 0", display: "flex", gap: 8 }}>
                    <span style={{ color: GOLD, flexShrink: 0 }}>—</span>{f}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => handleCheckout("demand")} disabled={!!checkoutLoading} style={{ width: "100%", padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: GOLD, color: NAVY, opacity: checkoutLoading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {checkoutLoading === "demand" && <Spinner />}
                Get My Demand Letter →
              </button>
            </div>
          )}

          {/* Right: Full Case Pack upsell */}
          <div style={{ borderRadius: 14, padding: 28, border: `1px solid ${BORDER_GOLD}`, background: `linear-gradient(135deg, ${CARD2} 0%, rgba(16,185,129,0.06) 100%)` }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Full Case Pack</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: WHITE, marginBottom: 8 }}>
              {meta.hasDemandTier ? "They haven't responded? Here's what's next." : "Go straight to court. Your choice."}
            </h3>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>Get everything you need to file in small claims court and walk in prepared.</p>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, color: GOLD, margin: "16px 0" }}>$199</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0" }}>
              {["Province-specific filing instructions", "All court documents prepared", "Opening and closing scripts", "Day of court checklist"].map((f) => (
                <li key={f} style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", padding: "3px 0", display: "flex", gap: 8 }}>
                  <span style={{ color: GOLD, flexShrink: 0 }}>—</span>{f}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => handleCheckout("full")} disabled={!!checkoutLoading} style={{ width: "100%", padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: meta.hasDemandTier ? GOLD : "transparent", color: meta.hasDemandTier ? NAVY : GOLD, border: meta.hasDemandTier ? "none" : `1px solid ${GOLD}`, opacity: checkoutLoading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {checkoutLoading === "full" && <Spinner />}
              {meta.hasDemandTier ? "Get Full Case Pack →" : "Get Full Case Pack"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function PipelineStep({ state, number, label }: { state: "done" | "active" | "locked"; number: number; label: string }) {
  const nameColor = state === "done" ? GREEN : state === "active" ? GOLD : MUTED;
  return (
    <div style={{ flex: 1, padding: "16px 20px", textAlign: "center", background: state === "done" ? "rgba(16,185,129,0.08)" : state === "active" ? "rgba(212,168,83,0.10)" : "transparent", borderBottom: state === "active" ? `2px solid ${GOLD}` : "2px solid transparent", opacity: state === "locked" ? 0.4 : 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: MUTED, marginBottom: 4 }}>Step {number}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: nameColor }}>{state === "done" ? `✓ ${label}` : label}</div>
    </div>
  );
}

function FullCasePackTeaser({ caseId, isFiled, isHearing }: { caseId: string; isFiled: boolean; isHearing: boolean }) {
  const completedCount = 1 + (isFiled ? 1 : 0) + (isHearing ? 1 : 0);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: GREEN, marginBottom: 8 }}>Full Case Pack</div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: WHITE, marginBottom: 4 }}>Your court prep is ready.</h2>
          <p style={{ fontSize: 13, color: MUTED }}>Follow each step in order to prepare for court.</p>
        </div>
        <Link
          href={`/dashboard/cases/${caseId}/court-prep`}
          style={{ background: GOLD, color: NAVY, borderRadius: 8, padding: "12px 24px", fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Open Court Prep →
        </Link>
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, color: WHITE }}>
          <span style={{ color: GREEN, fontWeight: 700 }}>{completedCount}</span>
          <span style={{ color: MUTED }}> of 5 steps complete</span>
        </div>
        <Link href={`/dashboard/cases/${caseId}/demand-letter`} style={{ fontSize: 13, color: GOLD, textDecoration: "none" }}>
          View Demand Letter →
        </Link>
      </div>
    </div>
  );
}
