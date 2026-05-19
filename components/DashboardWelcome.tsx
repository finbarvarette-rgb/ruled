"use client";

import { useEffect, useState } from "react";
import { startCheckout } from "@/lib/checkout";

export function DashboardWelcome({ show }: { show: boolean }) {
  const [open, setOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<
    "demand" | "full" | null
  >(null);

  useEffect(() => {
    if (!show) return;
    if (sessionStorage.getItem("ruled_welcome_seen") === "1") return;
    setOpen(true);
  }, [show]);

  function dismiss() {
    sessionStorage.setItem("ruled_welcome_seen", "1");
    setOpen(false);
  }

  async function handleCheckout(tier: "demand" | "full") {
    setCheckoutLoading(tier);
    try {
      const stored = sessionStorage.getItem("ruled_assessment");
      let caseId: string | null = null;
      let email: string | null = null;
      if (stored) {
        const data = JSON.parse(stored);
        caseId = data.caseId ?? null;
        email = data.email ?? null;
      }
      await startCheckout(tier, caseId, email);
    } catch {
      setCheckoutLoading(null);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15, 14, 12, 0.85)" }}
    >
      <div
        className="max-w-lg w-full rounded-xl p-6 md:p-8 flex flex-col gap-6"
        style={{ background: "#1a1916", border: "1px solid #2a2825" }}
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Welcome to Ruled</h2>
          <p className="text-sm" style={{ color: "#9a9590" }}>
            Your case assessment has been saved to your account. Here is what you
            can do next:
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <WelcomeCard
            title="Generate a demand letter"
            price="$49"
            description="Professional letter drafted to your case. Often enough to get paid."
            cta="Get Demand Letter"
            loading={checkoutLoading === "demand"}
            onClick={() => handleCheckout("demand")}
          />
          <WelcomeCard
            title="Get the full case pack"
            price="$199"
            description="Demand letter, court docs, hearing prep, and unlimited Q&A."
            cta="Get Full Case Pack"
            highlight
            loading={checkoutLoading === "full"}
            onClick={() => handleCheckout("full")}
          />
          <WelcomeCard
            title="Come back later"
            price=""
            description="Your assessment is saved on your dashboard whenever you need it."
            cta="Got it"
            onClick={dismiss}
          />
        </div>
      </div>
    </div>
  );
}

function WelcomeCard({
  title,
  price,
  description,
  cta,
  highlight,
  loading,
  onClick,
}: {
  title: string;
  price: string;
  description: string;
  cta: string;
  highlight?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-3"
      style={{
        background: highlight ? "#0f0e0c" : "transparent",
        border: `1px solid ${highlight ? "#c8392b" : "#2a2825"}`,
      }}
    >
      <div>
        <p className="font-semibold text-sm">
          {title}
          {price && (
            <span style={{ color: "#c8392b" }}> — {price}</span>
          )}
        </p>
        <p className="text-xs mt-1" style={{ color: "#9a9590" }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={onClick}
        className="self-start rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60 cursor-pointer"
        style={{
          background: highlight ? "#c8392b" : "#2a2825",
          color: "#f5f1eb",
        }}
      >
        {loading ? "Redirecting…" : cta}
      </button>
    </div>
  );
}
