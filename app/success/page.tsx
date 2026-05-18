"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier");

  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (tier === "full") {
      router.replace("/full-case-pack");
      return;
    }
    const timer = setTimeout(() => setShowMessage(true), 3000);
    return () => clearTimeout(timer);
  }, [tier, router]);

  if (tier === "full") {
    return null;
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-lg mx-auto w-full flex flex-col gap-10 items-center text-center">
        <span
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Ruled<span style={{ color: "#c8392b" }}>.</span>
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Payment Confirmed.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            Your document is being prepared.
          </p>
        </div>

        {!showMessage ? (
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{
              borderColor: "#2a2825",
              borderTopColor: "#c8392b",
            }}
            aria-label="Loading"
          />
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: "#f5f1eb" }}>
            Check your email — your document will arrive within 5 minutes.
          </p>
        )}

        <div className="w-full flex flex-col sm:flex-row gap-4 mt-2">
          <button
            type="button"
            onClick={() => router.push("/results")}
            className="flex-1 rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            View My Assessment
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex-1 rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer"
            style={{
              background: "#1a1916",
              color: "#f5f1eb",
              border: "1px solid #2a2825",
            }}
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
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
