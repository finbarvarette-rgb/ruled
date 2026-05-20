"use client";

import { useState } from "react";
import Link from "next/link";
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

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }
      setSent(true);
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
          {sent ? (
            <div className="flex flex-col gap-4 w-full">
              <h1 className="text-2xl font-semibold tracking-tight" style={{ color: m.text }}>
                Check your inbox
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
                We sent a password reset link to{" "}
                <span style={{ color: m.text }}>{email}</span>. Click it to set a new password.
              </p>
              <Link href="/login" style={{ color: m.blue }} className="text-sm">
                &larr; Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 w-full">
                <h1 className="text-2xl font-semibold tracking-tight" style={{ color: m.text }}>
                  Reset your password
                </h1>
                <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

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
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <Link href="/login" className="text-sm" style={{ color: m.muted }}>
                &larr; Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
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
      <ForgotPasswordForm />
    </Suspense>
  );
}
