"use client";

import type { Case } from "@/lib/supabase";

export function CaseList({ cases }: { cases: Case[] }) {
  function viewCase(caseRecord: Case) {
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
    window.location.href = "/results";
  }

  if (cases.length === 0) {
    return (
      <p className="text-sm" style={{ color: "#9a9590" }}>
        No cases yet.{" "}
        <a href="/#assessment" style={{ color: "#c8392b" }}>
          Start a free assessment
        </a>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {cases.map((c) => {
        const strength = parseStrength(c.case_assessment);
        return (
          <div
            key={c.id}
            className="rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{ background: "#1a1916", border: "1px solid #2a2825" }}
          >
            <div className="flex flex-col gap-1 text-sm">
              <span style={{ color: "#f5f1eb" }}>
                {new Date(c.created_at).toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {" · "}
                {c.province}
              </span>
              {strength && (
                <span style={{ color: "#9a9590" }}>
                  Strength: {strength}
                </span>
              )}
              <span style={{ color: "#9a9590" }}>
                {c.tier_purchased
                  ? `Purchased: ${c.tier_purchased}`
                  : "Free assessment"}
                {c.outcome &&
                  ` · Outcome: ${c.outcome === "won" ? "Recovered" : "Not recovered"}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => viewCase(c)}
              className="rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer shrink-0"
              style={{ background: "#c8392b", color: "#f5f1eb" }}
            >
              View
            </button>
          </div>
        );
      })}
    </div>
  );
}

function parseStrength(assessment: string): string | null {
  const match = assessment.match(
    /CASE STRENGTH\s*\n+([^\n]+)/i
  );
  return match?.[1]?.trim() ?? null;
}
