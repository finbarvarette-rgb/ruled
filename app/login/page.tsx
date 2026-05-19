"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";

function LoginForm() {
  const searchParams = useSearchParams();
  const errParam = searchParams.get("error");
  const authError = errParam === "auth" || errParam === "auth_failed";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendLink() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          next: "/dashboard",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send magic link");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    await sendLink();
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-md mx-auto w-full flex flex-col gap-10 items-center text-center">
        <span
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Ruled<span style={{ color: "#c8392b" }}>.</span>
        </span>

        {sent ? (
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Check your inbox
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
              Click the magic link to sign in. The link expires in 10 minutes.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={sendLink}
              className="text-sm font-medium cursor-pointer disabled:opacity-60"
              style={{ color: "#c8392b" }}
            >
              {loading ? "Sending…" : "Resend magic link"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                Sign in to Ruled
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
                Enter your email and we&apos;ll send you a magic link.
              </p>
            </div>

            {authError && (
              <p className="text-sm w-full" style={{ color: "#c8392b" }}>
                Sign-in link expired or invalid. Please request a new link.
              </p>
            )}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  background: "#1a1916",
                  color: "#f5f1eb",
                  border: "1px solid #2a2825",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#c8392b";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#2a2825";
                }}
              />
              {error && (
                <p className="text-sm text-left" style={{ color: "#c8392b" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-6 py-4 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                {loading && <Spinner />}
                {loading ? "Sending…" : "Send Magic Link"}
              </button>
            </form>
          </>
        )}

        <Link href="/" className="text-sm" style={{ color: "#9a9590" }}>
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
        <main className="flex flex-1 items-center justify-center min-h-screen">
          <Spinner className="w-10 h-10" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
