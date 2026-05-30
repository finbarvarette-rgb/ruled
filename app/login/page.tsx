"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";

const NAVY = "#0A0F1E";
const CARD = "#151C2E";
const CARD2 = "#0D1220";
const GOLD = "#D4A853";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(212,168,83,0.25)";
const MUTED = "rgba(255,255,255,0.5)";
const WHITE = "#FFFFFF";
const RED = "#C8392B";
const PF = "'Playfair Display', Georgia, serif";

const inputStyle = {
  background: CARD2,
  color: WHITE,
  border: `1px solid ${BORDER}`,
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
      style={{
        background: NAVY,
        color: WHITE,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 32, alignItems: "center" }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: PF, fontSize: 28, fontWeight: 700 }}>
            <span style={{ color: WHITE }}>ruled</span>
            <span style={{ color: GOLD }}>.ca</span>
          </span>
        </Link>

        {/* Card */}
        <div
          style={{
            width: "100%",
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ fontFamily: PF, fontSize: 28, fontWeight: 700, color: WHITE, margin: 0 }}>
              Sign in
            </h1>
            <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
              Enter your email and password to access your cases.
            </p>
          </div>

          {authError && (
            <p style={{ fontSize: 13, color: RED }}>
              Session expired or link invalid. Please sign in again.
            </p>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              style={{
                ...inputStyle,
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 14,
                outline: "none",
                width: "100%",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                ...inputStyle,
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 14,
                outline: "none",
                width: "100%",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
            />
            {error && (
              <p style={{ fontSize: 13, color: RED }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: GOLD,
                color: NAVY,
                border: "none",
                borderRadius: 8,
                padding: "13px 24px",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {loading && <Spinner />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", fontSize: 13 }}>
            <Link href="/onboarding" style={{ color: GOLD, textDecoration: "none" }}>
              Don&apos;t have an account? Start free &rarr;
            </Link>
            <Link href="/forgot-password" style={{ color: MUTED, textDecoration: "none" }}>
              Forgot your password?
            </Link>
          </div>
        </div>

        <Link href="/" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>
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
        <main style={{ background: NAVY, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner className="w-10 h-10" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
