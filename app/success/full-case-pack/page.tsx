"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { restoreSessionFromPayment, updateRuledSession } from "@/lib/session";
import {
  buildDayOfCourtChecklist,
  buildHowToFileText,
  extractClaimAmount,
  getProvinceFiling,
  inferClaimantName,
  inferDefendantName,
} from "@/lib/case-pack";
import { downloadBrandedPdf } from "@/lib/pdf-generator";
import { Spinner } from "@/components/Spinner";

const LOADING_BG = "#FAFAFA";
const LOADING_NAVY = "#0F172A";
const LOADING_BLUE = "#2563EB";
const LOADING_MUTED = "#64748B";
const LOADING_BORDER = "#E2E8F0";

const PACK_STATUS_MESSAGES = [
  "Reviewing your case...",
  "Preparing court filing instructions...",
  "Writing your hearing script...",
  "Building your document package...",
  "Almost ready...",
];

const COURT_STATUS_MESSAGES = [
  "Preparing your court filing documents...",
  "Drafting claim forms and service templates...",
  "Almost ready...",
];

const HEARING_STATUS_MESSAGES = [
  "Writing your hearing preparation script...",
  "Preparing your opening and closing statements...",
  "Almost ready...",
];

type GenerateSection = "court" | "hearing";

function useGenerationLoading(active: boolean, messages: string[]) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(100);
      return;
    }

    setProgress(0);
    setMessageIndex(0);
    const startedAt = Date.now();

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(95, (elapsed / 15000) * 95));
    }, 50);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % messages.length);
    }, 3500);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(messageTimer);
    };
  }, [active, messages]);

  const statusMessage = messages[messageIndex % messages.length] ?? messages[0];

  return { progress: active ? progress : 100, statusMessage };
}

function GenerationLoadingScreen({
  progress,
  statusMessage,
}: {
  progress: number;
  statusMessage: string;
}) {
  const displayProgress = Math.round(Math.min(100, Math.max(0, progress)));

  return (
    <main
      className="flex flex-col min-h-screen w-full"
      style={{ background: LOADING_BG, color: LOADING_NAVY }}
    >
      <div className="flex flex-col flex-1 items-center justify-center px-6 py-12 max-w-md mx-auto w-full gap-10">
        <div
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          <span style={{ color: LOADING_NAVY }}>ruled</span>
          <span style={{ color: LOADING_BLUE }}>.ca</span>
        </div>

        <div className="w-full flex flex-col gap-3">
          <div
            className="h-2.5 w-full rounded-full overflow-hidden"
            style={{ background: LOADING_BORDER }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-150 ease-out"
              style={{
                width: `${displayProgress}%`,
                background: LOADING_BLUE,
              }}
            />
          </div>
          <p
            className="text-xs font-medium tabular-nums text-right"
            style={{ color: LOADING_MUTED }}
          >
            {displayProgress}%
          </p>
        </div>

        <p
          className="text-base sm:text-lg font-medium text-center min-h-[3rem] flex items-center justify-center"
          style={{ color: LOADING_NAVY }}
        >
          {statusMessage}
        </p>

        <p
          className="text-sm text-center leading-relaxed max-w-sm"
          style={{ color: LOADING_MUTED }}
        >
          This usually takes 20-30 seconds. Please don&apos;t close this tab.
        </p>
      </div>
    </main>
  );
}

type PaymentData = {
  tier: string;
  caseId: string;
  assessment: string;
  intake: string;
  province: string;
  email: string | null;
  demandLetter: string | null;
  courtDocs?: string | null;
  hearingPrep?: string | null;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const PREVIEW_DEMAND_LETTER = `Jane Smith
Smith Renovations Inc.
jane.smith@email.com

May 18, 2026

ABC Contracting Ltd.
123 Main Street
Toronto, ON M5V 1A1

RE: Formal Demand for Payment — $5,000.00

Dear ABC Contracting Ltd.,

I am writing regarding the renovation contract we entered into on March 1, 2026. I paid a deposit of $5,000.00 on March 5, 2026. You ceased work on April 2, 2026 without completing the contracted work.

I formally demand payment of $5,000.00 within fourteen (14) days. If payment is not received, I intend to file in the Ontario Small Claims Court.

Yours truly,

Jane Smith`;

const PREVIEW_COURT_DOCS = `PLAINTIFF'S CLAIM FORM (FORM 7A) — COMPLETED GUIDE

Claimant: Jane Smith
Defendant: ABC Contracting Ltd.
Amount claimed: $5,000.00 plus court costs

Description of claim:
On March 1, 2026, the defendant agreed to complete bathroom and kitchen renovations for $10,000. I paid a $5,000 deposit on March 5, 2026. The defendant performed partial work and abandoned the project on April 2, 2026. I am claiming return of the deposit for incomplete work.

---

AFFIDAVIT OF SERVICE TEMPLATE

I, Jane Smith, swear/affirm that on [DATE], I served a copy of the Plaintiff's Claim on ABC Contracting Ltd. by [registered mail / personal service] at 123 Main Street, Toronto, ON.

Signature: _______________
Date: _______________

---

EVIDENCE INDEX

Exhibit A — Renovation contract (March 1, 2026)
Exhibit B — Bank transfer confirmation ($5,000 deposit)
Exhibit C — Photographs of incomplete work
Exhibit D — Text messages requesting completion
Exhibit E — Copy of demand letter and Canada Post tracking`;

const PREVIEW_HEARING_PREP = `YOUR OPENING STATEMENT

Your Honour, my name is Jane Smith and I am the plaintiff in this matter. I am here today because the defendant, ABC Contracting Ltd., accepted a $5,000 deposit for renovation work and failed to complete the contracted work. I have brought the contract, payment records, photographs, and correspondence showing the defendant stopped work on April 2, 2026. I am asking the court to order the defendant to return my $5,000 deposit.

---

YOUR CLOSING STATEMENT

Your Honour, the evidence shows I paid $5,000 for work that was never completed. The defendant has not disputed the contract or payment. I have acted in good faith throughout. I respectfully ask the court to grant my claim in full, plus any costs the court sees fit to award.

---

HOW TO PRESENT YOUR EVIDENCE

1. Hand the judge your evidence binder with tabs matching the index.
2. Start with the contract (Exhibit A), then payment proof (Exhibit B).
3. Walk through photos (Exhibit C) and explain what they show.
4. Reference text messages (Exhibit D) — read only relevant lines.
5. Show the demand letter and proof of delivery (Exhibit E).

---

ANTICIPATED DEFENCE ARGUMENTS

Defence: "Work was substantially completed."
Response: Photos and messages show key areas were unfinished; I documented the state on April 2.

Defence: "The contract was verbal / terms differed."
Response: I have written messages confirming price, scope, and deposit.

Defence: "She owes us for materials."
Response: No materials were left on site; deposit was for labour and completion.

---

COURTROOM ETIQUETTE

- Address the judge as "Your Honour."
- Stand when speaking to the court.
- Do not interrupt the defendant or the judge.
- Business casual attire — clean, neat, and respectful.
- Turn off your phone before entering the courtroom.
- Speak clearly and stick to facts — not emotions.`;

const PREVIEW_ASSESSMENT = `CASE STRENGTH
Strong. Clear contract, payment proof, and documented abandonment.

ESTIMATED CLAIM AMOUNT
$5,000.00`;

async function generateDemandLetter(data: PaymentData): Promise<string> {
  const res = await fetch("/api/demand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderName: inferClaimantName(data.intake, data.email),
      senderEmail: data.email ?? "claimant@email.com",
      defendantName: inferDefendantName(data.intake),
      defendantAddress: "Address on file",
      claimAmount: extractClaimAmount(data.assessment, data.intake),
      disputeDate: new Date().toISOString().slice(0, 10),
      province: data.province,
      caseAssessment: data.assessment,
      caseId: data.caseId,
    }),
  });
  if (!res.ok) throw new Error("Failed to generate demand letter");
  const json = (await res.json()) as { letter?: string };
  if (!json.letter) throw new Error("No letter returned");
  return json.letter;
}

async function fetchCourtDocs(assessment: string, province: string): Promise<string> {
  const res = await fetch("/api/court-docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseAssessment: assessment, province }),
  });
  if (!res.ok) throw new Error("Failed to generate court documents");
  const json = (await res.json()) as { content?: string };
  return json.content ?? "";
}

async function fetchHearingPrep(assessment: string, province: string): Promise<string> {
  const res = await fetch("/api/hearing-prep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseAssessment: assessment, province }),
  });
  if (!res.ok) throw new Error("Failed to generate hearing prep");
  const json = (await res.json()) as { content?: string };
  return json.content ?? "";
}

function downloadPdf(title: string, content: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  downloadBrandedPdf(`ruled-${slug || "document"}.pdf`, {
    documentTitle: title,
    body: content,
  });
}

function SerifDoc({ children }: { children: string }) {
  return (
    <div
      className="rounded-xl px-6 sm:px-8 py-6 text-left whitespace-pre-wrap leading-relaxed text-sm md:text-base"
      style={{
        background: "#ffffff",
        color: "#0f0e0c",
        fontFamily: "Georgia, 'Times New Roman', serif",
        border: "1px solid #e8e4de",
      }}
    >
      {children}
    </div>
  );
}

function PackSection({
  title,
  content,
  previewMax = 2400,
}: {
  title: string;
  content: string;
  previewMax?: number;
}) {
  const preview =
    content.length > previewMax
      ? `${content.slice(0, previewMax)}…`
      : content;

  return (
    <section
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: "#1a1916", border: "1px solid #2a2825" }}
    >
      <div
        className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b"
        style={{ borderColor: "#2a2825" }}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={() => downloadPdf(title, content)}
          className="shrink-0 rounded-lg px-4 py-2.5 text-xs font-semibold cursor-pointer"
          style={{ background: "#c8392b", color: "#f5f1eb" }}
        >
          Download PDF
        </button>
      </div>
      <div className="px-4 sm:px-5 pb-5 pt-4">
        <SerifDoc>{preview}</SerifDoc>
      </div>
    </section>
  );
}

function FullCasePackDeliveryContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const caseIdParam = searchParams.get("caseId");
  const isPreview = searchParams.get("preview") === "true";
  const sectionParam = searchParams.get("section");
  const generateTarget: GenerateSection | null =
    sectionParam === "court" || sectionParam === "hearing" ? sectionParam : null;

  const [phase, setPhase] = useState<"loading" | "generating" | "ready" | "error">(
    "loading"
  );
  const [error, setError] = useState("");
  const [province, setProvince] = useState("");
  const [assessment, setAssessment] = useState("");
  const [intake, setIntake] = useState("");
  const [demandLetter, setDemandLetter] = useState("");
  const [courtDocs, setCourtDocs] = useState("");
  const [hearingPrep, setHearingPrep] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const isBusy = phase === "loading" || phase === "generating";
  const loadingMessages =
    generateTarget === "court"
      ? COURT_STATUS_MESSAGES
      : generateTarget === "hearing"
        ? HEARING_STATUS_MESSAGES
        : PACK_STATUS_MESSAGES;
  const { progress, statusMessage } = useGenerationLoading(isBusy, loadingMessages);

  const claimantName = useMemo(
    () => inferClaimantName(intake, null) || "Claimant",
    [intake]
  );

  const filing = useMemo(
    () => getProvinceFiling(province),
    [province]
  );

  const howToFileText = useMemo(
    () => buildHowToFileText(province, filing, courtDocs),
    [province, filing, courtDocs]
  );

  const checklist = useMemo(
    () => buildDayOfCourtChecklist(province, claimantName),
    [province, claimantName]
  );

  useEffect(() => {
    if (isPreview) {
      setProvince("Ontario");
      setAssessment(PREVIEW_ASSESSMENT);
      setIntake("Contractor ABC Contracting took $5000 deposit and ghosted.");
      setDemandLetter(PREVIEW_DEMAND_LETTER);
      setCourtDocs(PREVIEW_COURT_DOCS);
      setHearingPrep(PREVIEW_HEARING_PREP);
      setPhase("ready");
      return;
    }

    async function savePackPartial(
      caseId: string,
      partial: {
        demandLetter?: string;
        courtDocs?: string;
        hearingPrep?: string;
      }
    ) {
      await fetch("/api/cases/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, ...partial }),
      }).catch(() => {});
    }

    async function finishPack(
      data: PaymentData,
      notifyDelivery: boolean,
      section: GenerateSection | null
    ) {
      if (data.tier !== "full") {
        throw new Error(
          "This delivery page is for Full Case Pack purchases. Check your email for the correct link."
        );
      }

      restoreSessionFromPayment({
        assessment: data.assessment,
        intake: data.intake,
        province: data.province,
        caseId: data.caseId,
        email: data.email,
        demandLetter: data.demandLetter,
      });

      setProvince(data.province);
      setAssessment(data.assessment);
      setIntake(data.intake);

      let letter =
        data.demandLetter ??
        (typeof window !== "undefined"
          ? sessionStorage.getItem("ruled_demand_letter")
          : null);
      let court = data.courtDocs ?? "";
      let hearing = data.hearingPrep ?? "";

      if (section === "court") {
        if (!court.trim()) {
          setPhase("generating");
          court = await fetchCourtDocs(data.assessment, data.province);
          await savePackPartial(data.caseId, { courtDocs: court });
        }
      } else if (section === "hearing") {
        if (!hearing.trim()) {
          setPhase("generating");
          hearing = await fetchHearingPrep(data.assessment, data.province);
          await savePackPartial(data.caseId, { hearingPrep: hearing });
        }
      } else {
        const needLetter = !letter;
        const needCourt = !court.trim();
        const needHearing = !hearing.trim();
        if (needLetter || needCourt || needHearing) {
          setPhase("generating");
          const [letterResult, courtResult, hearingResult] = await Promise.all([
            needLetter ? generateDemandLetter(data) : Promise.resolve(letter!),
            needCourt
              ? fetchCourtDocs(data.assessment, data.province)
              : Promise.resolve(court),
            needHearing
              ? fetchHearingPrep(data.assessment, data.province)
              : Promise.resolve(hearing),
          ]);
          letter = letterResult;
          court = courtResult;
          hearing = hearingResult;
          if (!letter) {
            throw new Error("Failed to generate demand letter");
          }
          const partial: {
            demandLetter?: string;
            courtDocs?: string;
            hearingPrep?: string;
          } = {};
          if (needLetter) partial.demandLetter = letter;
          if (needCourt) partial.courtDocs = court;
          if (needHearing) partial.hearingPrep = hearing;
          await savePackPartial(data.caseId, partial);
        }
      }

      if (!letter && !section) {
        throw new Error("Demand letter is missing");
      }

      if (letter) {
        updateRuledSession({ demandLetter: letter });
      }
      setDemandLetter(letter ?? "");
      setCourtDocs(court);
      setHearingPrep(hearing);
      setPhase("ready");

      if (notifyDelivery && data.caseId) {
        void fetch("/api/emails/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "full", caseId: data.caseId }),
        }).catch(() => {});
      }
    }

    async function load() {
      try {
        if (caseIdParam && !sessionId) {
          const url = `/api/cases/access?caseId=${encodeURIComponent(caseIdParam)}`;
          const res = await fetch(url, { credentials: "include" });
          const contentType = res.headers.get("content-type") ?? "";
          if (!contentType.includes("application/json")) {
            throw new Error(
              `Could not load your case (${res.status}). Expected JSON from ${url}.`
            );
          }
          const data = (await res.json()) as PaymentData & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Could not load your case");
          }
          await finishPack(data, false, generateTarget);
          return;
        }

        if (!sessionId) {
          setError("Invalid payment session.");
          setPhase("error");
          return;
        }

        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = (await res.json()) as PaymentData & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Payment verification failed");
        }
        await finishPack(data, true, generateTarget);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "We could not load your case pack. Contact hello@ruled.ca with your receipt."
        );
        setPhase("error");
      }
    }

    load();
  }, [sessionId, caseIdParam, isPreview, generateTarget]);

  const handleChatSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || chatLoading || !assessment) return;
      const question = chatInput.trim();
      setChatInput("");
      const userMsg: ChatMessage = { role: "user", content: question };
      const nextMessages = [...chatMessages, userMsg].slice(-10);
      setChatMessages(nextMessages);
      setChatLoading(true);
      try {
        const res = await fetch("/api/case-qa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            caseAssessment: assessment,
            history: nextMessages.slice(0, -1),
          }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as { answer?: string };
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.answer ?? "No answer returned.",
        };
        setChatMessages((prev) => [...prev, assistantMsg].slice(-10));
      } catch {
        const errMsg: ChatMessage = {
          role: "assistant",
          content: "Sorry, I could not answer that. Please try again.",
        };
        setChatMessages((prev) => [...prev, errMsg].slice(-10));
      } finally {
        setChatLoading(false);
      }
    },
    [chatInput, chatLoading, assessment, chatMessages]
  );

  if (isBusy) {
    return (
      <GenerationLoadingScreen progress={progress} statusMessage={statusMessage} />
    );
  }

  if (phase === "error") {
    return (
      <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-16 items-center justify-center">
        <p className="text-sm text-center max-w-md" style={{ color: "#c8392b" }}>
          {error}
        </p>
        <Link href="/" className="mt-6 text-sm" style={{ color: "#9a9590" }}>
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen overflow-x-hidden pb-24">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 md:gap-8 min-w-0 px-4 sm:px-6 py-10 md:py-14">
        {isPreview && (
          <p
            className="text-xs font-medium text-center rounded-lg px-3 py-2"
            style={{
              background: "rgba(200, 57, 43, 0.15)",
              color: "#c8392b",
              border: "1px dashed #c8392b",
            }}
          >
            Development preview — placeholder data only
          </p>
        )}

        <header className="flex flex-col gap-3">
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "#9a9590" }}
          >
            Full Case Pack — $199
          </p>
          <h1
            className="text-2xl md:text-3xl font-semibold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Your Full Case Pack is Ready ✅ — You&apos;re prepared to win.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            Everything you need to file in {province} small claims court and
            present your case with confidence.
          </p>
        </header>

        <div className="flex flex-col gap-8">
          <PackSection title="How to File" content={howToFileText} />
          {courtDocs.trim() ? (
            <PackSection title="Court Documents" content={courtDocs} />
          ) : null}
          {hearingPrep.trim() ? (
            <PackSection title="Hearing Prep Script" content={hearingPrep} />
          ) : null}
          <PackSection title="Day of Court Checklist" content={checklist} />
        </div>

        <p className="text-sm text-center">
          <Link href="/dashboard" style={{ color: "#c8392b" }}>
            Your case pack is saved in your Ruled dashboard →
          </Link>
        </p>
      </div>

      {/* Sticky AI CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
        style={{
          background: "rgba(15, 14, 12, 0.95)",
          borderTop: "1px solid #2a2825",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="w-full rounded-xl px-6 py-3.5 text-sm font-semibold cursor-pointer"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Have a question? Ask Ruled AI →
          </button>
        </div>
      </div>

      {/* AI panel */}
      {aiOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:px-4"
          style={{ background: "rgba(15, 14, 12, 0.9)" }}
          onClick={() => setAiOpen(false)}
          role="presentation"
        >
          <div
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[85vh]"
            style={{ background: "#1a1916", border: "1px solid #2a2825" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Ask Ruled AI"
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "#2a2825" }}
            >
              <h2 className="font-semibold">Ask Ruled AI</h2>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                className="text-sm cursor-pointer"
                style={{ color: "#9a9590" }}
              >
                Close
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-[200px] max-h-[50vh]"
            >
              {chatMessages.length === 0 && (
                <p className="text-sm" style={{ color: "#9a9590" }}>
                  Unlimited Q&amp;A is included in your Full Case Pack. Ask
                  about filing, evidence, the hearing, or what to do next.
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-sm leading-relaxed">
                  <span
                    className="text-xs font-semibold block mb-1"
                    style={{ color: "#c8392b" }}
                  >
                    {msg.role === "user" ? "You" : "Ruled AI"}
                  </span>
                  <span style={{ color: "#d4cfc9" }}>{msg.content}</span>
                </div>
              ))}
              {chatLoading && (
                <p className="text-sm flex items-center gap-2" style={{ color: "#9a9590" }}>
                  <Spinner /> Thinking…
                </p>
              )}
            </div>
            <form
              onSubmit={handleChatSubmit}
              className="px-5 py-4 border-t flex gap-2"
              style={{ borderColor: "#2a2825" }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your case…"
                className="flex-1 rounded-lg px-4 py-3 text-sm outline-none min-w-0"
                style={{
                  background: "#0f0e0c",
                  color: "#f5f1eb",
                  border: "1px solid #2a2825",
                }}
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer shrink-0"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                Ask
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function FullCasePackDeliveryPage() {
  return (
    <Suspense
      fallback={
        <GenerationLoadingScreen
          progress={0}
          statusMessage={PACK_STATUS_MESSAGES[0]}
        />
      }
    >
      <FullCasePackDeliveryContent />
    </Suspense>
  );
}
