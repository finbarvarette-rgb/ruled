"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startCheckout } from "@/lib/checkout";
import {
  readRuledSession,
  updateRuledSession,
  sessionIsValid,
  type RuledSession,
} from "@/lib/session";
import { downloadTextFile } from "@/lib/download";
import { Spinner } from "@/components/Spinner";

const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Nova Scotia",
  "Ontario",
  "Quebec",
  "Saskatchewan",
];

const inputClass =
  "w-full rounded-lg px-4 py-3 text-sm outline-none transition";
const inputStyle = {
  background: "#1a1916",
  color: "#f5f1eb",
  border: "1px solid #2a2825",
};

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#c8392b";
}

function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#2a2825";
}

export default function DemandPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<RuledSession | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [senderName, setSenderName] = useState("");
  const [senderBusiness, setSenderBusiness] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [defendantName, setDefendantName] = useState("");
  const [defendantAddress, setDefendantAddress] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [disputeDate, setDisputeDate] = useState("");
  const [province, setProvince] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [letter, setLetter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const s = readRuledSession();
    if (!sessionIsValid(s)) {
      setSessionExpired(true);
      setMounted(true);
      return;
    }
    setSession(s);
    if (s.province) setProvince(s.province);
    if (s.email) setSenderEmail(s.email);
    if (s.demandLetter) setLetter(s.demandLetter);
    setMounted(true);
  }, []);

  async function handleFullPackCheckout() {
    if (!session) return;
    setCheckoutLoading(true);
    try {
      await startCheckout("full", session.caseId, session.email ?? senderEmail);
    } catch {
      setError("Could not start checkout. Please try again.");
      setCheckoutLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.assessment) return;
    setError("");
    setLoading(true);
    setLetter(null);

    try {
      const res = await fetch("/api/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          senderBusiness: senderBusiness || undefined,
          senderEmail,
          defendantName,
          defendantAddress,
          claimAmount,
          disputeDate,
          province,
          caseAssessment: session.assessment,
          caseId: session.caseId,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      setLetter(data.letter);
      updateRuledSession({ demandLetter: data.letter, email: senderEmail });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!letter) return;
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  if (!mounted) return null;

  if (sessionExpired) {
    return (
      <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-16 items-center justify-center">
        <div className="max-w-md text-center flex flex-col gap-6">
          <p className="text-lg font-semibold">
            Your session expired. Please run a new assessment.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg px-6 py-3 text-sm font-semibold cursor-pointer"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Back to home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16 overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 md:gap-10 min-w-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/results")}
            className="text-sm transition-colors cursor-pointer"
            style={{ color: "#9a9590" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f5f1eb")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9590")}
          >
            &larr; Back to assessment
          </button>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Ruled<span style={{ color: "#c8392b" }}>.</span>
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Generate Your Demand Letter
        </h1>

        {!letter ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Your Full Name" required>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </Field>

            <Field label="Your Business Name">
              <input
                type="text"
                value={senderBusiness}
                onChange={(e) => setSenderBusiness(e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </Field>

            <Field label="Your Email" required>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </Field>

            <Field label="Defendant Full Name" required>
              <input
                type="text"
                required
                value={defendantName}
                onChange={(e) => setDefendantName(e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </Field>

            <Field label="Defendant Address" required>
              <input
                type="text"
                required
                value={defendantAddress}
                onChange={(e) => setDefendantAddress(e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </Field>

            <Field label="Claim Amount" required>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </Field>

            <Field label="Date of Last Payment or Chargeback" required>
              <input
                type="date"
                required
                value={disputeDate}
                onChange={(e) => setDisputeDate(e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </Field>

            <Field label="Province" required>
              <select
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer`}
                style={{
                  ...inputStyle,
                  color: province ? "#f5f1eb" : "#9a9590",
                }}
                onFocus={focusInput}
                onBlur={blurInput}
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
            </Field>

            {error && (
              <p className="text-sm" style={{ color: "#c8392b" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-6 py-4 text-sm font-semibold transition-opacity disabled:opacity-60 cursor-pointer mt-2 flex items-center justify-center gap-2"
              style={{ background: "#c8392b", color: "#f5f1eb" }}
            >
              {loading && <Spinner />}
              {loading ? "Drafting your letter..." : "Generate My Demand Letter"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-6">
            <div
              className="rounded-xl px-8 py-8 text-left whitespace-pre-wrap leading-relaxed text-sm"
              style={{
                background: "#ffffff",
                color: "#0f0e0c",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              {letter}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer"
                style={{
                  background: "#1a1916",
                  color: "#f5f1eb",
                  border: "1px solid #2a2825",
                }}
              >
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile("ruled-demand-letter.txt", letter)
                }
                className="flex-1 rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer"
                style={{
                  background: "#1a1916",
                  color: "#f5f1eb",
                  border: "1px solid #2a2825",
                }}
              >
                Download as Text File
              </button>
            </div>

            <button
              type="button"
              disabled={checkoutLoading}
              onClick={handleFullPackCheckout}
              className="w-full rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: "#c8392b", color: "#f5f1eb" }}
            >
              {checkoutLoading
                ? "Redirecting…"
                : "Get Full Case Pack — $199"}
            </button>

            <button
              type="button"
              onClick={() => setLetter(null)}
              className="text-sm cursor-pointer self-start"
              style={{ color: "#9a9590" }}
            >
              &larr; Edit details and regenerate
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm" style={{ color: "#9a9590" }}>
        {label}
        {required ? (
          <span style={{ color: "#c8392b" }}> *</span>
        ) : (
          <span style={{ color: "#6b6560" }}> (optional)</span>
        )}
      </span>
      {children}
    </label>
  );
}
