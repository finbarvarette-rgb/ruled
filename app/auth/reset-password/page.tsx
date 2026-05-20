"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";
import {
  m,
  marketingBtnPrimary,
  marketingCard,
  marketingInput,
  marketingPageMain,
  ruledLogoSuffixStyle,
} from "@/lib/marketing-theme";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [ready, setReady] = useState(false);
  const [exchangeError, setExchangeError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setExchangeError("");
      }
    });

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
        return;
      }

      if (!code) {
        setExchangeError(
          "Invalid or expired reset link. Please request a new one from the forgot password page."
        );
        return;
      }

      const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeErr) {
        setExchangeError(
          "This reset link has expired or already been used. Please request a new one."
        );
      } else {
        setReady(true);
      }
    }

    void init();

    return () => listener.subscription.unsubscribe();
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || "Failed to update password. Please try again.");
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    }
  }

  if (exchangeError) {
    return (
      <main
        className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16"
        style={marketingPageMain}
      >
        <div className="max-w-md mx-auto w-full flex flex-col gap-8 items-center text-center">
          <Link
            href="/"
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: m.text }}
          >
            ruled<span style={ruledLogoSuffixStyle()}>.ca</span>
          </Link>
          <div
            className="w-full rounded-xl p-6 sm:p-8 flex flex-col gap-4"
            style={marketingCard}
          >
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: m.text }}>
              Link expired
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
              {exchangeError}
            </p>
            <Link
              href="/forgot-password"
              className="w-full min-h-12 rounded-full px-6 py-4 text-sm font-semibold text-center flex items-center justify-center"
              style={marketingBtnPrimary}
            >
              Request a new link
            </Link>
            <Link href="/login" className="text-sm" style={{ color: m.muted }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main
        className="flex flex-1 items-center justify-center min-h-screen"
        style={marketingPageMain}
      >
        <Spinner className="w-10 h-10" />
      </main>
    );
  }

  if (done) {
    return (
      <main
        className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16"
        style={marketingPageMain}
      >
        <div className="max-w-md mx-auto w-full flex flex-col gap-8 items-center text-center">
          <Link
            href="/"
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: m.text }}
          >
            ruled<span style={ruledLogoSuffixStyle()}>.ca</span>
          </Link>
          <div className="flex flex-col gap-3 w-full" style={marketingCard}>
            <h1 className="text-2xl font-semibold tracking-tight p-6 pb-0" style={{ color: m.text }}>
              Password updated
            </h1>
            <p className="text-sm leading-relaxed px-6 pb-6" style={{ color: m.subtext }}>
              Your password has been changed. Redirecting you to your dashboard…
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16"
      style={marketingPageMain}
    >
      <div className="max-w-md mx-auto w-full flex flex-col gap-8 items-center text-center">
        <Link
          href="/"
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: m.text }}
        >
          ruled<span style={ruledLogoSuffixStyle()}>.ca</span>
        </Link>

        <div
          className="w-full rounded-xl p-6 sm:p-8 flex flex-col gap-6"
          style={marketingCard}
        >
          <div className="flex flex-col gap-3 w-full text-center">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: m.text }}>
              Set a new password
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min. 8 characters)"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style={marketingInput}
              onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
              onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
            />
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style={marketingInput}
              onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
              onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
            />
            {error && (
              <p className="text-sm text-left" style={{ color: m.blue }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-12 rounded-full px-6 py-4 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              style={marketingBtnPrimary}
            >
              {loading && <Spinner />}
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>

          <Link href="/login" className="text-sm" style={{ color: m.muted }}>
            &larr; Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main
          className="flex flex-1 items-center justify-center min-h-screen"
          style={marketingPageMain}
        >
          <Spinner className="w-10 h-10" />
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
