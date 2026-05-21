"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { restoreSessionFromPayment, updateRuledSession } from "@/lib/session";
import {
  buildDayOfCourtChecklist,
  buildHowToFileText,
  extractClaimAmount,
  getProvinceFiling,
  hasDocumentContent,
  inferClaimantName,
  inferDefendantName,
} from "@/lib/case-pack";
import { downloadBrandedPdf } from "@/lib/pdf-generator";
import { generateCaseTitle } from "@/app/dashboard/case-utils";
import type { Case } from "@/lib/supabase";

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

const BRAND_BG = "#FAFAFA";
const BRAND_NAVY = "#0F172A";
const BRAND_BLUE = "#2563EB";
const BRAND_MUTED = "#64748B";
const BRAND_BORDER = "#E2E8F0";

function DeliverySection({
  title,
  content,
  generateHref,
}: {
  title: string;
  content: string;
  generateHref?: string | null;
}) {
  const canDownload = hasDocumentContent(content);

  return (
    <section
      className="rounded-xl flex flex-col overflow-hidden"
      style={{
        background: "#ffffff",
        border: `1px solid ${BRAND_BORDER}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ borderBottom: `1px solid ${BRAND_BORDER}` }}
      >
        <h2
          className="text-lg font-semibold tracking-tight"
          style={{ color: BRAND_NAVY }}
        >
          {title}
        </h2>
        {canDownload ? (
          <button
            type="button"
            onClick={() => downloadPdf(title, content)}
            className="shrink-0 rounded-lg px-4 py-2.5 text-xs font-semibold cursor-pointer text-white"
            style={{ background: BRAND_BLUE }}
          >
            Download PDF
          </button>
        ) : generateHref ? (
          <Link
            href={generateHref}
            className="shrink-0 rounded-lg px-4 py-2.5 text-xs font-semibold text-center text-white"
            style={{ background: BRAND_BLUE }}
          >
            Generate
          </Link>
        ) : null}
      </div>
      {canDownload ? (
        <p
          className="px-5 sm:px-6 py-3 text-xs"
          style={{ color: BRAND_MUTED, borderBottom: `1px solid ${BRAND_BORDER}` }}
        >
          Preview the full document in your dashboard or download the PDF.
        </p>
      ) : (
        <p className="px-5 sm:px-6 py-4 text-sm" style={{ color: BRAND_MUTED }}>
          This section has not been generated yet.
        </p>
      )}
    </section>
  );
}

function ReturningPackDelivery({
  caseTitle,
  province,
  howToFileText,
  courtDocs,
  hearingPrep,
  checklist,
  caseId,
}: {
  caseTitle: string;
  province: string;
  howToFileText: string;
  courtDocs: string;
  hearingPrep: string;
  checklist: string;
  caseId: string | null;
}) {
  const sectionLink = (section: "court" | "hearing") =>
    caseId
      ? `/success/full-case-pack?caseId=${encodeURIComponent(caseId)}&section=${section}`
      : null;

  return (
    <main
      className="flex flex-col flex-1 min-h-screen w-full"
      style={{ background: BRAND_BG, color: BRAND_NAVY }}
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 px-4 sm:px-6 py-10 md:py-14">
        <header className="flex flex-col gap-2">
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: BRAND_MUTED }}
          >
            Full Case Pack
          </p>
          <h1
            className="text-2xl md:text-3xl font-semibold tracking-tight"
            style={{ color: BRAND_NAVY }}
          >
            {caseTitle}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: BRAND_MUTED }}>
            Your documents for {province} small claims court. Download each
            section as a PDF anytime.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <DeliverySection title="How to File" content={howToFileText} />
          <DeliverySection
            title="Court Documents"
            content={courtDocs}
            generateHref={sectionLink("court")}
          />
          <DeliverySection
            title="Hearing Prep Script"
            content={hearingPrep}
            generateHref={sectionLink("hearing")}
          />
          <DeliverySection title="Day of Court Checklist" content={checklist} />
        </div>

        <p className="text-sm text-center">
          <Link
            href="/dashboard/documents"
            className="font-medium underline-offset-2 hover:underline"
            style={{ color: BRAND_BLUE }}
          >
            Back to all documents in your dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}

async function savePackDocument(
  caseId: string,
  partial: {
    demandLetter?: string;
    courtDocs?: string;
    hearingPrep?: string;
  },
  paymentSessionId: string | null
) {
  if (paymentSessionId) {
    const res = await fetch("/api/cases/documents/save-after-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: paymentSessionId,
        caseId,
        ...partial,
      }),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(json.error ?? "Failed to save documents");
    }
    return;
  }

  const res = await fetch("/api/cases/documents", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId, ...partial }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? "Failed to save documents");
  }
}

function FullCasePackDeliveryContent() {
  const router = useRouter();
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

  const isReturningView = Boolean(caseIdParam || isPreview) && !sessionId;

  const caseTitle = useMemo(() => {
    if (!assessment || !province) return "Your case";
    const stub: Case = {
      id: caseIdParam ?? "preview",
      created_at: new Date().toISOString(),
      intake_text: intake,
      province,
      case_assessment: assessment,
      email: null,
      outcome: null,
      paid: true,
      tier_purchased: "full",
      user_id: null,
      demand_letter: demandLetter || null,
      court_docs: courtDocs || null,
      hearing_prep: hearingPrep || null,
    };
    return generateCaseTitle(stub);
  }, [
    assessment,
    intake,
    province,
    caseIdParam,
    demandLetter,
    courtDocs,
    hearingPrep,
  ]);

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

    async function finishPack(
      data: PaymentData,
      notifyDelivery: boolean,
      section: GenerateSection | null,
      options: { fromDatabase?: boolean } = {},
      paymentSessionId: string | null = null
    ) {
      const fromDatabase = options.fromDatabase === true;
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

      let letter: string | null = hasDocumentContent(data.demandLetter)
        ? data.demandLetter!.trim()
        : null;
      if (!letter && !fromDatabase && typeof window !== "undefined") {
        const stored = sessionStorage.getItem("ruled_demand_letter");
        if (hasDocumentContent(stored)) {
          letter = stored!.trim();
        }
      }

      let court: string | null = hasDocumentContent(data.courtDocs)
        ? data.courtDocs!.trim()
        : null;
      let hearing: string | null = hasDocumentContent(data.hearingPrep)
        ? data.hearingPrep!.trim()
        : null;

      if (fromDatabase && !section && !paymentSessionId) {
        if (letter) {
          updateRuledSession({ demandLetter: letter });
        }
        setDemandLetter(letter ?? "");
        setCourtDocs(court ?? "");
        setHearingPrep(hearing ?? "");
        setPhase("ready");
        return;
      }

      if (section === "court") {
        if (!hasDocumentContent(court)) {
          setPhase("generating");
          court = (await fetchCourtDocs(data.assessment, data.province)).trim();
          await savePackDocument(
            data.caseId,
            { courtDocs: court },
            paymentSessionId
          );
        }
      } else if (section === "hearing") {
        if (!hasDocumentContent(hearing)) {
          setPhase("generating");
          hearing = (await fetchHearingPrep(data.assessment, data.province)).trim();
          await savePackDocument(
            data.caseId,
            { hearingPrep: hearing },
            paymentSessionId
          );
        }
      } else {
        const needLetter = !hasDocumentContent(letter);
        const needCourt = !hasDocumentContent(court);
        const needHearing = !hasDocumentContent(hearing);
        if (needLetter || needCourt || needHearing) {
          setPhase("generating");
          const [letterResult, courtResult, hearingResult] = await Promise.all([
            needLetter
              ? generateDemandLetter(data)
              : Promise.resolve(letter as string),
            needCourt
              ? fetchCourtDocs(data.assessment, data.province)
              : Promise.resolve(court as string),
            needHearing
              ? fetchHearingPrep(data.assessment, data.province)
              : Promise.resolve(hearing as string),
          ]);
          if (needLetter) {
            letter = letterResult?.trim() ?? null;
            if (!hasDocumentContent(letter)) {
              throw new Error("Failed to generate demand letter");
            }
            await savePackDocument(
              data.caseId,
              { demandLetter: letter },
              paymentSessionId
            );
          }
          if (needCourt) {
            court = courtResult?.trim() ?? null;
            if (hasDocumentContent(court)) {
              await savePackDocument(
                data.caseId,
                { courtDocs: court },
                paymentSessionId
              );
            }
          }
          if (needHearing) {
            hearing = hearingResult?.trim() ?? null;
            if (hasDocumentContent(hearing)) {
              await savePackDocument(
                data.caseId,
                { hearingPrep: hearing },
                paymentSessionId
              );
            }
          }
        }
      }

      if (!hasDocumentContent(letter) && !section && paymentSessionId) {
        throw new Error("Demand letter is missing");
      }

      if (letter) {
        updateRuledSession({ demandLetter: letter });
      }
      setDemandLetter(letter ?? "");
      setCourtDocs(court ?? "");
      setHearingPrep(hearing ?? "");

      if (notifyDelivery && data.caseId) {
        void fetch("/api/emails/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "full", caseId: data.caseId }),
        }).catch(() => {});
      }

      if (paymentSessionId && !section) {
        router.replace("/dashboard/documents");
        return;
      }

      setPhase("ready");
    }

    async function load() {
      try {
        if (caseIdParam) {
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
          await finishPack(data, false, generateTarget, { fromDatabase: true }, null);
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
        await finishPack(data, true, generateTarget, {}, sessionId);
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
  }, [sessionId, caseIdParam, isPreview, generateTarget, router]);

  if (isBusy) {
    return (
      <GenerationLoadingScreen progress={progress} statusMessage={statusMessage} />
    );
  }

  if (phase === "error") {
    return (
      <main
        className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-16 items-center justify-center"
        style={{ background: BRAND_BG, color: BRAND_NAVY }}
      >
        <p className="text-sm text-center max-w-md" style={{ color: BRAND_MUTED }}>
          {error}
        </p>
        <Link
          href="/dashboard/documents"
          className="mt-6 text-sm font-medium"
          style={{ color: BRAND_BLUE }}
        >
          Back to documents
        </Link>
      </main>
    );
  }

  if (phase === "ready" && isReturningView) {
    return (
      <>
        {isPreview && (
          <p
            className="text-xs font-medium text-center py-2"
            style={{ color: BRAND_MUTED, background: BRAND_BG }}
          >
            Development preview — placeholder data only
          </p>
        )}
        <ReturningPackDelivery
          caseTitle={caseTitle}
          province={province}
          howToFileText={howToFileText}
          courtDocs={courtDocs}
          hearingPrep={hearingPrep}
          checklist={checklist}
          caseId={caseIdParam}
        />
      </>
    );
  }

  return null;
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
