export function parseCaseStrength(assessment: string): string | null {
  const match = assessment.match(
    /CASE STRENGTH\s*\n+([\s\S]*?)(?=\n[A-Z][A-Z\s]+(?:\n|$)|$)/i
  );
  if (!match) return null;
  const line = match[1].trim().split("\n")[0]?.trim();
  return line || null;
}
