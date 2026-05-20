"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Spinner } from "@/components/Spinner";
import { PROVINCES, ONBOARDING_INTAKE_KEY, ONBOARDING_PROVINCE_KEY } from "@/lib/constants";
import { dash } from "../theme";

const inputStyle = { ...dash.input };

export default function NewAssessmentPage() {
  const [intake, setIntake] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assessment, setAssessment] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  useEffect(() => {
    // Seed with any in-progress intake if present
    const storedIntake = sessionStorage.getItem(ONBOARDING_INTAKE_KEY);
    const storedProvince = sessionStorage.getItem(ONBOARDING_PROVINCE_KEY);
    if (storedIntake) setIntake(storedIntake);
    if (storedProvince) setProvince(storedProvince);
  }, []);

  async function generate() {
    setError("");
    setAssessment(null);
    setCaseId(null);

    if (!intake.trim() || !province) {
      setError("Please describe your situation and select your province.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake: intake.trim(), province }),
      });
      const data = (await res.json()) as { assessment?: string; caseId?: string; error?: string };
      if (!res.ok || !data.assessment) {
        throw new Error(data.error ?? "Assessment failed");
      }

      setAssessment(data.assessment);
      setCaseId(data.caseId ?? null);

      // Ensure it's linked to the user (and create if needed)
      await fetch("/api/cases/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          caseId: data.caseId ?? null,
          assessment: data.assessment,
          intake: intake.trim(),
          province,
        }),
      });

      // Refresh client session copy for other flows
      const { data: userData } = await supabase.auth.getUser();
      sessionStorage.setItem(
        "ruled_assessment",
        JSON.stringify({
          assessment: data.assessment,
          province,
          intake: intake.trim(),
          caseId: data.caseId ?? null,
          email: userData.user?.email ?? null,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate assessment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4 sm:px-6 py-8 md:py-10">
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">New case assessment</h1>
          <p className="text-sm" style={{ color: dash.mainMuted }}>
            Describe what happened and we&apos;ll generate your assessment in minutes.
          </p>
        </header>

        <section className="rounded-2xl p-6 flex flex-col gap-4" style={{ ...dash.panel }}>
          <textarea
            value={intake}
            onChange={(e) => setIntake(e.target.value)}
            rows={10}
            placeholder="Example: My contractor took a $5,000 deposit, did half the work, and stopped responding…"
            className="w-full rounded-xl px-4 py-4 text-base sm:text-sm leading-relaxed resize-none outline-none placeholder:text-[#534f4a] min-h-[10rem]"
            style={inputStyle}
          />

          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full rounded-xl px-4 py-3.5 text-base sm:text-sm outline-none appearance-none cursor-pointer min-h-12"
            style={{ ...inputStyle, color: province ? dash.mainText : dash.mainMuted }}
          >
            <option value="">Select your province</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {error && (
            <p className="text-sm" style={{ color: "#c8392b" }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="w-full min-h-12 rounded-xl px-6 py-4 text-base sm:text-sm font-semibold disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-2"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            {loading && <Spinner />}
            {loading ? "Generating…" : "Generate Assessment"}
          </button>
        </section>

        {assessment && (
          <section className="rounded-2xl p-6 md:p-8 flex flex-col gap-4" style={{ ...dash.panel }}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Your assessment</h2>
              {caseId && (
                <span className="text-xs" style={{ color: dash.mainMuted }}>
                  Saved to your cases
                </span>
              )}
            </div>
            <pre
              className="whitespace-pre-wrap text-sm leading-relaxed break-words"
              style={{ color: dash.mainText }}
            >
              {assessment}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}

