"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
      style={{ background: "#1a1916", border: "1px solid #c8392b" }}
    >
      <p className="text-sm">
        <span className="font-semibold">Save your case and track your outcome</span>
        {" — "}
        <span style={{ color: "#9a9590" }}>Sign up free.</span>
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/login"
          className="rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ background: "#c8392b", color: "#f5f1eb" }}
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
          style={{ color: "#9a9590" }}
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
