import type { Case } from "@/lib/supabase";

export function saveCaseToSession(caseRecord: Case) {
  sessionStorage.setItem(
    "ruled_assessment",
    JSON.stringify({
      assessment: caseRecord.case_assessment,
      province: caseRecord.province,
      intake: caseRecord.intake_text,
      caseId: caseRecord.id,
      email: caseRecord.email,
    })
  );
  if (caseRecord.demand_letter) {
    sessionStorage.setItem("ruled_demand_letter", caseRecord.demand_letter);
  }
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
