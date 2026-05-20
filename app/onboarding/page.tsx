"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { Spinner } from "@/components/Spinner";
import {
  PROVINCES,
  ONBOARDING_INTAKE_KEY,
  ONBOARDING_PROVINCE_KEY,
  ONBOARDING_EMAIL_KEY,
} from "@/lib/constants";

const inputStyle = {
  background: "#1a1916",
  color: "#f5f1eb",
  border: "1px solid #2a2825",
};

function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const step = stepParam === "2" ? 2 : 1;

  const [intake, setIntake] = useState("");
  const [province, setProvince] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");

  const proceedToProcessing = useCallback(() => {
    router.push("/processing");
  }, [router]);

  const checkSignedIn = useCallback(async (): Promise<boolean> => {
    try {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    async function init() {
      if (step === 2) {
        const storedIntake = sessionStorage.getItem(ONBOARDING_INTAKE_KEY);
        const storedProvince = sessionStorage.getItem(ONBOARDING_PROVINCE_KEY);
        if (!storedIntake?.trim() || !storedProvince) {
          router.replace("/onboarding");
          return;
        }

        const signedIn = await checkSignedIn();
        if (signedIn) {
          proceedToProcessing();
          return;
        }

        const storedEmail = sessionStorage.getItem(ONBOARDING_EMAIL_KEY);
        if (storedEmail) setEmail(storedEmail);
      } else {
        const storedIntake = sessionStorage.getItem(ONBOARDING_INTAKE_KEY);
        const storedProvince = sessionStorage.getItem(ONBOARDING_PROVINCE_KEY);
        if (storedIntake) setIntake(storedIntake);
        if (storedProvince) setProvince(storedProvince);
      }
      setCheckingAuth(false);
    }

    init();
  }, [step, router, checkSignedIn, proceedToProcessing]);

  async function handleStep1Continue(e: React.FormEvent) {
    e.preventDefault();
    if (!intake.trim() || !province) {
      setError("Please describe your situation and select your province.");
      return;
    }
    setError("");
    setLoading(true);

    sessionStorage.setItem(ONBOARDING_INTAKE_KEY, intake.trim());
    sessionStorage.setItem(ONBOARDING_PROVINCE_KEY, province);

    const signedIn = await checkSignedIn();
    setLoading(false);

    if (signedIn) {
      proceedToProcessing();
    } else {
      router.push("/onboarding?step=2");
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/processing")}`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start Google sign-in. Please try email instead."
      );
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Sign in failed");
      }
      sessionStorage.setItem(ONBOARDING_EMAIL_KEY, email.trim());
      proceedToProcessing();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          next: "/processing",
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        needsVerification?: boolean;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create account");
      }

      sessionStorage.setItem(ONBOARDING_EMAIL_KEY, email.trim());

      if (data.needsVerification) {
        setNeedsVerification(true);
      } else {
        proceedToProcessing();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth && step === 2) {
    return (
      <main className="flex flex-1 items-center justify-center min-h-screen">
        <Spinner className="w-10 h-10" />
      </main>
    );
  }

  if (needsVerification) {
    return (
      <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16">
        <div className="max-w-xl mx-auto w-full flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Check your inbox
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
              We sent a verification link to{" "}
              <span style={{ color: "#f5f1eb" }}>{email}</span>. Click it to
              verify your account and see your case assessment.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
              Your case details have been saved — they will be waiting when you
              come back.
            </p>
          </div>
          <Link
            href="/login"
            className="text-sm w-fit"
            style={{ color: "#c8392b" }}
          >
            Already verified? Sign in &rarr;
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16">
      <div className="max-w-xl mx-auto w-full flex flex-col gap-8">
        <Link href="/" className="text-sm w-fit" style={{ color: "#9a9590" }}>
          &larr; Back to home
        </Link>

        <OnboardingProgress step={step === 1 ? 1 : 2} />

        {step === 1 ? (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Tell us what happened.
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
                Describe your situation in plain language. Who owes you money,
                how much, and why.
              </p>
            </div>

            <form onSubmit={handleStep1Continue} className="flex flex-col gap-4">
              <textarea
                value={intake}
                onChange={(e) => setIntake(e.target.value)}
                rows={10}
                placeholder="Example: My contractor took a $5,000 deposit, did half the work, and stopped responding..."
                className="w-full rounded-xl px-4 py-4 text-sm leading-relaxed resize-none outline-none"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#c8392b")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2825")}
              />
              <select
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm outline-none appearance-none cursor-pointer"
                style={{ ...inputStyle, color: province ? "#f5f1eb" : "#9a9590" }}
              >
                <option value="" disabled>
                  Select your province
                </option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {error && (
                <p className="text-sm" style={{ color: "#c8392b" }}>
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
                {loading ? "Continuing…" : "Continue"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Create a free account to save your assessment
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
                Your case details are saved. Create an account so your assessment
                and next steps stay in your dashboard.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full rounded-lg px-6 py-3.5 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-3"
              style={{
                background: "#1a1916",
                color: "#f5f1eb",
                border: "1px solid #2a2825",
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "#2a2825" }} />
              <span className="text-xs" style={{ color: "#9a9590" }}>
                or
              </span>
              <div className="flex-1 h-px" style={{ background: "#2a2825" }} />
            </div>

            <div
              className="flex rounded-lg p-1 gap-1"
              style={{ background: "#1a1916", border: "1px solid #2a2825" }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                }}
                className="flex-1 rounded-md px-3 py-2 text-xs font-semibold cursor-pointer"
                style={{
                  background: authMode === "signup" ? "#c8392b" : "transparent",
                  color: authMode === "signup" ? "#f5f1eb" : "#9a9590",
                }}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setError("");
                }}
                className="flex-1 rounded-md px-3 py-2 text-xs font-semibold cursor-pointer"
                style={{
                  background: authMode === "signin" ? "#c8392b" : "transparent",
                  color: authMode === "signin" ? "#f5f1eb" : "#9a9590",
                }}
              >
                Sign in
              </button>
            </div>

            <form
              onSubmit={authMode === "signup" ? handleSignUp : handleSignIn}
              className="flex flex-col gap-4"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
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
                placeholder={
                  authMode === "signup"
                    ? "Password (min. 8 characters)"
                    : "Password"
                }
                autoComplete={
                  authMode === "signup" ? "new-password" : "current-password"
                }
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#c8392b")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2825")}
              />
              {authMode === "signup" && (
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#c8392b")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#2a2825")
                  }
                />
              )}
              {error && (
                <p className="text-sm" style={{ color: "#c8392b" }}>
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
                {loading
                  ? authMode === "signup"
                    ? "Creating account…"
                    : "Signing in…"
                  : authMode === "signup"
                    ? "Create Account & Continue"
                    : "Sign In & Continue"}
              </button>
            </form>

            <p className="text-xs text-center leading-relaxed" style={{ color: "#6b6560" }}>
              By continuing you agree to our{" "}
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center min-h-screen">
          <Spinner className="w-10 h-10" />
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
