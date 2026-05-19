export type RuledSession = {
  assessment: string;
  province: string;
  intake: string;
  caseId: string | null;
  email: string | null;
  demandLetter: string | null;
};

const ASSESSMENT_KEY = "ruled_assessment";
const DEMAND_LETTER_KEY = "ruled_demand_letter";

export function readRuledSession(): RuledSession {
  if (typeof window === "undefined") {
    return emptySession();
  }
  try {
    const stored = sessionStorage.getItem(ASSESSMENT_KEY);
    const demandFromKey = sessionStorage.getItem(DEMAND_LETTER_KEY);
    if (!stored) return emptySession();
    const data = JSON.parse(stored);
    return {
      assessment: data.assessment ?? "",
      province: data.province ?? "",
      intake: data.intake ?? "",
      caseId: data.caseId ?? null,
      email: data.email ?? null,
      demandLetter: demandFromKey ?? data.demandLetter ?? null,
    };
  } catch {
    return emptySession();
  }
}

export function sessionIsValid(session: RuledSession): boolean {
  return !!(
    session.assessment?.trim() &&
    session.province?.trim() &&
    session.intake?.trim() &&
    session.caseId
  );
}

export function updateRuledSession(partial: Partial<RuledSession>) {
  const current = readRuledSession();
  const next = { ...current, ...partial };
  sessionStorage.setItem(
    ASSESSMENT_KEY,
    JSON.stringify({
      assessment: next.assessment,
      province: next.province,
      intake: next.intake,
      caseId: next.caseId,
      email: next.email,
    })
  );
  if (partial.demandLetter !== undefined) {
    if (partial.demandLetter) {
      sessionStorage.setItem(DEMAND_LETTER_KEY, partial.demandLetter);
    } else {
      sessionStorage.removeItem(DEMAND_LETTER_KEY);
    }
  }
}

export function restoreSessionFromPayment(data: {
  assessment: string;
  intake: string;
  province: string;
  caseId: string;
  email?: string | null;
  demandLetter?: string | null;
}) {
  sessionStorage.setItem(
    ASSESSMENT_KEY,
    JSON.stringify({
      assessment: data.assessment,
      intake: data.intake,
      province: data.province,
      caseId: data.caseId,
      email: data.email ?? null,
    })
  );
  if (data.demandLetter) {
    sessionStorage.setItem(DEMAND_LETTER_KEY, data.demandLetter);
  }
}

function emptySession(): RuledSession {
  return {
    assessment: "",
    province: "",
    intake: "",
    caseId: null,
    email: null,
    demandLetter: null,
  };
}
