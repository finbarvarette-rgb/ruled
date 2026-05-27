"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

type Props = {
  className?: string;
  style?: CSSProperties;
  /** Label override; if omitted, label is chosen based on signed-in state. */
  signedInLabel?: string;
  signedOutLabel?: string;
  /** Override the signed-in destination. Default: /dashboard */
  signedInHref?: string;
  /** Override the signed-out destination. Default: / */
  signedOutHref?: string;
};

/**
 * Back link that routes signed-in users to the dashboard and signed-out
 * users to the marketing landing page. Keeps users inside the funnel they
 * already started rather than dumping them on the homepage.
 */
export function SmartBackLink({
  className,
  style,
  signedInLabel = "← Back to dashboard",
  signedOutLabel = "← Back to home",
  signedInHref = "/dashboard",
  signedOutHref = "/",
}: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserSupabase();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled) setSignedIn(!!session);
      } catch {
        if (!cancelled) setSignedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Render a stable href on first paint to avoid layout jumps.
  const href = signedIn ? signedInHref : signedOutHref;
  const label = signedIn ? signedInLabel : signedOutLabel;

  return (
    <Link href={href} className={className} style={style}>
      {label}
    </Link>
  );
}
