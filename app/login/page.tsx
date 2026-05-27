"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";
import {
  m,
  marketingBtnPrimary,
  marketingCard,
  marketingInput,
  marketingPageMain,
  ruledLogoSuffixStyle,
} from "@/lib/marketing-theme";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errParam = searchParams.get("error");
  const authError = errParam === "auth" || errParam === "auth_failed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Sign in failed. Please try again.");
      }
      const pendingIntake = sessionStorage.getItem("onboarding_intake");
      if (pendingIntake) {
        router.replace("/processing");
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
          className="w-full rounded-xl p-6 sm:p-8 flex flex-col gap-6 items-center text-center"
          style={marketingCard}
        >
          <div className="flex flex-col gap-3 w-full">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: m.text }}>
              Sign in
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
              Enter your email and password to access your cases.
            </p>
          </div>

          {authError && (
            <p className="text-sm w-full text-left" style={{ color: m.blue }}>
              Session expired or link invalid. Please sign in again.
            </p>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style={marketingInput}
              onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
              onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
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
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="flex flex-col gap-3 w-full items-center text-sm">
            <Link href="/onboarding" style={{ color: m.blue }}>
              Don&apos;t have an account? Start free &rarr;
            </Link>
            <Link href="/forgot-password" style={{ color: m.muted }}>
              Forgot your password?
            </Link>
          </div>
        </div>

        <Link href="/" className="text-sm" style={{ color: m.muted }}>
          &larr; Back to home
        </Link>
      </div>
    </main>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
