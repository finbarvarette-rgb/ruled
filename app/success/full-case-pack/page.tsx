"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { restoreSessionFromPayment, updateRuledSession } from "@/lib/session";
import { Spinner } from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { downloadBrandedPdf, downloadPdfZip } from "@/lib/pdf-generator";

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

type PackDocument = {
  id: string;
  title: string;
  description: string;
  content: string;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

type TabId = "file" | "documents" | "hearing" | "checklist";

const TABS: { id: TabId; label: string }[] = [
  { id: "file", label: "How to File" },
  { id: "documents", label: "Your Documents" },
  { id: "hearing", label: "Hearing Prep" },
  { id: "checklist", label: "Day of Court" },
];

type ProvinceFiling = {
  courtName: string;
  location: string;
  onlinePortal: string | null;
  filingFee: string;
  claimLimit: string;
  formsToBring: string[];
  filingDeadline: string;
  instructions: string[];
};

const PROVINCE_FILING: Record<string, ProvinceFiling> = {
  Ontario: {
    courtName: "Ontario Court of Justice — Small Claims Court",
    location:
      "File at the courthouse in the municipality where the defendant lives or where the dispute arose. Find your court at ontario.ca/page/small-claims-court-locations.",
    onlinePortal: "https://www.ontario.ca/page/file-small-claims-court-claim",
    filingFee:
      "Approximately $102 for claims up to $500; scales up to about $220 for claims near the $35,000 limit (confirm current schedule before filing).",
    claimLimit: "$35,000",
    formsToBring: [
      "Plaintiff's Claim (Form 7A) — completed and signed",
      "Copies of all evidence (contracts, invoices, photos, messages)",
      "Copy of your demand letter and proof it was sent",
      "Government-issued photo ID",
      "Filing fee payment (cash, debit, or as accepted at your court)",
    ],
    filingDeadline:
      "File within two years of when the debt arose (limitation period). After your demand letter, allow 14 days for response before filing.",
    instructions: [
      "Complete Form 7A with your name, the defendant's name and address, and the amount claimed.",
      "Attach a brief description of what happened and what you are claiming.",
      "Pay the filing fee at the court office or file online if eligible.",
      "The court will issue a claim number and arrange service on the defendant.",
    ],
  },
  "British Columbia": {
    courtName: "BC Provincial Court — Small Claims",
    location:
      "File at the Small Claims registry nearest to where the defendant lives or the contract was performed.",
    onlinePortal: "https://www2.gov.bc.ca/gov/content/justice/courthouse-services/small-claims",
    filingFee:
      "Filing fee depends on claim amount (typically $100–$156 for common claim sizes — verify on the court fee schedule).",
    claimLimit: "$35,000",
    formsToBring: [
      "Notice of Claim (Form 1) — completed",
      "Copies of evidence and demand letter",
      "Proof of demand letter delivery",
      "Photo ID and filing fee",
    ],
    filingDeadline:
      "Two-year limitation period from when the cause of action arose. Wait 14 days after your demand letter before filing unless urgent.",
    instructions: [
      "Complete the Notice of Claim with parties, amount, and brief facts.",
      "File at the registry and pay the filing fee.",
      "You will receive instructions for serving the defendant.",
    ],
  },
  Alberta: {
    courtName: "Alberta Court of Justice — Civil (Small Claims)",
    location: "File at the judicial centre serving the area where the defendant resides.",
    onlinePortal: "https://albertacourts.ca/cj/civil/small-claims",
    filingFee: "Typically $100–$200 depending on claim amount — check current Alberta Court fees.",
    claimLimit: "$50,000",
    formsToBring: [
      "Civil Claim (Form 7) — completed",
      "Evidence copies and demand letter",
      "ID and filing fee payment",
    ],
    filingDeadline:
      "Limitation period is generally two years. File after your 14-day demand letter deadline if unpaid.",
    instructions: [
      "Complete the Civil Claim with claimant, defendant, and relief sought.",
      "File at the court and pay fees.",
      "Follow court directions for serving the defendant.",
    ],
  },
  Quebec: {
    courtName: "Court of Québec — Small Claims Division",
    location: "File at the courthouse of the district where the defendant lives or is headquartered.",
    onlinePortal: null,
    filingFee: "Varies by claim amount — typically under $200 for most small claims.",
    claimLimit: "$15,000",
    formsToBring: [
      "Application initiating proceeding — completed",
      "Evidence copies (French may be required in some districts)",
      "Demand letter copy and proof of sending",
      "ID and filing fee",
    ],
    filingDeadline:
      "Prescription period applies (often three years). Allow 14 days after demand letter before filing.",
    instructions: [
      "Complete the application with parties and amount claimed.",
      "File at the courthouse and pay fees.",
      "Note: Quebec procedures differ — consider verifying French-language requirements.",
    ],
  },
};

const DEFAULT_FILING: ProvinceFiling = {
  courtName: "Provincial Small Claims Court",
  location:
    "File at the small claims court serving the area where the defendant lives or where the dispute occurred. Check your provincial court website for the correct location.",
  onlinePortal: null,
  filingFee:
    "Varies by province and claim amount — confirm the current fee schedule on your provincial court website before filing.",
  claimLimit: "Varies by province (typically $15,000–$50,000)",
  formsToBring: [
    "Completed small claims initiating form for your province",
    "Copies of all evidence",
    "Copy of demand letter and proof of delivery",
    "Government-issued photo ID",
    "Filing fee payment",
  ],
  filingDeadline:
    "File before your province's limitation period expires (usually two years). After sending your demand letter, wait 14 days for a response before filing.",
  instructions: [
    "Complete your province's small claims form with accurate party names and amounts.",
    "Attach a clear summary of facts and what you are claiming.",
    "Pay the filing fee and keep your receipt.",
    "Serve the defendant according to your province's rules and keep proof of service.",
  ],
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

function getProvinceFiling(province: string): ProvinceFiling {
  return PROVINCE_FILING[province] ?? DEFAULT_FILING;
}

function extractClaimAmount(assessment: string, intake: string): string {
  const section = assessment.match(/ESTIMATED CLAIM AMOUNT\s*\n+([^\n]+)/i);
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
  const iMatch = intake.match(
    /(?:I am|I'm|My name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
  );
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

function buildDocuments(
  demandLetter: string,
  courtDocs: string
): PackDocument[] {
  return [
    {
      id: "claim-form",
      title: "Plaintiff's Claim / Notice of Claim",
      description:
        "Step-by-step guide for completing your province's claim form with your case details.",
      content: courtDocs,
    },
    {
      id: "filing-guide",
      title: "Court Filing Instructions",
      description:
        "Where to file, fees, service requirements, and deadlines for your province.",
      content: courtDocs,
    },
    {
      id: "demand-letter",
      title: "Demand Letter (Court Copy)",
      description:
        "Include a copy of your demand letter with your filing — proof you tried to resolve this first.",
      content: demandLetter,
    },
    {
      id: "evidence-index",
      title: "Evidence Index & Binder Guide",
      description:
        "Organize exhibits in order — contracts, payments, photos, messages, and delivery proof.",
      content: courtDocs.includes("EVIDENCE")
        ? courtDocs
        : `${courtDocs}\n\n---\n\nEVIDENCE INDEX\n\nList each piece of evidence as Exhibit A, B, C… with a one-line description. Bring three copies: one for the judge, one for the defendant, one for yourself.`,
    },
    {
      id: "affidavit-service",
      title: "Affidavit of Service Template",
      description:
        "Sworn statement proving the defendant was served — required after filing.",
      content: `AFFIDAVIT OF SERVICE\n\nI, [YOUR FULL NAME], of [YOUR CITY, PROVINCE], swear/affirm:\n\n1. On [DATE], I served [DEFENDANT NAME] with a copy of my claim by [personal delivery / registered mail / method permitted in your province].\n\n2. Service was made at: [ADDRESS]\n\n3. I attach proof of service (tracking number, affidavit of server, or receipt).\n\nSworn before me at [CITY] on [DATE].\n\n_________________________\nSignature\n\n_________________________\nCommissioner / Notary (if required)`,
    },
  ];
}

function buildDayOfCourtChecklist(province: string, claimantName: string): string {
  return `DAY OF COURT CHECKLIST — ${province.toUpperCase()}

WHAT TO BRING
☐ Government-issued photo ID
☐ Original evidence binder (contracts, invoices, photos, messages)
☐ Three copies of every exhibit (judge, defendant, you)
☐ Copy of your filed claim and claim number
☐ Copy of demand letter and proof it was sent
☐ Proof of service on the defendant
☐ Pen and notepad
☐ Printed opening statement (from Hearing Prep tab)
☐ Printed closing statement (from Hearing Prep tab)
☐ Water (courthouse security permitting)

BEFORE YOU LEAVE HOME
☐ Dress business casual — neat, clean, respectful
☐ Review your opening statement out loud once
☐ Confirm courthouse address and arrival time (30 min early)
☐ Turn phone to silent or off

WHEN YOU ARRIVE
☐ Find the small claims check-in desk or courtroom list
☐ Check in with court staff and confirm your case is on the docket
☐ Wait in the gallery — stand when your name or case number is called

WHEN YOUR CASE IS CALLED
☐ Stand and say: "Your Honour, I am ${claimantName}, the plaintiff."
☐ Wait for the judge to invite you to speak
☐ Deliver your opening statement (2–3 minutes)
☐ Present evidence in the order from your index
☐ Listen to the defendant without interrupting
☐ Respond only to what they said — stick to facts
☐ Deliver your closing statement
☐ Thank the judge: "Thank you, Your Honour."

STAYING CALM
☐ Breathe slowly before speaking — pause is fine
☐ Look at the judge, not the defendant, when addressing the court
☐ If you don't know an answer: "Your Honour, I don't know. I can check my records."
☐ It's normal to be nervous — the judge hears small claims every day

AFTER THE HEARING
☐ Note any deadlines the judge gives you
☐ If you win, ask about judgment enforcement options in ${province}
☐ Save all documents from the hearing`;
}

function buildHowToFileText(
  province: string,
  filing: ProvinceFiling,
  courtDocs: string
): string {
  const parts = [
    `How to File in ${province}`,
    "",
    `Court: ${filing.courtName}`,
    `Where to go: ${filing.location}`,
    filing.onlinePortal ? `Online portal: ${filing.onlinePortal}` : "",
    `Filing fee: ${filing.filingFee}`,
    `Claim limit: ${filing.claimLimit}`,
    `Deadline to file: ${filing.filingDeadline}`,
    "",
    "What Forms to Bring",
    ...filing.formsToBring.map((item) => `• ${item}`),
    "",
    "Step-by-Step Filing",
    ...filing.instructions.map((step, i) => `${i + 1}. ${step}`),
  ];
  if (courtDocs.trim()) {
    parts.push("", "Your Personalized Filing Guide", courtDocs.trim());
  }
  return parts.join("\n");
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

async function downloadAllPdf(
  province: string,
  filing: ProvinceFiling,
  courtDocs: string,
  documents: PackDocument[],
  hearingPrep: string,
  checklist: string
) {
  await downloadPdfZip([
    {
      filename: "How-to-File.pdf",
      documentTitle: `How to File in ${province}`,
      body: buildHowToFileText(province, filing, courtDocs),
    },
    {
      filename: "Your-Documents.pdf",
      documentTitle: "Your Documents",
      sections: documents.map((d) => ({
        title: d.title,
        content: d.content,
      })),
    },
    {
      filename: "Hearing-Prep.pdf",
      documentTitle: "Hearing Preparation",
      body: hearingPrep,
    },
    {
      filename: "Day-of-Court-Checklist.pdf",
      documentTitle: "Day of Court Checklist",
      body: checklist,
    },
  ]);
}

function parseHearingSections(text: string): { title: string; body: string }[] {
  const headers = [
    "BEFORE THE HEARING",
    "WHAT TO WEAR AND HOW TO ACT",
    "WHEN YOU ARRIVE",
    "YOUR OPENING STATEMENT",
    "PRESENTING YOUR EVIDENCE",
    "WHAT THE DEFENDANT WILL SAY",
    "YOUR CLOSING STATEMENT",
    "KEY RULES",
    "AFTER THE HEARING",
    "COURTROOM ETIQUETTE",
  ];

  const sections: { title: string; body: string }[] = [];
  const upper = text.toUpperCase();

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const start = upper.indexOf(header);
    if (start === -1) continue;

    let end = text.length;
    for (let j = i + 1; j < headers.length; j++) {
      const next = upper.indexOf(headers[j], start + header.length);
      if (next !== -1) {
        end = next;
        break;
      }
    }

    const body = text.slice(start + header.length, end).trim();
    if (body) {
      sections.push({
        title: header
          .split(" ")
          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
          .join(" ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        body,
      });
    }
  }

  if (sections.length === 0) {
    return [{ title: "Hearing Preparation", body: text }];
  }
  return sections;
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

function FullCasePackDeliveryContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const isPreview = searchParams.get("preview") === "true";

  const [phase, setPhase] = useState<"loading" | "generating" | "ready" | "error">(
    "loading"
  );
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("file");
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
  const { progress, statusMessage } = useGenerationLoading(
    isBusy,
    PACK_STATUS_MESSAGES
  );

  const claimantName = useMemo(
    () => inferSenderName(null, intake) || "Claimant",
    [intake]
  );

  const filing = useMemo(
    () => getProvinceFiling(province),
    [province]
  );

  const documents = useMemo(
    () => buildDocuments(demandLetter, courtDocs),
    [demandLetter, courtDocs]
  );

  const checklist = useMemo(
    () => buildDayOfCourtChecklist(province, claimantName),
    [province, claimantName]
  );

  const hearingSections = useMemo(
    () => parseHearingSections(hearingPrep),
    [hearingPrep]
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

        setPhase("generating");

        let letter =
          data.demandLetter ??
          (typeof window !== "undefined"
            ? sessionStorage.getItem("ruled_demand_letter")
            : null);

        const [letterResult, courtResult, hearingResult] = await Promise.all([
          letter
            ? Promise.resolve(letter)
            : generateDemandLetter(data),
          fetchCourtDocs(data.assessment, data.province),
          fetchHearingPrep(data.assessment, data.province),
        ]);

        letter = letterResult;
        updateRuledSession({ demandLetter: letter });
        setDemandLetter(letter);
        setCourtDocs(courtResult);
        setHearingPrep(hearingResult);
        setPhase("ready");

        if (data.caseId) {
          void supabase
            .from("cases")
            .update({
              demand_letter: letter,
              court_docs: courtResult,
              hearing_prep: hearingResult,
            })
            .eq("id", data.caseId);
          void fetch("/api/emails/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "full", caseId: data.caseId }),
          }).catch(() => {});
        }
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
  }, [sessionId, isPreview]);

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

        {/* Tabs */}
        <div
          className="flex gap-1 overflow-x-auto rounded-xl p-1 -mx-1"
          style={{ background: "#1a1916", border: "1px solid #2a2825" }}
          role="tablist"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 min-w-[5.5rem] rounded-lg px-3 py-2.5 text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
              style={{
                background: activeTab === tab.id ? "#c8392b" : "transparent",
                color: activeTab === tab.id ? "#f5f1eb" : "#9a9590",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div role="tabpanel" className="flex flex-col gap-6 min-h-[320px]">
          {activeTab === "file" && (
            <>
              <section
                className="rounded-xl px-5 sm:px-6 py-6 flex flex-col gap-5"
                style={{ background: "#1a1916", border: "1px solid #2a2825" }}
              >
                <h2 className="text-lg font-semibold">How to File in {province}</h2>
                <InfoRow label="Court" value={filing.courtName} />
                <InfoRow label="Where to go" value={filing.location} />
                {filing.onlinePortal && (
                  <p className="text-sm">
                    <span style={{ color: "#9a9590" }}>Online: </span>
                    <a
                      href={filing.onlinePortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#c8392b" }}
                    >
                      File online →
                    </a>
                  </p>
                )}
                <InfoRow label="Filing fee" value={filing.filingFee} />
                <InfoRow label="Claim limit" value={filing.claimLimit} />
                <InfoRow label="Deadline to file" value={filing.filingDeadline} />
              </section>

              <section
                className="rounded-xl px-5 sm:px-6 py-6 flex flex-col gap-4"
                style={{ background: "#1a1916", border: "1px solid #2a2825" }}
              >
                <h2 className="text-lg font-semibold">What Forms to Bring</h2>
                <ul className="flex flex-col gap-2">
                  {filing.formsToBring.map((item) => (
                    <li
                      key={item}
                      className="text-sm flex gap-2 leading-relaxed"
                      style={{ color: "#d4cfc9" }}
                    >
                      <span style={{ color: "#c8392b" }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section
                className="rounded-xl px-5 sm:px-6 py-6 flex flex-col gap-4"
                style={{ background: "#1a1916", border: "1px solid #2a2825" }}
              >
                <h2 className="text-lg font-semibold">Step-by-Step Filing</h2>
                <ol className="flex flex-col gap-3">
                  {filing.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "#c8392b", color: "#f5f1eb" }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ color: "#d4cfc9" }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {courtDocs && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-sm font-semibold" style={{ color: "#9a9590" }}>
                    Your personalized filing guide
                  </h2>
                  <SerifDoc>{courtDocs}</SerifDoc>
                </section>
              )}
            </>
          )}

          {activeTab === "documents" && (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void downloadAllPdf(
                      province,
                      filing,
                      courtDocs,
                      documents,
                      hearingPrep,
                      checklist
                    )
                  }
                  className="flex-1 rounded-xl px-5 py-3.5 text-sm font-semibold cursor-pointer"
                  style={{ background: "#c8392b", color: "#f5f1eb" }}
                >
                  Download All as PDF
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {documents.map((doc) => (
                  <article
                    key={doc.id}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: "#1a1916",
                      border: "1px solid #2a2825",
                    }}
                  >
                    <div
                      className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b"
                      style={{ borderColor: "#2a2825" }}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <h3 className="font-semibold text-sm">{doc.title}</h3>
                        <p className="text-xs" style={{ color: "#9a9590" }}>
                          {doc.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadPdf(doc.title, doc.content)}
                        className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
                        style={{
                          background: "#0f0e0c",
                          color: "#f5f1eb",
                          border: "1px solid #2a2825",
                        }}
                      >
                        Download PDF
                      </button>
                    </div>
                    <div className="px-4 sm:px-5 pb-5 pt-4">
                      <SerifDoc>
                        {doc.content.length > 1200
                          ? `${doc.content.slice(0, 1200)}…`
                          : doc.content}
                      </SerifDoc>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {activeTab === "hearing" && (
            <div className="flex flex-col gap-6">
              {hearingSections.map((section) => (
                <section key={section.title} className="flex flex-col gap-3">
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                  <SerifDoc>{section.body}</SerifDoc>
                </section>
              ))}
            </div>
          )}

          {activeTab === "checklist" && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() =>
                    downloadPdf("Day of Court Checklist", checklist)
                  }
                  className="rounded-xl px-5 py-3.5 text-sm font-semibold cursor-pointer"
                  style={{ background: "#c8392b", color: "#f5f1eb" }}
                >
                  Print Checklist (PDF)
                </button>
              </div>
              <SerifDoc>{checklist}</SerifDoc>
            </section>
          )}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c8392b" }}>
        {label}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: "#d4cfc9" }}>
        {value}
      </p>
    </div>
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
