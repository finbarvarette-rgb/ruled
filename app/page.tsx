"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function Home() {
  const router = useRouter();
  const [intake, setIntake] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!intake.trim() || !province) {
      setError("Please describe your situation and select your province.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake, province }),
      });

      if (!res.ok) throw new Error("Assessment failed");

      const data = await res.json();
      sessionStorage.setItem(
        "ruled_assessment",
        JSON.stringify({ assessment: data.assessment, province, intake })
      );
      router.push("/results");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-12">
        {/* Logo */}
        <div>
          <span
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Ruled
            <span style={{ color: "#c8392b" }}>.</span>
          </span>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
            Someone owes you money.
            <br />
            We&apos;ll help you get it back.
          </h1>
          <p style={{ color: "#9a9590" }} className="text-lg leading-relaxed">
            AI-powered small claims court preparation. No lawyer required.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <textarea
            value={intake}
            onChange={(e) => setIntake(e.target.value)}
            rows={6}
            placeholder="Describe what happened in plain language. Who owes you money, how much, and why."
            className="w-full rounded-lg px-4 py-3 text-base leading-relaxed resize-none outline-none transition focus:ring-2"
            style={{
              background: "#1a1916",
              color: "#f5f1eb",
              border: "1px solid #2a2825",
              caretColor: "#c8392b",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#c8392b";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(200,57,43,0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#2a2825";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-base outline-none appearance-none cursor-pointer"
            style={{
              background: "#1a1916",
              color: province ? "#f5f1eb" : "#9a9590",
              border: "1px solid #2a2825",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#c8392b";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(200,57,43,0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#2a2825";
              e.currentTarget.style.boxShadow = "none";
            }}
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
            className="w-full rounded-lg px-6 py-4 text-base font-semibold transition-opacity disabled:opacity-60 cursor-pointer"
            style={{
              background: "#f5f1eb",
              color: "#0f0e0c",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#e8e4de";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f5f1eb";
            }}
          >
            {loading ? "Assessing your case…" : "Assess My Case"}
          </button>

          <p className="text-center text-sm" style={{ color: "#9a9590" }}>
            Used by Canadians to recover thousands in unpaid debts, deposits, and
            invoices.
          </p>
        </form>
      </div>
    </main>
  );
}
