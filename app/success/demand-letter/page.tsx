"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { restoreSessionFromPayment, updateRuledSession } from "@/lib/session";
import { startCheckout } from "@/lib/checkout";
import { Spinner } from "@/components/Spinner";
import { downloadDemandLetterPdf } from "@/lib/pdf-generator";

const LOADING_BG = "#FAFAFA";
const LOADING_NAVY = "#0F172A";
const LOADING_BLUE = "#2563EB";
const LOADING_MUTED = "#64748B";
const LOADING_BORDER = "#E2E8F0";

const DEMAND_STATUS_MESSAGES = [
  "Reviewing your case details...",
  "Drafting your demand letter...",
  "Adding legal language for [province]...",
  "Finalizing your letter...",
];

function resolveStatusMessages(messages: string[], province: string) {
  const place = province.trim() || "your province";
  return messages.map((m) => m.replace("[province]", place));
}

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
};

function extractClaimAmount(assessment: string, intake: string): string {
  const section = assessment.match(
    /ESTIMATED CLAIM AMOUNT\s*\n+([^\n]+)/i
  );
  const fromSection = section?.[1]?.match(/\$?\s*([\d,]+(?:\.\d{2})?)/);
  if (fromSection) return fromSection[1].replace(/,/g, "");

  const fromIntake = intake.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (fromIntake) return fromIntake[1].replace(/,/g, "");

  return "0";
}

function inferSenderName(email: string | null, intake: string): string {
  if (email) {
    const local = email.split("@")[0]?.replace(/[._]/g, " ").trim();
    if (local && local.length > 1) {
      return local
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }
  const iMatch = intake.match(/(?:I am|I'm|My name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (iMatch) return iMatch[1];
  return "Claimant";
}

function inferDefendantName(intake: string): string {
  const patterns = [
    /(?:contractor|client|landlord|tenant|company|business)\s+(?:named\s+)?([A-Z][A-Za-z0-9\s&.'-]{2,40})/i,
    /(?:from|by|with)\s+([A-Z][A-Za-z0-9\s&.'-]{2,30})(?:\s+who|\s+that|,|\.)/,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:took|owes|refused|ghosted)/,
  ];
  for (const re of patterns) {
    const m = intake.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "Defendant";
}

async function generateDemandLetter(data: PaymentData): Promise<string> {
  const res = await fetch("/api/demand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderName: inferSenderName(data.email, data.intake),
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
  if (!res.ok) throw new Error("Failed to generate letter");
  const json = (await res.json()) as { letter?: string };
  if (!json.letter) throw new Error("No letter returned");
  return json.letter;
}

const PREVIEW_PLACEHOLDER_LETTER = `Jane Smith
Smith Renovations Inc.
jane.smith@email.com

May 18, 2026

ABC Contracting Ltd.
123 Main Street
Toronto, ON M5V 1A1

RE: Formal Demand for Payment — $5,000.00

Dear ABC Contracting Ltd.,

I am writing regarding the renovation contract we entered into on March 1, 2026, under which your company agreed to complete bathroom and kitchen renovations at my property for a total contract price of $10,000.00. I paid a deposit of $5,000.00 on March 5, 2026, as agreed.

You began work on March 12, 2026 and completed approximately half of the contracted work. I have photographs, text messages, and bank records showing the deposit payment and partial completion. On April 2, 2026, you ceased all work without explanation and have not responded to my attempts to contact you.

I formally demand payment of $5,000.00 within fourteen (14) days of the date of this letter. This amount represents the deposit paid for work that was not completed as agreed. If payment is not received in full by that deadline, I intend to file a claim in the Ontario Small Claims Court without further notice, and will seek all amounts owed plus applicable court filing costs.

Yours truly,

Jane Smith
Smith Renovations Inc.`;

const PREVIEW_DATA = {
  province: "Ontario",
  caseId: "preview-case-id",
  email: "jane.smith@email.com",
  letter: PREVIEW_PLACEHOLDER_LETTER,
};

const SEND_STEPS = [
  {
    title: "Send via email",
    body: "Attach the PDF to an email to the other party. Request a read receipt so you have proof it was received.",
  },
  {
    title: "Send via Canada Post registered mail",
    body: "Mail a printed copy by registered mail. Keep the tracking number and delivery confirmation.",
  },
  {
    title: "Keep copies of everything",
    body: "Save the sent email, mailing receipt, tracking number, and a copy of the letter for your records.",
  },
  {
    title: "Note the date sent",
    body: "Your 14-day response deadline starts on the date they receive the letter (email or mail). Write that date down.",
  },
];

function DemandLetterDeliveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const isPreview = searchParams.get("preview") === "true";

  const [phase, setPhase] = useState<
    "loading" | "generating" | "ready" | "error"
  >("loading");
  const [error, setError] = useState("");
  const [letter, setLetter] = useState<string | null>(null);
  const [province, setProvince] = useState("");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [markSentLoading, setMarkSentLoading] = useState(false);
  const [markSentDone, setMarkSentDone] = useState(false);

  const isBusy = phase === "loading" || phase === "generating";
  const statusMessages = useMemo(
    () => resolveStatusMessages(DEMAND_STATUS_MESSAGES, province),
    [province]
  );
  const { progress, statusMessage } = useGenerationLoading(isBusy, statusMessages);

  useEffect(() => {
    if (isPreview) {
      setProvince(PREVIEW_DATA.province);
      setCaseId(PREVIEW_DATA.caseId);
      setEmail(PREVIEW_DATA.email);
      setLetter(PREVIEW_DATA.letter);
      setPhase("ready");
      return;
    }

    if (!sessionId) {
      setError("Invalid payment session.");
      setPhase("error");
      return;
    }

    async function load() {
      try {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = (await res.json()) as PaymentData & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Payment verification failed");
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
        setCaseId(data.caseId);
        setEmail(data.email);

        if (data.tier === "full") {
          router.replace(`/success/full-case-pack?session_id=${sessionId}`);
          return;
        }

        let finalLetter =
          data.demandLetter ??
          (typeof window !== "undefined"
            ? sessionStorage.getItem("ruled_demand_letter")
            : null);

        if (!finalLetter) {
          setPhase("generating");
          finalLetter = await generateDemandLetter(data);
        }

        updateRuledSession({ demandLetter: finalLetter });
        setLetter(finalLetter);
        setPhase("ready");

        if (data.caseId) {
          void fetch("/api/emails/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "demand", caseId: data.caseId }),
          }).catch(() => {});
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "We could not load your demand letter. Contact hello@ruled.ca with your receipt."
        );
        setPhase("error");
      }
    }

    load();
  }, [sessionId, router, isPreview]);

  async function handleCopy() {
    if (!letter) return;
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  async function handleUpsell() {
    setUpsellLoading(true);
    try {
      await startCheckout("full", caseId, email);
    } catch {
      setError("Could not start checkout. Please try again.");
      setUpsellLoading(false);
    }
  }

  async function handleMarkSent() {
    if (!caseId || markSentDone) return;
    setMarkSentLoading(true);
    try {
      const res = await fetch("/api/emails/mark-demand-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      if (!res.ok) throw new Error("Failed");
      setMarkSentDone(true);
    } catch {
      setError("Could not save your send date. Please try again.");
    } finally {
      setMarkSentLoading(false);
    }
  }

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
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-10 md:py-14 overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 md:gap-10 min-w-0">
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
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#9a9590" }}>
            Payment confirmed
          </p>
          <h1
            className="text-2xl md:text-3xl font-semibold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Your Demand Letter is Ready ✅
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            Here is your personalized letter for{" "}
            {province ? `${province} ` : ""}
            small claims. Send it using the steps below — your 14-day clock
            starts when they receive it.
          </p>
        </header>

        {/* Letter display */}
        <section className="flex flex-col gap-4">
          <div
            className="rounded-xl px-6 sm:px-8 py-8 text-left whitespace-pre-wrap leading-relaxed text-sm md:text-base shadow-lg"
            style={{
              background: "#ffffff",
              color: "#0f0e0c",
              fontFamily: "Georgia, 'Times New Roman', serif",
              border: "1px solid #e8e4de",
            }}
          >
            {letter}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => letter && downloadDemandLetterPdf(letter)}
              className="flex-1 rounded-xl px-5 py-3.5 text-sm font-semibold cursor-pointer"
              style={{ background: "#c8392b", color: "#f5f1eb" }}
            >
              Download as PDF
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 rounded-xl px-5 py-3.5 text-sm font-semibold cursor-pointer"
              style={{
                background: "#1a1916",
                color: "#f5f1eb",
                border: "1px solid #2a2825",
              }}
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
        </section>

        {/* How to send */}
        <section
          className="rounded-xl px-5 sm:px-6 py-6 flex flex-col gap-5"
          style={{ background: "#1a1916", border: "1px solid #2a2825" }}
        >
          <h2 className="text-lg font-semibold">How to Send This</h2>
          <ol className="flex flex-col gap-4">
            {SEND_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "#c8392b", color: "#f5f1eb" }}
                >
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Timeline */}
        <section
          className="rounded-xl px-5 sm:px-6 py-6 flex flex-col gap-5"
          style={{ background: "#1a1916", border: "1px solid #2a2825" }}
        >
          <h2 className="text-lg font-semibold">Your 14-Day Timeline</h2>
          <div className="flex flex-col gap-0">
            <TimelineStep
              label="Day 0"
              title="Letter sent"
              description="Send your demand letter today by email and registered mail."
              active
              first
            />
            <TimelineStep
              label="Day 14"
              title="Response deadline"
              description="The other party should pay or respond by this date."
            />
            <TimelineStep
              label="Day 15+"
              title="File in court"
              description={
                province
                  ? `If they do not pay, file your claim in ${province} Small Claims Court.`
                  : "If they do not pay, file your claim in small claims court."
              }
              last
            />
          </div>
          {!isPreview && caseId && (
            <button
              type="button"
              disabled={markSentLoading || markSentDone}
              onClick={handleMarkSent}
              className="w-full rounded-xl px-5 py-3.5 text-sm font-semibold cursor-pointer disabled:opacity-60 mt-2"
              style={{
                background: markSentDone ? "#2a2825" : "#2563EB",
                color: "#f5f1eb",
              }}
            >
              {markSentDone
                ? "14-day clock started — we'll email you on day 14"
                : markSentLoading
                  ? "Saving…"
                  : "I've sent my letter — start my 14-day clock"}
            </button>
          )}
        </section>

        {/* Upsell */}
        <section
          className="rounded-xl px-5 sm:px-6 py-6 flex flex-col gap-4"
          style={{
            background: "#0f0e0c",
            border: "1px solid #c8392b",
          }}
        >
          <h2 className="text-lg font-semibold">
            If they don&apos;t respond, here&apos;s your next step
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            If the other party does not pay or respond within 14 days, your next
            step is filing in{" "}
            {province ? `${province} ` : ""}
            small claims court. Your case is already analyzed — the Full Case
            Pack gives you court filing documents, hearing prep, and unlimited
            Q&A.
          </p>
          <button
            type="button"
            disabled={upsellLoading}
            onClick={handleUpsell}
            className="w-full rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            {upsellLoading && <Spinner />}
            {upsellLoading ? "Redirecting…" : "Get Full Case Pack — $199"}
          </button>
        </section>

        <p className="text-sm text-center pb-6">
          <Link href="/dashboard" style={{ color: "#c8392b" }}>
            Your letter is saved in your Ruled dashboard →
          </Link>
        </p>
      </div>
    </main>
  );
}

function TimelineStep({
  label,
  title,
  description,
  active,
  first,
  last,
}: {
  label: string;
  title: string;
  description: string;
  active?: boolean;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        {!first && (
          <div
            className="w-0.5 flex-1 min-h-[12px]"
            style={{ background: "#2a2825" }}
          />
        )}
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{
            background: active ? "#c8392b" : "#2a2825",
            boxShadow: active ? "0 0 0 4px rgba(200, 57, 43, 0.25)" : undefined,
          }}
        />
        {!last && (
          <div
            className="w-0.5 flex-1 min-h-[24px]"
            style={{ background: "#2a2825" }}
          />
        )}
      </div>
      <div className={`flex flex-col gap-1 pb-6 ${last ? "pb-0" : ""}`}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#c8392b" }}>
          {label}
        </p>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

export default function DemandLetterDeliveryPage() {
  return (
    <Suspense
      fallback={
        <GenerationLoadingScreen
          progress={0}
          statusMessage={DEMAND_STATUS_MESSAGES[0]}
        />
      }
    >
      <DemandLetterDeliveryContent />
    </Suspense>
  );
}
