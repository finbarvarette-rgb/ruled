"use client";

import { useEffect, useState } from "react";

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
        background: "rgba(15, 14, 12, 0.96)",
        borderColor: "#2a2825",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <p className="text-sm font-semibold shrink-0">Ready to fight back?</p>
        <div className="flex flex-col sm:flex-row gap-2 flex-1 sm:justify-end">
          <button
            type="button"
            disabled={checkoutLoading !== null}
            onClick={onDemandLetter}
            className="flex-1 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60 whitespace-nowrap"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Generate Demand Letter $49
          </button>
          <button
            type="button"
            disabled={checkoutLoading !== null}
            onClick={onFullPack}
            className="flex-1 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60 whitespace-nowrap"
            style={{
              background: "#1a1916",
              color: "#f5f1eb",
              border: "1px solid #2a2825",
            }}
          >
            {checkoutLoading === "full" ? "Redirecting…" : "Full Case Pack $199"}
          </button>
        </div>
      </div>
    </div>
  );
}
