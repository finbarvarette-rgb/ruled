export type RuledSession = {
  assessment: string;
  province: string;
  intake: string;
  caseId: string | null;
  email: string | null;
  demandLetter: string | null;
};

export function readRuledSession(): RuledSession {
  if (typeof window === "undefined") {
    return {
      assessment: "",
      province: "",
      intake: "",
      caseId: null,
      email: null,
      demandLetter: null,
    };
  }
  try {
    const stored = sessionStorage.getItem("ruled_assessment");
    if (!stored) {
      return {
        assessment: "",
        province: "",
        intake: "",
        caseId: null,
        email: null,
        demandLetter: null,
      };
    }
    const data = JSON.parse(stored);
    return {
      assessment: data.assessment ?? "",
      province: data.province ?? "",
      intake: data.intake ?? "",
      caseId: data.caseId ?? null,
      email: data.email ?? null,
      demandLetter: data.demandLetter ?? null,
    };
  } catch {
    return {
      assessment: "",
      province: "",
      intake: "",
      caseId: null,
      email: null,
      demandLetter: null,
    };
  }
}

export function updateRuledSession(partial: Partial<RuledSession>) {
  const current = readRuledSession();
  sessionStorage.setItem(
    "ruled_assessment",
    JSON.stringify({ ...current, ...partial })
  );
}
