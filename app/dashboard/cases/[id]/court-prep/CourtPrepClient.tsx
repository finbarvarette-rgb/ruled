"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Case } from "@/lib/supabase";
import type { ProvinceFiling } from "@/lib/case-pack";
import { extractClaimAmount } from "../../../case-utils";
import { downloadBrandedPdf } from "@/lib/pdf-generator";
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

const CHECKLIST_KEY = "ruled_court_checklist_";

type StepState = "done" | "active" | "locked";

function parseHearingPrep(text: string | null): { opening: string; closing: string; defence: string[] } {
  if (!text?.trim()) return { opening: "", closing: "", defence: [] };

  const opening =
    text.match(/OPENING[^\n]*\n+([\s\S]*?)(?=\n+CLOSING|\n+DEFENCE|\n+ANTICIPATED|\n+DAY OF|$)/i)?.[1]?.trim() ?? "";
  const closing =
    text.match(/CLOSING[^\n]*\n+([\s\S]*?)(?=\n+DEFENCE|\n+ANTICIPATED|\n+DAY OF|$)/i)?.[1]?.trim() ?? "";

  const defenceBlock =
    text.match(/(?:DEFENCE|ANTICIPATED)[^\n]*\n+([\s\S]*?)(?=\n+DAY OF|$)/i)?.[1]?.trim() ?? "";

  const defence: string[] = [];
  if (defenceBlock) {
    const chunks = defenceBlock.split(/\n\n+/);
    chunks.forEach((chunk) => {
      if (chunk.trim()) defence.push(chunk.trim());
    });
  }

  return { opening: opening || text.slice(0, 800), closing, defence };
}

export function CourtPrepClient({
  caseRecord,
  filing,
  claimantName,
  checklist,
}: {
  caseRecord: Case;
  filing: ProvinceFiling;
  claimantName: string;
  checklist: string;
}) {
  const amount = extractClaimAmount(caseRecord.case_assessment, caseRecord.intake_text);
  const { opening, closing, defence } = parseHearingPrep(caseRecord.hearing_prep);

  const [filingConfirmed, setFilingConfirmed] = useState(!!caseRecord.filing_confirmed);
  const [serviceConfirmed, setServiceConfirmed] = useState(!!caseRecord.service_confirmed);
  const [confirmingFiling, setConfirmingFiling] = useState(false);
  const [confirmingService, setConfirmingService] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number>(
    filingConfirmed ? (serviceConfirmed ? 5 : 4) : filingConfirmed ? 4 : 3
  );
  const [activeTab, setActiveTab] = useState(0);
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem(CHECKLIST_KEY + caseRecord.id);
    if (stored) {
      try { setChecklistState(JSON.parse(stored)); } catch {}
    }
  }, [caseRecord.id]);

  function toggleChecklist(i: number) {
    setChecklistState((prev) => {
      const next = { ...prev, [i]: !prev[i] };
      localStorage.setItem(CHECKLIST_KEY + caseRecord.id, JSON.stringify(next));
      return next;
    });
  }

  async function updateStatus(field: string, value: unknown) {
    await fetch("/api/cases/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: caseRecord.id, field, value }),
    });
  }

  async function handleConfirmFiling() {
    setConfirmingFiling(true);
    try {
      await updateStatus("filing_confirmed", true);
      await updateStatus("filing_confirmed_date", new Date().toISOString());
      await updateStatus("outcome", "filed");
      setFilingConfirmed(true);
      setExpandedStep(4);
    } finally {
      setConfirmingFiling(false);
    }
  }

  async function handleConfirmService() {
    setConfirmingService(true);
    try {
      await updateStatus("service_confirmed", true);
      setServiceConfirmed(true);
      setExpandedStep(5);
    } finally {
      setConfirmingService(false);
    }
  }

  const claimAmountNum = amount && amount !== "0" ? Number(amount) : 0;

  // Compute filing fee from province filing data
  const filingFeeText = filing.filingFee;

  const steps: { title: string; state: StepState; done: boolean }[] = [
    { title: "Review demand letter", state: "done", done: true },
    { title: "Confirm intent to file", state: filingConfirmed ? "done" : "active", done: filingConfirmed },
    { title: "File your claim", state: filingConfirmed ? (filingConfirmed ? "active" : "done") : "locked", done: filingConfirmed },
    { title: "Serve the defendant", state: filingConfirmed ? (serviceConfirmed ? "done" : "active") : "locked", done: serviceConfirmed },
    { title: "Prepare for your hearing", state: serviceConfirmed ? "active" : "locked", done: false },
  ];

  // Fix step 3 state
  steps[2].state = filingConfirmed ? "done" : filingConfirmed === false ? "active" : "locked";
  // Actually step 2 is confirm intent, step 3 is file claim
  steps[2].state = filingConfirmed ? "done" : "active";
  steps[3].state = filingConfirmed ? (serviceConfirmed ? "done" : "active") : "locked";
  steps[4].state = serviceConfirmed ? "active" : "locked";

  const completedCount = steps.filter((s) => s.done).length;

  function StepCircle({ n, done, active }: { n: number; done: boolean; active: boolean }) {
    return (
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: done ? "rgba(16,185,129,0.1)" : GOLD_DIM, border: `1px solid ${done ? GREEN : BORDER_GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: PF, fontSize: 16, color: done ? GREEN : GOLD, flexShrink: 0 }}>
        {done ? "✓" : n}
      </div>
    );
  }

  const hearingTabs = ["Opening Script", "Closing Script", "Defence Arguments", "Day Of Checklist"];

  const checklistItems = checklist
    .split("\n")
    .filter((l) => l.includes("☐"))
    .map((l) => {
      const match = l.match(/☐\s*(.+)/);
      return match?.[1]?.trim() ?? l.trim();
    });

  return (
    <main style={{ padding: "32px", maxWidth: 900, margin: "0 auto" }}>
      {/* Back */}
      <Link href={`/dashboard/cases/${caseRecord.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 13, textDecoration: "none", marginBottom: 20 }}>
        ← Back to Case
      </Link>

      {/* Header */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: GREEN, marginBottom: 8 }}>Full Case Pack</div>
          <h1 style={{ fontFamily: PF, fontSize: 26, color: WHITE, marginBottom: 6 }}>Your court prep, step by step.</h1>
          <p style={{ fontSize: 13, color: MUTED }}>Everything you need. Follow each step in order.</p>
        </div>
        <span style={{ background: "rgba(16,185,129,0.15)", color: GREEN, fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 20, whiteSpace: "nowrap" }}>
          {completedCount} of 5 Complete
        </span>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Step 1 */}
        <StepCard
          num={1} title="Review your demand letter" state="done"
          onToggle={() => setExpandedStep(expandedStep === 1 ? 0 : 1)}
          expanded={expandedStep === 1}
        >
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>Your demand letter was sent to the defendant. The 14-day response window has started.</p>
          <Link href={`/dashboard/cases/${caseRecord.id}/demand-letter`} style={{ fontSize: 13, color: GREEN, textDecoration: "none" }}>✓ Complete — View letter →</Link>
        </StepCard>

        {/* Step 2 */}
        <StepCard
          num={2} title="Confirm intent to file" state={filingConfirmed ? "done" : "active"}
          onToggle={() => setExpandedStep(expandedStep === 2 ? 0 : 2)}
          expanded={expandedStep === 2}
        >
          {filingConfirmed ? (
            <p style={{ fontSize: 13, color: GREEN }}>✓ Confirmed — you're proceeding to small claims court in {caseRecord.province}.</p>
          ) : (
            <>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 16 }}>
                Before we walk you through filing, confirm that you want to proceed to small claims court in <strong style={{ color: WHITE }}>{caseRecord.province}</strong>.
              </p>
              <button
                type="button"
                onClick={handleConfirmFiling}
                disabled={confirmingFiling}
                style={{ background: GOLD, color: NAVY, border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                {confirmingFiling && <Spinner />}
                Yes, I want to file in court
              </button>
            </>
          )}
        </StepCard>

        {/* Step 3 */}
        <StepCard
          num={3} title="File your claim at the courthouse" state={steps[2].state}
          onToggle={() => filingConfirmed && setExpandedStep(expandedStep === 3 ? 0 : 3)}
          expanded={expandedStep === 3}
          locked={!filingConfirmed}
        >
          {/* Filing hero */}
          <div style={{ background: `linear-gradient(135deg, ${CARD2} 0%, rgba(212,168,83,0.06) 100%)`, border: `1px solid ${BORDER_GOLD}`, borderRadius: 12, padding: 20, marginBottom: 16, display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ background: GOLD_DIM, border: `1px solid ${BORDER_GOLD}`, borderRadius: 10, padding: "14px 20px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: PF, fontSize: 22, color: GOLD }}>
                {claimAmountNum <= 1000 ? "~$75" : claimAmountNum <= 5000 ? "~$100" : "~$200"}
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Filing Fee</div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{filing.courtName}</div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                {filing.filingFee}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {[
              { n: 1, title: "Download your Claim Form", desc: `Your claim has been pre-filled. Review it, print it, and bring it to the courthouse.`, action: <button type="button" onClick={() => downloadBrandedPdf(`ruled-claim-form-${caseRecord.id.slice(0,8)}.pdf`, { documentTitle: "Claim Form", body: caseRecord.court_docs ?? "Court documents not yet available." })} style={{ background: GOLD, color: NAVY, border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 10 }}>↓ Download Claim Form</button> },
              { n: 2, title: "Go to the courthouse in person", desc: `Bring your printed Claim Form and filing fee. ${filing.location}`, note: "Bring 3 printed copies — court, defendant, yourself." },
              { n: 3, title: "Confirm your filing here", desc: "Once filed, come back and mark this step complete to unlock serving the defendant." },
            ].map((s) => (
              <div key={s.n} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, display: "flex", gap: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: GOLD_DIM, border: `1px solid ${BORDER_GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: PF, fontSize: 14, color: GOLD, flexShrink: 0 }}>{s.n}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{s.desc}</div>
                  {s.note && <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: AMBER, marginTop: 8 }}>{s.note}</div>}
                  {s.action}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleConfirmFiling}
            disabled={confirmingFiling}
            style={{ background: GOLD, color: NAVY, border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            {confirmingFiling && <Spinner />}
            ✓ I've Filed My Claim
          </button>
        </StepCard>

        {/* Step 4 */}
        <StepCard
          num={4} title="Serve the defendant" state={steps[3].state}
          onToggle={() => filingConfirmed && setExpandedStep(expandedStep === 4 ? 0 : 4)}
          expanded={expandedStep === 4}
          locked={!filingConfirmed}
        >
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, marginBottom: 16 }}>
            <strong style={{ color: GREEN }}>Why this matters:</strong> You are legally required to serve the defendant with a copy of your filed claim. If you don't serve them properly, the court cannot proceed.
          </div>

          {[
            { n: 1, title: "Get your filed claim documents", desc: "After filing, the courthouse stamps your claim form and gives you copies. You need at least one copy to serve on the defendant." },
            { n: 2, title: "Choose your method of service", desc: "You can serve by:", methods: ["Personal Service — Hand the documents directly to the defendant. Simplest and most reliable.", "Registered Mail — Send by Canada Post registered mail. Keep your tracking receipt.", "Email — If they communicated with you by email previously, you may be able to serve by email. Confirm with the court clerk."] },
            { n: 3, title: "Complete your Proof of Service form", desc: "After serving, fill out the Proof of Service form. This confirms to the court the defendant was properly notified.", action: <button type="button" onClick={() => downloadBrandedPdf("ruled-proof-of-service.pdf", { documentTitle: "Proof of Service", body: `PROOF OF SERVICE\n\nI hereby certify that I have served the defendant in the above-referenced small claims matter.\n\nDate of service: _______________\nMethod of service: _______________\nDefendant's name: _______________\nAddress served: _______________\n\nSignature: _______________` })} style={{ background: GOLD, color: NAVY, border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 10 }}>↓ Download Proof of Service Form</button> },
            { n: 4, title: "File your Proof of Service", desc: "Return to the courthouse and file your completed Proof of Service. The court will then schedule your hearing date.", note: "You typically have 30 days from filing to serve the defendant. Do not delay." },
          ].map((s) => (
            <div key={s.n} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, display: "flex", gap: 14, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: GOLD_DIM, border: `1px solid ${BORDER_GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: PF, fontSize: 14, color: GOLD, flexShrink: 0 }}>{s.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{s.desc}</div>
                {(s as any).methods && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {(s as any).methods.map((m: string, mi: number) => {
                      const [label, ...rest] = m.split(" — ");
                      return (
                        <div key={mi} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                          <strong style={{ color: GOLD }}>{label}</strong>{rest.length ? ` — ${rest.join(" — ")}` : ""}
                        </div>
                      );
                    })}
                  </div>
                )}
                {(s as any).note && <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: AMBER, marginTop: 8 }}>{(s as any).note}</div>}
                {(s as any).action}
              </div>
            </div>
          ))}

          {serviceConfirmed ? (
            <p style={{ fontSize: 13, color: GREEN }}>✓ Service confirmed. Your hearing prep is unlocked below.</p>
          ) : (
            <button
              type="button"
              onClick={handleConfirmService}
              disabled={confirmingService}
              style={{ background: GOLD, color: NAVY, border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              {confirmingService && <Spinner />}
              ✓ I've Served the Defendant
            </button>
          )}
        </StepCard>

        {/* Step 5 */}
        <StepCard
          num={5} title="Prepare for your hearing" state={steps[4].state}
          onToggle={() => serviceConfirmed && setExpandedStep(expandedStep === 5 ? 0 : 5)}
          expanded={expandedStep === 5}
          locked={!serviceConfirmed}
        >
          {/* Hearing tabs */}
          <div style={{ display: "flex", gap: 0, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
            {hearingTabs.map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(i)}
                style={{ flex: 1, padding: "12px 8px", textAlign: "center", fontSize: 12, color: activeTab === i ? GOLD : MUTED, cursor: "pointer", background: activeTab === i ? GOLD_DIM : "transparent", borderBottom: activeTab === i ? `2px solid ${GOLD}` : "2px solid transparent", border: "none", borderRight: i < hearingTabs.length - 1 ? `1px solid ${BORDER}` : "none", fontWeight: activeTab === i ? 600 : 400, transition: "all 0.2s" }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab 0: Opening */}
          {activeTab === 0 && (
            <div>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: GOLD }}>Opening Statement</div>
                  <button type="button" onClick={() => downloadBrandedPdf("ruled-opening-statement.pdf", { documentTitle: "Opening Statement", body: opening || "Opening statement not yet generated." })} style={{ background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>↓ Download</button>
                </div>
                <div style={{ padding: 20, fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
                  {opening || "Your opening statement will appear here after the Full Case Pack is generated."}
                </div>
              </div>
              <div style={{ background: GOLD_DIM, border: `1px solid ${BORDER_GOLD}`, borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>
                <strong style={{ color: GOLD }}>Tip:</strong> Keep your opening under 3 minutes. State the facts clearly. Don't argue yet — save that for when you present your evidence.
              </div>
            </div>
          )}

          {/* Tab 1: Closing */}
          {activeTab === 1 && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: GOLD }}>Closing Statement</div>
                <button type="button" onClick={() => downloadBrandedPdf("ruled-closing-statement.pdf", { documentTitle: "Closing Statement", body: closing || "Closing statement not yet generated." })} style={{ background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>↓ Download</button>
              </div>
              <div style={{ padding: 20, fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
                {closing || "Your closing statement will appear here after the Full Case Pack is generated."}
              </div>
            </div>
          )}

          {/* Tab 2: Defence */}
          {activeTab === 2 && (
            <div>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>Arguments the defendant may raise and how to respond to each.</p>
              {defence.length > 0 ? defence.map((chunk, i) => {
                const lines = chunk.split("\n").filter(Boolean);
                const arg = lines[0];
                const response = lines.slice(1).join(" ");
                return (
                  <div key={i} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: AMBER }}>⚠ {arg}</div>
                    {response && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}><strong style={{ color: WHITE }}>Your response:</strong> {response}</div>}
                  </div>
                );
              }) : (
                <p style={{ fontSize: 13, color: MUTED }}>Defence arguments will appear here after the Full Case Pack is generated.</p>
              )}
            </div>
          )}

          {/* Tab 3: Checklist */}
          {activeTab === 3 && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: GOLD, marginBottom: 16 }}>Day of Court Checklist</div>
              {checklistItems.length > 0 ? checklistItems.map((item, i) => (
                <div key={i} onClick={() => toggleChecklist(i)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: i < checklistItems.length - 1 ? `1px solid ${BORDER}` : "none", cursor: "pointer" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${checklistState[i] ? GREEN : BORDER_GOLD}`, background: checklistState[i] ? GREEN : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {checklistState[i] && <span style={{ color: WHITE, fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 13, color: checklistState[i] ? MUTED : WHITE, lineHeight: 1.5, textDecoration: checklistState[i] ? "line-through" : "none" }}>
                    {item}
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: 13, color: MUTED }}>Day of court checklist not available yet.</p>
              )}
            </div>
          )}
        </StepCard>
      </div>
    </main>
  );
}

function StepCard({
  num, title, state, onToggle, expanded, locked, children,
}: {
  num: number;
  title: string;
  state: "done" | "active" | "locked";
  onToggle: () => void;
  expanded: boolean;
  locked?: boolean;
  children?: React.ReactNode;
}) {
  const GOLD = "#D4A853";
  const GOLD_DIM = "rgba(212,168,83,0.10)";
  const GREEN = "#10B981";
  const BORDER = "rgba(255,255,255,0.07)";
  const BORDER_GOLD = "rgba(212,168,83,0.25)";
  const CARD = "#151C2E";
  const WHITE = "#FFFFFF";
  const MUTED = "rgba(255,255,255,0.5)";

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${state === "done" ? "rgba(16,185,129,0.3)" : expanded ? BORDER_GOLD : BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
        opacity: locked ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={locked}
        style={{ width: "100%", background: "none", border: "none", cursor: locked ? "not-allowed" : "pointer", padding: 20, display: "flex", alignItems: "center", gap: 16, textAlign: "left" }}
      >
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: state === "done" ? "rgba(16,185,129,0.1)" : GOLD_DIM, border: `1px solid ${state === "done" ? GREEN : BORDER_GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, color: state === "done" ? GREEN : GOLD, flexShrink: 0 }}>
          {state === "done" ? "✓" : num}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: WHITE }}>{title}</div>
          {locked && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Unlocks after Step {num - 1}</div>}
        </div>
        {!locked && (
          <span style={{ color: MUTED, fontSize: 16, transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
        )}
      </button>
      {expanded && !locked && (
        <div style={{ padding: "0 20px 20px" }}>
          {children}
        </div>
      )}
    </div>
  );
}
