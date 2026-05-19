"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { restoreSessionFromPayment } from "@/lib/session";
import { Spinner } from "@/components/Spinner";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"demand" | "full" | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Invalid payment session.");
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Verification failed");
        }

        restoreSessionFromPayment({
          assessment: data.assessment,
          intake: data.intake,
          province: data.province,
          caseId: data.caseId,
          email: data.email,
          demandLetter: data.demandLetter,
        });

        setTier(data.tier === "full" ? "full" : "demand");
        setLoading(false);
      } catch {
        setError(
          "We could not confirm your payment. Please contact hello@ruled.ca with your receipt."
        );
        setLoading(false);
      }
    }

    verify();
  }, [sessionId]);

  if (loading) {
    return (
      <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-16 items-center justify-center gap-4">
        <Spinner className="w-10 h-10" />
        <p className="text-sm" style={{ color: "#9a9590" }}>
          Confirming your payment…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-16 items-center justify-center">
        <p className="text-sm text-center max-w-md" style={{ color: "#c8392b" }}>
          {error}
        </p>
        <Link href="/" className="mt-6 text-sm" style={{ color: "#9a9590" }}>
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-16 items-center justify-center">
      <div className="max-w-md w-full flex flex-col gap-6 text-center">
        <span
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          ruled<span style={{ color: "#c8392b" }}>.ca</span>
        </span>
        <h1 className="text-2xl font-semibold">Payment confirmed</h1>
        <p className="text-sm" style={{ color: "#9a9590" }}>
          Thank you. Your purchase is ready.
        </p>
        <div className="flex flex-col gap-3 mt-2">
          <button
            type="button"
            onClick={() =>
              router.push(tier === "full" ? "/full-case-pack" : "/demand")
            }
            className="w-full rounded-lg px-6 py-4 text-sm font-semibold cursor-pointer"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            {tier === "full"
              ? "Open Full Case Pack"
              : "Generate Demand Letter"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/results")}
            className="w-full rounded-lg px-6 py-4 text-sm font-semibold cursor-pointer"
            style={{
              background: "#1a1916",
              color: "#f5f1eb",
              border: "1px solid #2a2825",
            }}
          >
            View My Assessment
          </button>
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="w-full rounded-lg px-6 py-3 text-sm cursor-pointer"
            style={{ color: "#9a9590" }}
          >
            Generate Another Case
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center min-h-screen">
          <Spinner className="w-10 h-10" />
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
