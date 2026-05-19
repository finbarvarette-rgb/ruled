"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WaitlistPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Failed");

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-md mx-auto w-full flex flex-col gap-10 items-center text-center">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="self-start text-sm transition-colors cursor-pointer"
          style={{ color: "#9a9590" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f5f1eb")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9590")}
        >
          &larr; Home
        </button>

        <span
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          ruled<span style={{ color: "#c8392b" }}>.ca</span>
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Full Case Pack Coming Soon
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            Enter your email and we&apos;ll notify you the moment it&apos;s
            live.
          </p>
        </div>

        {submitted ? (
          <p className="text-sm" style={{ color: "#c8392b" }}>
            You&apos;re on the list. We&apos;ll be in touch soon.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-4"
          >
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
              <p className="text-sm" style={{ color: "#c8392b" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-6 py-4 text-sm font-semibold transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ background: "#c8392b", color: "#f5f1eb" }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {loading ? "Joining…" : "Notify Me"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
