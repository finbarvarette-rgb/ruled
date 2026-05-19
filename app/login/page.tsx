"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";

const inputStyle = {
  background: "#1a1916",
  color: "#f5f1eb",
  border: "1px solid #2a2825",
};

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
      // Redirect after successful login — check for pending intake
      const pendingIntake = sessionStorage.getItem("onboarding_intake");
      if (pendingIntake) {
        router.push("/processing");
      } else {
        router.push("/dashboard");
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
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-md mx-auto w-full flex flex-col gap-10 items-center text-center">
        <Link
          href="/"
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "Georgia, \'Times New Roman\', serif" }}
        >
          ruled<span style={{ color: "#c8392b" }}>.ca</span>
        </Link>

        <div className="flex flex-col gap-3 w-full">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            Enter your email and password to access your cases.
          </p>
        </div>

        {authError && (
          <p className="text-sm w-full text-left" style={{ color: "#c8392b" }}>
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
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#c8392b")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2825")}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#c8392b")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2825")}
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
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="flex flex-col gap-3 w-full items-center text-sm">
          <Link href="/onboarding" style={{ color: "#c8392b" }}>
            Don&apos;t have an account? Start free &rarr;
          </Link>
          <Link href="/forgot-password" style={{ color: "#9a9590" }}>
            Forgot your password?
          </Link>
        </div>

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
