"use client";

import { useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";
import { createBrowserClient } from "@supabase/ssr";

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
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${appUrl}/auth/reset-password` }
      );
      if (sbError) throw new Error(sbError.message);
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
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-md mx-auto w-full flex flex-col gap-10 items-center text-center">
        <Link
          href="/"
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "Georgia, \'Times New Roman\', serif" }}
        >
          ruled<span style={{ color: "#c8392b" }}>.ca</span>
        </Link>

        {sent ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
            <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
              We sent a password reset link to{" "}
              <span style={{ color: "#f5f1eb" }}>{email}</span>. Click it to set a new password.
            </p>
            <Link href="/login" style={{ color: "#c8392b" }} className="text-sm">
              &larr; Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 w-full">
              <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
              <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
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
                style={{ background: "#1a1916", color: "#f5f1eb", border: "1px solid #2a2825" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#c8392b")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2825")}
              />
              {error && (
                <p className="text-sm text-left" style={{ color: "#c8392b" }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-6 py-4 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                {loading && <Spinner />}
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <Link href="/login" className="text-sm" style={{ color: "#9a9590" }}>
              &larr; Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <main className="flex flex-1 items-center justify-center min-h-screen">
        <Spinner className="w-10 h-10" />
      </main>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
