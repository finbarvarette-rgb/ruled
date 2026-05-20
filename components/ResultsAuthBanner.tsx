"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { m, marketingBtnPrimary, marketingCard } from "@/lib/marketing-theme";

export function ResultsAuthBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("ruled_auth_banner_dismissed") === "1") {
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) setShow(true);
    });
  }, []);

  if (!show || dismissed) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      style={{ ...marketingCard, border: `1px solid ${m.blue}` }}
    >
      <p className="text-sm" style={{ color: m.text }}>
        <span className="font-semibold">Save your case and track your outcome</span>
        {" — "}
        <span style={{ color: m.subtext }}>Sign up free.</span>
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/login"
          className="rounded-full px-4 py-2 text-sm font-semibold"
          style={marketingBtnPrimary}
        >
          Sign up free
        </Link>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem("ruled_auth_banner_dismissed", "1");
            setDismissed(true);
          }}
          className="text-xs cursor-pointer"
          style={{ color: m.muted }}
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
