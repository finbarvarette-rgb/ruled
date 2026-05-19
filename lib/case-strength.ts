export type CaseStrength = "Strong" | "Moderate" | "Weak";

export function parseCaseStrength(assessment: string): CaseStrength | null {
  const match = assessment.match(
    /CASE STRENGTH\s*\n+\s*(Strong|Moderate|Weak)/i
  );
  if (!match) return null;
  const value = match[1];
  if (/strong/i.test(value)) return "Strong";
  if (/moderate/i.test(value)) return "Moderate";
  if (/weak/i.test(value)) return "Weak";
  return null;
}

export function strengthBadgeStyle(strength: CaseStrength): {
  background: string;
  color: string;
} {
  switch (strength) {
    case "Strong":
      return { background: "rgba(34, 120, 70, 0.25)", color: "#4ade80" };
    case "Moderate":
      return { background: "rgba(180, 140, 40, 0.25)", color: "#facc15" };
    case "Weak":
      return { background: "rgba(200, 57, 43, 0.25)", color: "#f87171" };
  }
}
