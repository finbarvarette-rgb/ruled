"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OutcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submitOutcome(outcome: "won" | "lost") {
    if (!caseId) {
      setError("Missing case reference. Please use the link from your follow-up email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, outcome }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-lg mx-auto w-full flex flex-col gap-10 items-center text-center">
        <span
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          ruled<span style={{ color: "#c8392b" }}>.ca</span>
        </span>

        {submitted ? (
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Thank you
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
              Your response helps us improve Ruled for every Canadian fighting
              to get paid.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-4 text-sm cursor-pointer"
              style={{ color: "#c8392b" }}
            >
              Back to Ruled
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Did You Get Your Money Back?
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
                Your answer helps us improve Ruled and helps other Canadians
                know what to expect.
              </p>
            </div>

            {error && (
              <p className="text-sm" style={{ color: "#c8392b" }}>
                {error}
              </p>
            )}

            <div className="w-full flex flex-col gap-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => submitOutcome("won")}
                className="w-full rounded-xl px-6 py-5 text-base font-semibold transition-opacity disabled:opacity-60 cursor-pointer"
                style={{ background: "#2d6a4f", color: "#f5f1eb" }}
              >
                Yes — I recovered my money
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => submitOutcome("lost")}
                className="w-full rounded-xl px-6 py-5 text-base font-semibold transition-opacity disabled:opacity-60 cursor-pointer"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                No — I did not recover my money
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function OutcomePage() {
  return (
    <Suspense fallback={null}>
      <OutcomeContent />
    </Suspense>
  );
}
