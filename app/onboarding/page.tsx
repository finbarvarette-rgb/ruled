"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Spinner } from "@/components/Spinner";
import {
  PROVINCES,
  ONBOARDING_INTAKE_KEY,
  ONBOARDING_PROVINCE_KEY,
  ONBOARDING_EMAIL_KEY,
} from "@/lib/constants";

const NAVY = "#0A0F1E";
const CARD = "#151C2E";
const CARD2 = "#0D1220";
const GOLD = "#D4A853";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(212,168,83,0.25)";
const MUTED = "rgba(255,255,255,0.5)";
const WHITE = "#FFFFFF";
const GREEN = "#10B981";
const RED = "#C8392B";
const PF = "'Playfair Display', Georgia, serif";

const inputStyle = {
  background: CARD2,
  color: WHITE,
  border: `1px solid ${BORDER}`,
} as const;

const btnPrimary = {
  background: GOLD,
  color: NAVY,
} as const;

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
            background: value === opt ? GOLD : "transparent",
            color: value === opt ? NAVY : MUTED,
            border: `1.5px solid ${value === opt ? GOLD : BORDER_GOLD}`,
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
        const signedIn = await checkSignedIn();
        const storedIntake = sessionStorage.getItem(ONBOARDING_INTAKE_KEY);
        const storedProvince = sessionStorage.getItem(ONBOARDING_PROVINCE_KEY);

        if (signedIn) {
          if (storedIntake?.trim() && storedProvince) {
            proceedToProcessing();
          } else {
            router.replace("/dashboard");
          }
          return;
        }

        if (!storedIntake?.trim() || !storedProvince) {
          router.replace("/onboarding");
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
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter your password."); return; }
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
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
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
      <main style={{ background: NAVY, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner className="w-10 h-10" />
      </main>
    );
  }

  if (needsVerification) {
    return (
      <main style={{ background: NAVY, color: WHITE, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ maxWidth: 520, width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
          <h1 style={{ fontFamily: PF, fontSize: 28, fontWeight: 700, color: WHITE }}>
            Check your inbox
          </h1>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7 }}>
            We sent a verification link to{" "}
            <span style={{ color: WHITE }}>{email}</span>. Click it to verify
            your account and see your case assessment.
          </p>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7 }}>
            Your case details have been saved — they will be waiting when you come back.
          </p>
          <Link href="/login" style={{ fontSize: 13, color: GOLD, textDecoration: "none" }}>
            Already verified? Sign in &rarr;
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: NAVY, color: WHITE, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Back navigation */}
        {step === 1 && qStep === 1 && (
          <Link href="/" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>
            &larr; Back to home
          </Link>
        )}
        {step === 1 && qStep > 1 && (
          <button
            type="button"
            onClick={() => { setError(""); setQStep((prev) => (prev - 1) as 1 | 2 | 3 | 4); }}
            style={{ fontSize: 13, color: MUTED, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
          >
            &larr; Back
          </button>
        )}

        {step === 1 ? (
          <>
            {/* Step indicator */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Progress dots */}
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    style={{
                      width: s === qStep ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: s <= qStep ? GOLD : BORDER,
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: GOLD }}>
                Step {qStep} of 4 — {Q_STEP_TITLES[qStep - 1]}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h1 style={{ fontFamily: PF, fontSize: 28, fontWeight: 700, color: WHITE, margin: 0 }}>
                {qStep === 1 && "Let's start with the basics."}
                {qStep === 2 && "Tell us what happened."}
                {qStep === 3 && "What evidence do you have?"}
                {qStep === 4 && "What have they said?"}
              </h1>
            </div>

            <form onSubmit={handleQNext} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {qStep === 1 && (
                <>
                  <Field label="Who owes you money?">
                    <input
                      type="text"
                      value={intakeData.whoOwes}
                      onChange={(e) => set("whoOwes", e.target.value)}
                      placeholder="Person or business name"
                      style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                    />
                  </Field>
                  <Field label="Approximate amount owed ($)">
                    <input
                      type="number"
                      min="1"
                      value={intakeData.amountOwed}
                      onChange={(e) => set("amountOwed", e.target.value)}
                      placeholder="e.g. 2500"
                      style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                    />
                  </Field>
                  <Field label="Which province are you in?">
                    <select
                      value={intakeData.province}
                      onChange={(e) => set("province", e.target.value)}
                      style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", appearance: "none", cursor: "pointer", width: "100%", color: intakeData.province ? WHITE : MUTED }}
                    >
                      <option value="" disabled style={{ background: CARD2 }}>Select your province</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p} style={{ background: CARD2 }}>{p}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="What type of dispute is this?">
                    <select
                      value={intakeData.disputeType}
                      onChange={(e) => set("disputeType", e.target.value)}
                      style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", appearance: "none", cursor: "pointer", width: "100%", color: intakeData.disputeType ? WHITE : MUTED }}
                    >
                      <option value="" disabled style={{ background: CARD2 }}>Select dispute type</option>
                      {DISPUTE_TYPES.map((d) => (
                        <option key={d} value={d} style={{ background: CARD2 }}>{d}</option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              {qStep === 2 && (
                <>
                  <Field label="Describe what happened in your own words">
                    <textarea
                      value={intakeData.whatHappened}
                      onChange={(e) => set("whatHappened", e.target.value)}
                      rows={7}
                      placeholder="Tell us what happened. The more detail you give, the better your assessment will be..."
                      style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", resize: "none", width: "100%" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                    />
                    <p style={{ fontSize: 12, color: wordCount(intakeData.whatHappened) >= 50 ? GREEN : MUTED }}>
                      {wordCount(intakeData.whatHappened)} words
                      {wordCount(intakeData.whatHappened) < 50 && " (50 required)"}
                    </p>
                  </Field>
                  <Field label="When did this happen?">
                    <input
                      type="text"
                      value={intakeData.whenHappened}
                      onChange={(e) => set("whenHappened", e.target.value)}
                      placeholder="e.g. March 2025 or about 6 months ago"
                      style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                    />
                  </Field>
                  <Field label="Did you have a written agreement or contract?">
                    <OptionPills options={["Yes", "No", "Verbal only"]} value={intakeData.hadContract} onChange={(v) => set("hadContract", v)} />
                  </Field>
                  <Field label={<>What was supposed to happen that didn&apos;t? <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span></>}>
                    <textarea
                      value={intakeData.whatWasSupposed}
                      onChange={(e) => set("whatWasSupposed", e.target.value)}
                      rows={3}
                      placeholder="e.g. They were supposed to complete the renovation by April..."
                      style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", resize: "none", width: "100%" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                    />
                  </Field>
                </>
              )}

              {qStep === 3 && (
                <>
                  <Field label="Do you have any of the following? (check all that apply)">
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {EVIDENCE_OPTIONS.map((item) => (
                        <label key={item} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
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
                            style={{ width: 16, height: 16, cursor: "pointer", accentColor: GOLD, flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 14, color: WHITE }}>{item}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                  <Field label="Have you already tried to resolve this?">
                    <OptionPills options={["Yes", "No"]} value={intakeData.triedToResolve} onChange={(v) => set("triedToResolve", v)} />
                  </Field>
                  {intakeData.triedToResolve === "Yes" && (
                    <Field label={<>What happened when you tried? <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span></>}>
                      <textarea
                        value={intakeData.resolveAttemptDetails}
                        onChange={(e) => set("resolveAttemptDetails", e.target.value)}
                        rows={3}
                        placeholder="e.g. I emailed them twice and they ignored me..."
                        style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", resize: "none", width: "100%" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                      />
                    </Field>
                  )}

                  {/* File upload */}
                  <Field label={<>Upload your evidence <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span></>}>
                    <div
                      style={{
                        border: `2px dashed ${dragOver ? GOLD : BORDER_GOLD}`,
                        borderRadius: 12,
                        padding: "24px",
                        textAlign: "center",
                        cursor: "pointer",
                        background: dragOver ? "rgba(212,168,83,0.05)" : "rgba(212,168,83,0.04)",
                        transition: "all 0.2s",
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
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files) {
                            addFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                      />
                      <p style={{ fontSize: 13, color: MUTED }}>
                        Drag files here or{" "}
                        <span style={{ color: GOLD }}>click to browse</span>
                      </p>
                      <p style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
                        JPG, PNG, PDF, TXT · Max 5MB each · Up to 10 files
                      </p>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <ul style={{ display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0 }}>
                        {uploadedFiles.map((file, i) => (
                          <li
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                              borderRadius: 8,
                              padding: "10px 14px",
                              fontSize: 13,
                              background: CARD,
                              border: `1px solid ${BORDER}`,
                            }}
                          >
                            <span style={{ color: WHITE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                              style={{ fontSize: 12, color: MUTED, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Field>
                </>
              )}

              {qStep === 4 && (
                <>
                  <Field label="Have they given any reason for not paying or delivering?">
                    <OptionPills options={["Yes", "No"]} value={intakeData.theirReason} onChange={(v) => set("theirReason", v)} />
                  </Field>
                  {intakeData.theirReason === "Yes" && (
                    <Field label={<>What reason did they give? <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span></>}>
                      <textarea
                        value={intakeData.theirReasonDetails}
                        onChange={(e) => set("theirReasonDetails", e.target.value)}
                        rows={3}
                        placeholder="e.g. They said the work wasn't up to their standards..."
                        style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", resize: "none", width: "100%" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                      />
                    </Field>
                  )}
                  <Field label="Have they responded to any of your attempts to contact them?">
                    <OptionPills options={["Yes", "No", "Never contacted them"]} value={intakeData.theirResponse} onChange={(v) => set("theirResponse", v)} />
                  </Field>
                </>
              )}

              {error && (
                <p style={{ fontSize: 13, color: RED }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...btnPrimary,
                  border: "none",
                  borderRadius: 8,
                  padding: "14px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                  width: "100%",
                }}
              >
                {loading && <Spinner />}
                {loading ? "Continuing…" : qStep < 4 ? "Next →" : "See My Assessment →"}
              </button>
            </form>
          </>
        ) : (
          /* Step 2 — Account creation */
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: GOLD }}>
                Step 2 of 2 — Create Account
              </p>
              <h1 style={{ fontFamily: PF, fontSize: 28, fontWeight: 700, color: WHITE, margin: 0 }}>
                Create a free account to save your assessment
              </h1>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: 0 }}>
                Your case details are saved. Create an account so your assessment and next steps stay in your dashboard.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              style={{
                background: WHITE,
                color: "#0F172A",
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: "13px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                opacity: loading ? 0.7 : 1,
                width: "100%",
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p style={{ fontSize: 13, textAlign: "center", color: MUTED }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setAuthMode("signin"); setError(""); }}
                style={{ color: GOLD, background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
              >
                Sign in →
              </button>
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
              <span style={{ fontSize: 12, color: MUTED }}>or</span>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
            </div>

            {/* Tab toggle */}
            <div style={{ display: "flex", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 4, gap: 4 }}>
              {(["signup", "signin"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setAuthMode(mode); setError(""); }}
                  style={{
                    flex: 1,
                    borderRadius: 6,
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    background: authMode === mode ? GOLD : "transparent",
                    color: authMode === mode ? NAVY : MUTED,
                    transition: "all 0.2s",
                  }}
                >
                  {mode === "signup" ? "Create account" : "Sign in"}
                </button>
              ))}
            </div>

            <form
              onSubmit={authMode === "signup" ? handleSignUp : handleSignIn}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={authMode === "signup" ? "Password (min. 8 characters)" : "Password"}
                autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
              />
              {authMode === "signup" && (
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  style={{ ...inputStyle, borderRadius: 8, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                />
              )}
              {error && (
                <p style={{ fontSize: 13, color: RED }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...btnPrimary,
                  border: "none",
                  borderRadius: 8,
                  padding: "14px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                  width: "100%",
                  marginTop: 4,
                }}
              >
                {loading && <Spinner />}
                {loading
                  ? authMode === "signup" ? "Creating account…" : "Signing in…"
                  : authMode === "signup" ? "Create Account & Continue" : "Sign In & Continue"}
              </button>
            </form>

            <p style={{ fontSize: 12, textAlign: "center", color: MUTED, lineHeight: 1.6 }}>
              By continuing you agree to our{" "}
              <Link href="/terms" style={{ color: MUTED, textDecoration: "underline" }}>Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" style={{ color: MUTED, textDecoration: "underline" }}>Privacy Policy</Link>.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: WHITE }}>{label}</label>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main style={{ background: NAVY, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner className="w-10 h-10" />
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
