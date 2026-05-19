"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { restoreSessionFromPayment } from "@/lib/session";
import { Spinner } from "@/components/Spinner";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Confirming your payment…");

  useEffect(() => {
    if (!sessionId) {
      setError("Invalid payment session.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) throw new Error("Verification failed");

        const data = await res.json();
        restoreSessionFromPayment({
          assessment: data.assessment,
          intake: data.intake,
          province: data.province,
          caseId: data.caseId,
          email: data.email,
          demandLetter: data.demandLetter,
        });

        if (data.tier === "full") {
          router.replace("/full-case-pack");
        } else {
          router.replace("/demand");
        }
      } catch {
        setError(
          "We could not confirm your payment. Please contact hello@ruled.ca with your receipt."
        );
      }
    }

    verify();
  }, [sessionId, router]);

  if (error) {
    return (
      <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-16 items-center justify-center">
        <p className="text-sm text-center max-w-md" style={{ color: "#c8392b" }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 text-sm"
          style={{ color: "#9a9590" }}
        >
          Back to home
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-16 items-center justify-center gap-4">
      <Spinner className="w-10 h-10" />
      <p className="text-sm" style={{ color: "#9a9590" }}>
        {status}
      </p>
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
