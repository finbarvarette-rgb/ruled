"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
import {
  m,
  marketingCard,
  marketingBtnPrimary,
  marketingBtnSecondary,
  marketingInput,
  marketingPageMain,
} from "@/lib/marketing-theme";

const inputStyle = marketingInput;

const DISPUTE_TYPES = [
  "Contractor/trades",
  "Landlord/tenant",
  "Product or service not delivered",
  "Unpaid invoice",
  "Property damage",
  "Other",
] as const;

const EVIDENCE_OPTIONS = [
  "Written contract or agreement",
  "Invoices or receipts",
  "Text messages or emails",
  "Photos or videos",
  "Bank records or payment proof",
  "Witnesses",
  "None of the above",
] as const;

const Q_STEP_TITLES = ["Basic Info", "What Happened", "Your Evidence", "Their Side"] as const;

type IntakeData = {
  whoOwes: string;
  amountOwed: string;
  province: string;
  disputeType: string;
  whatHappened: string;
  whenHappened: string;
  hadContract: string;
  whatWasSupposed: string;
  evidence: string[];
  triedToResolve: string;
  resolveAttemptDetails: string;
  theirReason: string;
  theirReasonDetails: string;
  theirResponse: string;
};

const EMPTY_INTAKE: IntakeData = {
  whoOwes: "",
  amountOwed: "",
  province: "",
  disputeType: "",
  whatHappened: "",
  whenHappened: "",
  hadContract: "",
  whatWasSupposed: "",
  evidence: [],
  triedToResolve: "",
  resolveAttemptDetails: "",
  theirReason: "",
  theirReasonDetails: "",
  theirResponse: "",
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function compileIntake(d: IntakeData): string {
  const lines: string[] = [];
  lines.push(`Province: ${d.province}`);
  lines.push(`Dispute type: ${d.disputeType}`);
  lines.push(`Who owes money: ${d.whoOwes}`);
  lines.push(`Amount owed: $${d.amountOwed}`);
  lines.push(`\nWhat happened:\n${d.whatHappened}`);
  lines.push(`\nWhen it happened: ${d.whenHappened}`);
  lines.push(`Written agreement or contract: ${d.hadContract}`);
  if (d.whatWasSupposed.trim()) {
    lines.push(`What was supposed to happen: ${d.whatWasSupposed}`);
  }
  lines.push(`\nEvidence confirmed: ${d.evidence.length > 0 ? d.evidence.join("; ") : "None"}`);
  lines.push(`Attempted to resolve before now: ${d.triedToResolve}`);
  if (d.triedToResolve === "Yes" && d.resolveAttemptDetails.trim()) {
    lines.push(`Details of resolution attempt: ${d.resolveAttemptDetails}`);
  }
  lines.push(`\nDid they give a reason for not paying or delivering: ${d.theirReason}`);
  if (d.theirReason === "Yes" && d.theirReasonDetails.trim()) {
    lines.push(`Their reason: ${d.theirReasonDetails}`);
  }
  lines.push(`Their response to contact attempts: ${d.theirResponse}`);
  return lines.join("\n");
}

function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function OptionPills({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="rounded-full px-4 py-2 text-sm font-medium cursor-pointer transition-colors"
          style={{
            background: value === opt ? m.blue : m.white,
            color: value === opt ? m.white : m.text,
            border: `1.5px solid ${value === opt ? m.blue : m.border}`,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const step = stepParam === "2" ? 2 : 1;

  const [qStep, setQStep] = useState<1 | 2 | 3 | 4>(1);
  const [intakeData, setIntakeData] = useState<IntakeData>(EMPTY_INTAKE);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");

  const set = useCallback(<K extends keyof IntakeData>(key: K, value: IntakeData[K]) => {
    setIntakeData((prev) => ({ ...prev, [key]: value }));
  }, []);

  function addFiles(files: FileList | File[]) {
    const accepted = ["image/jpeg", "image/png", "application/pdf", "text/plain"];
    const maxSize = 5 * 1024 * 1024;
    const valid = Array.from(files).filter(
      (f) => accepted.includes(f.type) && f.size <= maxSize
    );
    setUploadedFiles((prev) => [...prev, ...valid].slice(0, 10));
  }

  function removeFile(idx: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  }

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
        // Check auth first — handles return from Google OAuth
        const signedIn = await checkSignedIn();
        const storedIntake = sessionStorage.getItem(ONBOARDING_INTAKE_KEY);
        const storedProvince = sessionStorage.getItem(ONBOARDING_PROVINCE_KEY);

        if (signedIn) {
          if (storedIntake?.trim() && storedProvince) {
            proceedToProcessing(); // has pending data → submit assessment
          } else {
            router.replace("/dashboard"); // signed in but no pending data
          }
          return;
        }

        if (!storedIntake?.trim() || !storedProvince) {
          router.replace("/onboarding"); // not signed in, no data → restart
          return;
        }

        const storedEmail = sessionStorage.getItem(ONBOARDING_EMAIL_KEY);
        if (storedEmail) setEmail(storedEmail);
      } else {
        const storedProvince = sessionStorage.getItem(ONBOARDING_PROVINCE_KEY);
        if (storedProvince) setIntakeData((prev) => ({ ...prev, province: storedProvince }));
      }
      setCheckingAuth(false);
    }
    init();
  }, [step, router, checkSignedIn, proceedToProcessing]);

  function validateQStep(): string {
    if (qStep === 1) {
      if (!intakeData.whoOwes.trim()) return "Please enter who owes you money.";
      if (!intakeData.amountOwed || Number(intakeData.amountOwed) <= 0) return "Please enter a valid amount.";
      if (!intakeData.province) return "Please select your province.";
      if (!intakeData.disputeType) return "Please select the type of dispute.";
    }
    if (qStep === 2) {
      const wc = wordCount(intakeData.whatHappened);
      if (wc < 50) return `Please describe what happened in at least 50 words (currently ${wc}).`;
      if (!intakeData.whenHappened.trim()) return "Please indicate when this happened.";
      if (!intakeData.hadContract) return "Please indicate whether you had a written agreement.";
    }
    if (qStep === 3) {
      if (intakeData.evidence.length === 0) return "Please select at least one option — even if it's 'None of the above'.";
      if (!intakeData.triedToResolve) return "Please indicate whether you've tried to resolve this.";
    }
    if (qStep === 4) {
      if (!intakeData.theirReason) return "Please indicate whether they gave a reason.";
      if (!intakeData.theirResponse) return "Please indicate how they responded.";
    }
    return "";
  }

  function handleQNext(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateQStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    if (qStep < 4) {
      setQStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else {
      void handleStep1Continue();
    }
  }

  async function handleStep1Continue() {
    setLoading(true);
    const compiled = compileIntake(intakeData);
    sessionStorage.setItem(ONBOARDING_INTAKE_KEY, compiled);
    sessionStorage.setItem(ONBOARDING_PROVINCE_KEY, intakeData.province);
    if (uploadedFiles.length > 0) {
      const meta = uploadedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }));
      sessionStorage.setItem("ruled_pending_files", JSON.stringify(meta));
    }
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
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/onboarding?step=2")}`,
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
      if (!res.ok) throw new Error(data.error ?? "Sign in failed");
      sessionStorage.setItem(ONBOARDING_EMAIL_KEY, email.trim());
      proceedToProcessing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
        body: JSON.stringify({ email: email.trim(), password, next: "/processing" }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        needsVerification?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to create account");
      sessionStorage.setItem(ONBOARDING_EMAIL_KEY, email.trim());
      if (data.needsVerification) {
        setNeedsVerification(true);
      } else {
        proceedToProcessing();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
      <main
        className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16"
        style={marketingPageMain}
      >
        <div className="max-w-xl mx-auto w-full flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Check your inbox
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
              We sent a verification link to{" "}
              <span style={{ color: m.text }}>{email}</span>. Click it to verify
              your account and see your case assessment.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
              Your case details have been saved — they will be waiting when you
              come back.
            </p>
          </div>
          <Link href="/login" className="text-sm w-fit" style={{ color: m.blue }}>
            Already verified? Sign in &rarr;
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16"
      style={marketingPageMain}
    >
      <div className="max-w-xl mx-auto w-full flex flex-col gap-8">

        {step === 1 && qStep === 1 && (
          <Link href="/" className="text-sm w-fit" style={{ color: m.subtext }}>
            &larr; Back to home
          </Link>
        )}
        {step === 1 && qStep > 1 && (
          <button
            type="button"
            onClick={() => { setError(""); setQStep((prev) => (prev - 1) as 1 | 2 | 3 | 4); }}
            className="text-sm w-fit cursor-pointer"
            style={{ color: m.subtext, background: "none", border: "none", padding: 0 }}
          >
            &larr; Back
          </button>
        )}

        <OnboardingProgress step={step === 1 ? 1 : 2} />

        {step === 1 ? (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: m.blue }}>
                Step {qStep} of 4 — {Q_STEP_TITLES[qStep - 1]}
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {qStep === 1 && "Let's start with the basics."}
                {qStep === 2 && "Tell us what happened."}
                {qStep === 3 && "What evidence do you have?"}
                {qStep === 4 && "What have they said?"}
              </h1>
            </div>

            <form onSubmit={handleQNext} className="flex flex-col gap-5">

              {qStep === 1 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      Who owes you money?
                    </label>
                    <input
                      type="text"
                      value={intakeData.whoOwes}
                      onChange={(e) => set("whoOwes", e.target.value)}
                      placeholder="Person or business name"
                      className="w-full rounded-lg px-4 py-3.5 text-base sm:text-sm outline-none min-h-12"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      Approximate amount owed ($)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={intakeData.amountOwed}
                      onChange={(e) => set("amountOwed", e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full rounded-lg px-4 py-3.5 text-base sm:text-sm outline-none min-h-12"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      Which province are you in?
                    </label>
                    <select
                      value={intakeData.province}
                      onChange={(e) => set("province", e.target.value)}
                      className="w-full rounded-lg px-4 py-3.5 text-base sm:text-sm outline-none appearance-none cursor-pointer min-h-12"
                      style={{ ...inputStyle, color: intakeData.province ? m.text : m.subtext }}
                    >
                      <option value="" disabled>Select your province</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      What type of dispute is this?
                    </label>
                    <select
                      value={intakeData.disputeType}
                      onChange={(e) => set("disputeType", e.target.value)}
                      className="w-full rounded-lg px-4 py-3.5 text-base sm:text-sm outline-none appearance-none cursor-pointer min-h-12"
                      style={{ ...inputStyle, color: intakeData.disputeType ? m.text : m.subtext }}
                    >
                      <option value="" disabled>Select dispute type</option>
                      {DISPUTE_TYPES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {qStep === 2 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      Describe what happened in your own words
                    </label>
                    <textarea
                      value={intakeData.whatHappened}
                      onChange={(e) => set("whatHappened", e.target.value)}
                      rows={7}
                      placeholder="Tell us what happened. The more detail you give, the better your assessment will be..."
                      className="w-full rounded-xl px-4 py-4 text-base sm:text-sm leading-relaxed resize-none outline-none min-h-[10rem]"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
                    />
                    <p
                      className="text-xs"
                      style={{
                        color: wordCount(intakeData.whatHappened) >= 50 ? "#10B981" : m.subtext,
                      }}
                    >
                      {wordCount(intakeData.whatHappened)} words
                      {wordCount(intakeData.whatHappened) < 50 && " (50 required)"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      When did this happen?
                    </label>
                    <input
                      type="text"
                      value={intakeData.whenHappened}
                      onChange={(e) => set("whenHappened", e.target.value)}
                      placeholder="e.g. March 2025 or about 6 months ago"
                      className="w-full rounded-lg px-4 py-3.5 text-base sm:text-sm outline-none min-h-12"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      Did you have a written agreement or contract?
                    </label>
                    <OptionPills
                      options={["Yes", "No", "Verbal only"]}
                      value={intakeData.hadContract}
                      onChange={(v) => set("hadContract", v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      What was supposed to happen that didn&apos;t?{" "}
                      <span style={{ color: m.subtext }}>(optional)</span>
                    </label>
                    <textarea
                      value={intakeData.whatWasSupposed}
                      onChange={(e) => set("whatWasSupposed", e.target.value)}
                      rows={3}
                      placeholder="e.g. They were supposed to complete the renovation by April..."
                      className="w-full rounded-xl px-4 py-3.5 text-base sm:text-sm leading-relaxed resize-none outline-none"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
                    />
                  </div>
                </>
              )}

              {qStep === 3 && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      Do you have any of the following? (check all that apply)
                    </label>
                    <div className="flex flex-col gap-3">
                      {EVIDENCE_OPTIONS.map((item) => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={intakeData.evidence.includes(item)}
                            onChange={(e) => {
                              if (item === "None of the above") {
                                set("evidence", e.target.checked ? ["None of the above"] : []);
                              } else {
                                const next = e.target.checked
                                  ? [...intakeData.evidence.filter((i) => i !== "None of the above"), item]
                                  : intakeData.evidence.filter((i) => i !== item);
                                set("evidence", next);
                              }
                            }}
                            className="w-4 h-4 cursor-pointer flex-shrink-0"
                            style={{ accentColor: m.blue }}
                          />
                          <span className="text-sm" style={{ color: m.text }}>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      Have you already tried to resolve this?
                    </label>
                    <OptionPills
                      options={["Yes", "No"]}
                      value={intakeData.triedToResolve}
                      onChange={(v) => set("triedToResolve", v)}
                    />
                  </div>
                  {intakeData.triedToResolve === "Yes" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium" style={{ color: m.text }}>
                        What happened when you tried?{" "}
                        <span style={{ color: m.subtext }}>(optional)</span>
                      </label>
                      <textarea
                        value={intakeData.resolveAttemptDetails}
                        onChange={(e) => set("resolveAttemptDetails", e.target.value)}
                        rows={3}
                        placeholder="e.g. I emailed them twice and they ignored me..."
                        className="w-full rounded-xl px-4 py-3.5 text-base sm:text-sm leading-relaxed resize-none outline-none"
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
                      />
                    </div>
                  )}

                  {/* File upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      Upload your evidence{" "}
                      <span style={{ color: m.subtext }}>(optional)</span>
                    </label>
                    <div
                      className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
                      style={{
                        borderColor: dragOver ? m.blue : m.border,
                        background: dragOver ? "rgba(200,57,43,0.04)" : m.white,
                      }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        addFiles(Array.from(e.dataTransfer.files));
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf,.txt"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            addFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                      />
                      <p className="text-sm" style={{ color: m.subtext }}>
                        Drag files here or{" "}
                        <span style={{ color: m.blue }}>click to browse</span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: m.muted }}>
                        JPG, PNG, PDF, TXT · Max 5MB each · Up to 10 files
                      </p>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <ul className="flex flex-col gap-1.5">
                        {uploadedFiles.map((file, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm"
                            style={{ background: m.surface, border: `1px solid ${m.border}` }}
                          >
                            <span className="truncate" style={{ color: m.text }}>{file.name}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                              className="shrink-0 text-xs cursor-pointer hover:opacity-70"
                              style={{ color: m.subtext }}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}

              {qStep === 4 && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      Have they given any reason for not paying or delivering?
                    </label>
                    <OptionPills
                      options={["Yes", "No"]}
                      value={intakeData.theirReason}
                      onChange={(v) => set("theirReason", v)}
                    />
                  </div>
                  {intakeData.theirReason === "Yes" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium" style={{ color: m.text }}>
                        What reason did they give?{" "}
                        <span style={{ color: m.subtext }}>(optional)</span>
                      </label>
                      <textarea
                        value={intakeData.theirReasonDetails}
                        onChange={(e) => set("theirReasonDetails", e.target.value)}
                        rows={3}
                        placeholder="e.g. They said the work wasn't up to their standards..."
                        className="w-full rounded-xl px-4 py-3.5 text-base sm:text-sm leading-relaxed resize-none outline-none"
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: m.text }}>
                      Have they responded to any of your attempts to contact them?
                    </label>
                    <OptionPills
                      options={["Yes", "No", "Never contacted them"]}
                      value={intakeData.theirResponse}
                      onChange={(v) => set("theirResponse", v)}
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="text-sm" style={{ color: m.blue }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-12 rounded-full px-6 py-4 text-base sm:text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                style={marketingBtnPrimary}
              >
                {loading && <Spinner />}
                {loading
                  ? "Continuing…"
                  : qStep < 4
                    ? "Next →"
                    : "See My Assessment →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Create a free account to save your assessment
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
                Your case details are saved. Create an account so your assessment
                and next steps stay in your dashboard.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full min-h-12 rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-3"
              style={{ ...marketingBtnSecondary, background: m.white }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="text-sm text-center" style={{ color: m.subtext }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setAuthMode("signin"); setError(""); }}
                className="font-semibold cursor-pointer hover:opacity-70"
                style={{ color: m.blue, background: "none", border: "none", padding: 0 }}
              >
                Sign in →
              </button>
            </p>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: m.border }} />
              <span className="text-xs" style={{ color: m.subtext }}>or</span>
              <div className="flex-1 h-px" style={{ background: m.border }} />
            </div>

            <div
              className="flex rounded-lg p-1 gap-1"
              style={{ ...marketingCard, padding: "4px" }}
            >
              <button
                type="button"
                onClick={() => { setAuthMode("signup"); setError(""); }}
                className="flex-1 rounded-md px-3 py-2.5 min-h-10 text-xs font-semibold cursor-pointer"
                style={{
                  background: authMode === "signup" ? m.blue : "transparent",
                  color: authMode === "signup" ? m.white : m.subtext,
                }}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("signin"); setError(""); }}
                className="flex-1 rounded-md px-3 py-2.5 min-h-10 text-xs font-semibold cursor-pointer"
                style={{
                  background: authMode === "signin" ? m.blue : "transparent",
                  color: authMode === "signin" ? m.white : m.subtext,
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
                className="w-full rounded-lg px-4 py-3.5 text-base sm:text-sm outline-none min-h-12"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
                onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={authMode === "signup" ? "Password (min. 8 characters)" : "Password"}
                autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                className="w-full rounded-lg px-4 py-3.5 text-base sm:text-sm outline-none min-h-12"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
                onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
              />
              {authMode === "signup" && (
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="w-full rounded-lg px-4 py-3.5 text-base sm:text-sm outline-none min-h-12"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = m.blue)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = m.border)}
                />
              )}
              {error && (
                <p className="text-sm" style={{ color: m.blue }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-12 rounded-full px-6 py-4 text-base sm:text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                style={marketingBtnPrimary}
              >
                {loading && <Spinner />}
                {loading
                  ? authMode === "signup" ? "Creating account…" : "Signing in…"
                  : authMode === "signup" ? "Create Account & Continue" : "Sign In & Continue"}
              </button>
            </form>

            <p className="text-xs text-center leading-relaxed" style={{ color: m.muted }}>
              By continuing you agree to our{" "}
              <Link href="/terms" className="underline">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
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
