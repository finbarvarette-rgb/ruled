"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readRuledSession } from "@/lib/session";
import { startCheckout } from "@/lib/checkout";
import { Spinner } from "@/components/Spinner";
import Link from "next/link";

const EXAMPLE_LETTER = `[Your Name]
[Your Address]
[City, Province, Postal Code]
[Date]

To: [Defendant Name]
    [Defendant Address]

RE: FORMAL DEMAND FOR PAYMENT — $[Amount]

Dear [Defendant Name],

I am writing to formally demand payment of $[Amount] owed to me arising from [brief description of dispute], which occurred on [date].

Despite my previous attempts to resolve this matter informally, you have failed to provide satisfactory remedy. This letter constitutes formal notice that if payment is not received within 14 days of this letter's date, I intend to file a claim in the Ontario Small Claims Court for the full amount owed, plus court filing fees and any applicable interest.

DETAILS OF CLAIM:
— Incident date: [Date]
— Amount owed: $[Amount]
— Basis of claim: [Legal basis]

Please remit payment by [date 14 days out] to avoid legal proceedings.

Sincerely,
[Your Name]`;

export default function DemandPreviewPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const s = readRuledSession();
    if (!s.assessment) {
      router.replace("/");
      return;
    }
    setCaseId(s.caseId);
    setEmail(s.email);
    setMounted(true);
  }, [router]);

  async function handleCheckout() {
    setError("");
    setLoading(true);
    try {
      await startCheckout("demand", caseId, email ?? undefined);
    } catch {
      setError("Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16 overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-10 min-w-0">

        {/* Back */}
        <Link
          href="/results"
          className="text-sm transition-colors w-fit"
          style={{ color: "#9a9590" }}
        >
          &larr; Back to assessment
        </Link>

        {/* Headline */}
        <div className="flex flex-col gap-4">
          <div
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: "#c8392b" }}
          >
            Demand Letter — $49
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Make them take you seriously.
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#9a9590" }}>
            A professionally drafted demand letter puts the other party on notice — legally and formally. Most disputes settle after receiving one.
          </p>
        </div>

        {/* What you get */}
        <div
          className="rounded-xl px-6 py-6 flex flex-col gap-4"
          style={{ background: "#1a1916", border: "1px solid #2a2825" }}
        >
          <h2 className="text-base font-semibold">What&apos;s included</h2>
          <div className="flex flex-col gap-3">
            {[
              ["Personalized to your case", "Written specifically for your situation, province, and claim amount — not a generic template."],
              ["Legally grounded", "Cites the applicable consumer protection or contract law for your province."],
              ["14-day payment demand", "Sets a clear deadline and explicitly states your intent to file in small claims court."],
              ["Ready to send", "Download as a text file, copy, and send by email or registered mail."],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-3">
                <span style={{ color: "#c8392b" }} className="mt-0.5 shrink-0">✓</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f5f1eb" }}>{title}</p>
                  <p className="text-sm mt-0.5" style={{ color: "#9a9590" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Example letter</h2>
          <p className="text-sm" style={{ color: "#9a9590" }}>
            Your letter will look like this — filled in with your specific details.
          </p>
          <div
            className="rounded-xl px-6 py-6 text-sm leading-relaxed whitespace-pre-wrap relative overflow-hidden"
            style={{
              background: "#ffffff",
              color: "#1a1916",
              fontFamily: "Georgia, 'Times New Roman', serif",
              lineHeight: "1.8",
            }}
          >
            {EXAMPLE_LETTER}
            {/* Fade at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-24"
              style={{
                background: "linear-gradient(to bottom, transparent, #ffffff)",
              }}
            />
          </div>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            ["$2.4M+", "in claims filed by users"],
            ["4.8 / 5", "average user rating"],
            ["14 days", "average resolution time"],
          ].map(([stat, label]) => (
            <div
              key={stat}
              className="rounded-xl px-4 py-5 flex flex-col gap-1"
              style={{ background: "#1a1916", border: "1px solid #2a2825" }}
            >
              <span className="text-xl font-bold" style={{ color: "#c8392b" }}>{stat}</span>
              <span className="text-xs" style={{ color: "#9a9590" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          {error && (
            <p className="text-sm" style={{ color: "#c8392b" }}>{error}</p>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={handleCheckout}
            className="w-full rounded-xl px-6 py-5 text-base font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-3"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            {loading && <Spinner />}
            {loading ? "Redirecting to checkout…" : "Get My Demand Letter — $49"}
          </button>
          <p className="text-xs text-center" style={{ color: "#6b6560" }}>
            Secure checkout. Instant access. 100% money-back if not satisfied.
          </p>
        </div>

        {/* Also offer full pack */}
        <div
          className="rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
          style={{ background: "#1a1916", border: "1px solid #2a2825" }}
        >
          <div>
            <p className="text-sm font-semibold">Want everything?</p>
            <p className="text-sm mt-0.5" style={{ color: "#9a9590" }}>
              The Full Case Pack includes your demand letter, court filing guide, hearing prep, and unlimited Q&A — all for $199.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              try { await startCheckout("full", caseId, email ?? undefined); }
              catch { setLoading(false); }
            }}
            className="shrink-0 rounded-lg px-5 py-3 text-sm font-semibold cursor-pointer whitespace-nowrap"
            style={{ border: "1px solid #c8392b", color: "#c8392b", background: "transparent" }}
          >
            Full Case Pack — $199
          </button>
        </div>

      </div>
    </main>
  );
}
