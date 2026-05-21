import type { Case } from "@/lib/supabase";
import {
  deliveryHref,
  getPackDocumentsForCase,
  hasDocumentContent,
} from "@/lib/case-pack";

export const PIPELINE_STEPS = [
  { id: "assessment", label: "Case Assessment" },
  { id: "demand", label: "Demand Letter Sent" },
  { id: "filed", label: "Filed in Court" },
  { id: "hearing", label: "Hearing Scheduled" },
  { id: "resolved", label: "Resolved" },
] as const;

export type CaseStatusBadge =
  | "Assessment Complete"
  | "Demand Letter Sent"
  | "Filed"
  | "Hearing Scheduled"
  | "Resolved";

export type CaseDocument = {
  id: string;
  title: string;
  available: boolean;
  content: string | null;
};

export type CaseMeta = {
  title: string;
  statusBadge: CaseStatusBadge;
  pipelineIndex: number;
  daysSinceStart: number;
  hasDemandTier: boolean;
  hasFullTier: boolean;
  documents: CaseDocument[];
};

export function extractClaimAmount(
  assessment: string,
  intake: string
): string | null {
  const section = assessment.match(/ESTIMATED CLAIM AMOUNT\s*\n+([^\n]+)/i);
  const fromSection = section?.[1]?.match(/\$?\s*([\d,]+(?:\.\d{2})?)/);
  if (fromSection) return fromSection[1].replace(/,/g, "");

  const fromIntake = intake.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (fromIntake) return fromIntake[1].replace(/,/g, "");

  return null;
}

function inferDisputeType(intake: string): string {
  const lower = intake.toLowerCase();
  if (/contractor|renovation|trades|construction|plumber|electrician/.test(lower)) {
    return "Contractor dispute";
  }
  if (/landlord|tenant|rent|deposit|lease/.test(lower)) {
    return "Landlord–tenant dispute";
  }
  if (/employer|wage|paycheque|paycheck|fired|terminated/.test(lower)) {
    return "Employment dispute";
  }
  if (/invoice|client|customer|business/.test(lower)) {
    return "Business dispute";
  }
  if (/car|vehicle|mechanic|auto/.test(lower)) {
    return "Vehicle dispute";
  }
  return "Small claims dispute";
}

export function generateCaseTitle(caseRecord: Case): string {
  const amount = extractClaimAmount(
    caseRecord.case_assessment,
    caseRecord.intake_text
  );
  const parts = [inferDisputeType(caseRecord.intake_text)];
  if (amount) {
    const n = Number(amount);
    parts.push(
      `$${Number.isFinite(n) ? n.toLocaleString("en-CA") : amount}`
    );
  }
  parts.push(caseRecord.province);
  return parts.join(" — ");
}

function daysSince(dateIso: string): number {
  const ms = Date.now() - new Date(dateIso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function getCaseMeta(caseRecord: Case): CaseMeta {
  const hasDemandTier =
    caseRecord.tier_purchased === "demand" ||
    caseRecord.tier_purchased === "full";
  const hasFullTier = caseRecord.tier_purchased === "full";
  const hasDemandLetter = !!caseRecord.demand_letter?.trim();
  const daysSinceStart = daysSince(caseRecord.created_at);

  let statusBadge: CaseStatusBadge = "Assessment Complete";
  let pipelineIndex = 0;

  if (caseRecord.outcome === "won" || caseRecord.outcome === "lost") {
    statusBadge = "Resolved";
    pipelineIndex = 4;
  } else if (caseRecord.outcome === "hearing") {
    statusBadge = "Hearing Scheduled";
    pipelineIndex = 3;
  } else if (hasFullTier || caseRecord.court_docs) {
    statusBadge = "Filed";
    pipelineIndex = 2;
  } else if (hasDemandLetter || (hasDemandTier && caseRecord.paid)) {
    statusBadge = "Demand Letter Sent";
    pipelineIndex = 1;
  }

  const documents: CaseDocument[] = [
    {
      id: "assessment",
      title: "Case Assessment",
      available: !!caseRecord.case_assessment?.trim(),
      content: caseRecord.case_assessment,
    },
    {
      id: "demand",
      title: "Demand Letter",
      available: (hasDemandTier && caseRecord.paid) || hasDemandLetter,
      content: caseRecord.demand_letter,
    },
    ...getPackDocumentsForCase(caseRecord).map((doc) => ({
      id: doc.id,
      title: doc.title,
      available: hasFullTier && caseRecord.paid,
      content: doc.content,
    })),
  ];

  return {
    title: generateCaseTitle(caseRecord),
    statusBadge,
    pipelineIndex,
    daysSinceStart,
    hasDemandTier,
    hasFullTier,
    documents,
  };
}

export type NextStepAction =
  | { kind: "checkout"; tier: "demand" | "full"; label: string }
  | { kind: "link"; href: string; label: string; sublabel?: string };

export function getNextStep(
  caseRecord: Case,
  meta: CaseMeta
): NextStepAction | null {
  if (meta.statusBadge === "Resolved") {
    return null;
  }

  if (meta.hasFullTier) {
    return {
      kind: "link",
      href: deliveryHref(caseRecord.id, "full"),
      label: "Open your Full Case Pack →",
      sublabel: "Court documents, hearing prep, and filing guide",
    };
  }

  if (
    meta.pipelineIndex >= 1 &&
    meta.daysSinceStart >= 14 &&
    !meta.hasFullTier
  ) {
    return {
      kind: "checkout",
      tier: "full",
      label: "Your deadline has passed. Time to file. Full Case Pack — $199 →",
    };
  }

  if (meta.pipelineIndex >= 1) {
    const dayWord = meta.daysSinceStart === 1 ? "day" : "days";
    return {
      kind: "link",
      href: deliveryHref(caseRecord.id, "demand"),
      label: `It's been ${meta.daysSinceStart} ${dayWord} since your letter was prepared. If no response, here's what to do →`,
      sublabel: "Review how to send your letter and what to do after 14 days",
    };
  }

  return {
    kind: "checkout",
    tier: "demand",
    label: "Ready to send a demand letter? $49 →",
  };
}
