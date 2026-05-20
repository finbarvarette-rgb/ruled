"use client";

import { useEffect, useState } from "react";
import { m, marketingBtnPrimary, marketingBtnSecondary } from "@/lib/marketing-theme";

type Props = {
  onDemandLetter: () => void;
  onFullPack: () => void;
  checkoutLoading: "demand" | "full" | null;
};

export function ResultsStickyBar({
  onDemandLetter,
  onFullPack,
  checkoutLoading,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 320);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t px-4 py-3 md:py-4"
      style={{
        background: "rgba(255, 255, 255, 0.96)",
        borderColor: m.border,
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <p className="text-sm font-semibold shrink-0" style={{ color: m.text }}>
          Ready to fight back?
        </p>
        <div className="flex flex-col sm:flex-row gap-2 flex-1 sm:justify-end">
          <button
            type="button"
            disabled={checkoutLoading !== null}
            onClick={onDemandLetter}
            className="flex-1 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60 whitespace-nowrap"
            style={marketingBtnPrimary}
          >
            Generate Demand Letter $49
          </button>
          <button
            type="button"
            disabled={checkoutLoading !== null}
            onClick={onFullPack}
            className="flex-1 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60 whitespace-nowrap"
            style={marketingBtnSecondary}
          >
            {checkoutLoading === "full" ? "Redirecting…" : "Full Case Pack $199"}
          </button>
        </div>
      </div>
    </div>
  );
}
