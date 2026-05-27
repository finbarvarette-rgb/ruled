import type { Case } from "@/lib/supabase";

export type ProvinceFiling = {
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

export function getProvinceFiling(province: string): ProvinceFiling {
  return PROVINCE_FILING[province] ?? DEFAULT_FILING;
}

export function extractClaimAmount(
  assessment: string,
  intake: string
): string {
  const section = assessment.match(/ESTIMATED CLAIM AMOUNT\s*\n+([^\n]+)/i);
  const fromSection = section?.[1]?.match(/\$?\s*([\d,]+(?:\.\d{2})?)/);
  if (fromSection) return fromSection[1].replace(/,/g, "");

  const fromIntake = intake.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (fromIntake) return fromIntake[1].replace(/,/g, "");

  return "0";
}

export function inferDefendantName(intake: string): string {
  // Capture consecutive Title-Case words (optional "&") so the name stops at
  // lowercase connectors ("to"/"for"/"who") instead of running into the rest
  // of the sentence.
  const patterns = [
    /(?:[Cc]ontractor|[Cc]lient|[Ll]andlord|[Tt]enant|[Cc]ompany|[Bb]usiness)\s+(?:named\s+)?([A-Z][A-Za-z0-9.'&-]+(?:\s+(?:&\s+)?[A-Z][A-Za-z0-9.'&-]*){0,4})/,
    /(?:[Ff]rom|[Bb]y|[Ww]ith)\s+([A-Z][A-Za-z0-9.'&-]+(?:\s+(?:&\s+)?[A-Z][A-Za-z0-9.'&-]*){0,4})/,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:took|owes|refused|ghosted)/,
  ];
  for (const re of patterns) {
    const m = intake.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "Defendant";
}

export function inferClaimantName(intake: string, email: string | null): string {
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

export function buildHowToFileText(
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

export function buildDayOfCourtChecklist(
  province: string,
  claimantName: string
): string {
  return `DAY OF COURT CHECKLIST — ${province.toUpperCase()}

WHAT TO BRING
☐ Government-issued photo ID
☐ Original evidence binder (contracts, invoices, photos, messages)
☐ Three copies of every exhibit (judge, defendant, you)
☐ Copy of your filed claim and claim number
☐ Copy of demand letter and proof it was sent
☐ Proof of service on the defendant
☐ Pen and notepad
☐ Printed opening statement (from Hearing Prep)
☐ Printed closing statement (from Hearing Prep)
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

export type PackDeliverySection = "court" | "hearing" | "demand";

/** True when saved document text exists (non-null, non-empty after trim). */
export function hasDocumentContent(
  value: string | null | undefined
): boolean {
  if (value == null || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  const sentinel = trimmed.toLowerCase();
  if (sentinel === "null" || sentinel === "undefined" || sentinel === "n/a") {
    return false;
  }
  return true;
}

/** Whether a document row should offer download vs generate (uses DB columns where stored). */
export function hasSavedDocumentContent(
  caseRecord: Pick<
    Case,
    | "case_assessment"
    | "demand_letter"
    | "court_docs"
    | "hearing_prep"
    | "tier_purchased"
    | "paid"
  >,
  docId: string
): boolean {
  switch (docId) {
    case "assessment":
      return hasDocumentContent(caseRecord.case_assessment);
    case "demand":
      return hasDocumentContent(caseRecord.demand_letter);
    case "court":
      return hasDocumentContent(caseRecord.court_docs);
    case "hearing":
      return hasDocumentContent(caseRecord.hearing_prep);
    case "how-to-file":
    case "checklist":
      return caseRecord.tier_purchased === "full" && caseRecord.paid === true;
    default:
      return false;
  }
}

export function deliveryHref(
  caseId: string,
  tier: "demand" | "full",
  section?: PackDeliverySection
): string {
  const base =
    tier === "full" ? "/success/full-case-pack" : "/success/demand-letter";
  const params = new URLSearchParams({ caseId });
  if (section && tier === "full") {
    params.set("section", section);
  }
  return `${base}?${params.toString()}`;
}

export function getPackDocumentsForCase(
  caseRecord: Case
): Array<{ id: string; title: string; content: string | null }> {
  const hasFull = caseRecord.tier_purchased === "full";
  if (!hasFull) return [];
  const filing = getProvinceFiling(caseRecord.province);
  const claimant = inferClaimantName(
    caseRecord.intake_text,
    caseRecord.email
  );
  return [
    {
      id: "how-to-file",
      title: "How to File",
      content: buildHowToFileText(
        caseRecord.province,
        filing,
        caseRecord.court_docs ?? ""
      ),
    },
    {
      id: "court",
      title: "Court Documents",
      content: caseRecord.court_docs,
    },
    {
      id: "hearing",
      title: "Hearing Prep Script",
      content: caseRecord.hearing_prep,
    },
    {
      id: "checklist",
      title: "Day of Court Checklist",
      content: buildDayOfCourtChecklist(caseRecord.province, claimant),
    },
  ];
}
