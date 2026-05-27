"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { Spinner } from "@/components/Spinner";

type Tier = "demand" | "full";

type Props = {
  tier: Tier;
  className?: string;
  style?: React.CSSProperties;
  signedOutLabel: string;
  signedOutHref?: string;
};

/**
 * Smart CTA for marketing preview pages. Signed-out users go to onboarding
 * to do their assessment first. Signed-in users get routed to the most
 * recent case they own — so the CTA is never a dead-end "do onboarding
 * again" for repeat users.
 */
export function PreviewCta({
  tier,
  className,
  style,
  signedOutLabel,
  signedOutHref = "/onboarding",
}: Props) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleSignedInClick() {
    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(signedOutHref);
        return;
      }
      const filter = user.email
        ? `user_id.eq.${user.id},email.eq.${user.email}`
        : `user_id.eq.${user.id}`;
      const { data: cases } = await supabase
        .from("cases")
        .select("id, tier_purchased, paid")
        .or(filter)
        .order("created_at", { ascending: false })
        .limit(5);

      const target = cases?.find((c) => {
        if (tier === "demand") return c.tier_purchased !== "demand";
        return c.tier_purchased !== "full";
      });

      if (target) {
        router.push(
          tier === "demand"
            ? `/dashboard/demand-letter/${target.id}`
            : `/dashboard/full-case-pack/${target.id}`
        );
      } else {
        // They have no cases (or all cases already own this tier). Send to
        // the new-assessment flow so they can start one.
        router.push("/dashboard/new-assessment");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (signedIn === null) {
    // Until we know auth state, mirror the safe default (signed-out CTA).
    return (
      <a href={signedOutHref} className={className} style={style}>
        {signedOutLabel}
      </a>
    );
  }

  if (!signedIn) {
    return (
      <a href={signedOutHref} className={className} style={style}>
        {signedOutLabel}
      </a>
    );
  }

  const signedInLabel =
    tier === "demand"
      ? "Open my dashboard — Get my letter →"
      : "Open my dashboard — Get my case pack →";

  return (
    <button
      type="button"
      onClick={handleSignedInClick}
      disabled={loading}
      className={className}
      style={style}
    >
      {loading ? <Spinner /> : null}
      {loading ? "Loading…" : signedInLabel}
    </button>
  );
}
