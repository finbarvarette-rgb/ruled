import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const pagePath = path.join(root, "app/success/full-case-pack/page.tsx");
const outPath = path.join(root, "lib/case-pack.ts");

const lines = fs.readFileSync(pagePath, "utf8").split(/\r?\n/);
const start = lines.findIndex((l) => l.startsWith("const PROVINCE_FILING"));
const end = lines.findIndex((l) => l.startsWith("const PREVIEW_DEMAND"));
const body = lines.slice(start, end).join("\n");

const header = `import type { Case } from "@/lib/supabase";

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

`;

const footer = `
export function getProvinceFiling(province: string): ProvinceFiling {
  return PROVINCE_FILING[province] ?? DEFAULT_FILING;
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
    /(?:I am|I'm|My name is)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)/
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
    \`How to File in \${province}\`,
    "",
    \`Court: \${filing.courtName}\`,
    \`Where to go: \${filing.location}\`,
    filing.onlinePortal ? \`Online portal: \${filing.onlinePortal}\` : "",
    \`Filing fee: \${filing.filingFee}\`,
    \`Claim limit: \${filing.claimLimit}\`,
    \`Deadline to file: \${filing.filingDeadline}\`,
    "",
    "What Forms to Bring",
    ...filing.formsToBring.map((item) => \`• \${item}\`),
    "",
    "Step-by-Step Filing",
    ...filing.instructions.map((step, i) => \`\${i + 1}. \${step}\`),
  ];
  if (courtDocs.trim()) {
    parts.push("", "Your Personalized Filing Guide", courtDocs.trim());
  }
  return parts.join("\\n");
}

export function buildDayOfCourtChecklist(
  province: string,
  claimantName: string
): string {
  return \`DAY OF COURT CHECKLIST — \${province.toUpperCase()}

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
☐ Stand and say: "Your Honour, I am \${claimantName}, the plaintiff."
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
☐ If you win, ask about judgment enforcement options in \${province}
☐ Save all documents from the hearing\`;
}

export function deliveryHref(caseId: string, tier: "demand" | "full"): string {
  const base =
    tier === "full" ? "/success/full-case-pack" : "/success/demand-letter";
  return \`\${base}?caseId=\${caseId}\`;
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
`;

fs.writeFileSync(outPath, header + body + footer);
console.log("Wrote", outPath);
