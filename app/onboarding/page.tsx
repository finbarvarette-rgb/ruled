"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    if (step === 2) {
      const storedIntake = sessionStorage.getItem(ONBOARDING_INTAKE_KEY);
      const storedProvince = sessionStorage.getItem(ONBOARDING_PROVINCE_KEY);
      if (!storedIntake?.trim() || !storedProvince) {
        router.replace("/onboarding");
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
  }, [step, router]);

  function handleStep1Continue(e: React.FormEvent) {
    e.preventDefault();
    if (!intake.trim() || !province) {
      setError("Please describe your situation and select your province.");
      return;
    }
    setError("");
    sessionStorage.setItem(ONBOARDING_INTAKE_KEY, intake.trim());
    sessionStorage.setItem(ONBOARDING_PROVINCE_KEY, province);
    router.push("/onboarding?step=2");
  }

  async function handleStep2Submit(e: React.FormEvent) {
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
        // Immediate session — proceed to processing
        router.push("/processing");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
                className="w-full rounded-lg px-6 py-4 text-sm font-semibold cursor-pointer"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Create your free account.
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
                Save your assessment and track your case.
              </p>
            </div>

            <form onSubmit={handleStep2Submit} className="flex flex-col gap-4">
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
                placeholder="Password (min. 8 characters)"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#c8392b")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2825")}
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#c8392b")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2825")}
              />
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
                {loading ? "Creating account…" : "Create Account & Get Assessment"}
              </button>
            </form>

            <p className="text-sm text-center" style={{ color: "#9a9590" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#c8392b" }}>
                Sign in
              </Link>
            </p>

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
