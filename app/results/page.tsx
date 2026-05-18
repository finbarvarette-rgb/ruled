"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SECTION_HEADERS = [
  "CASE STRENGTH",
  "LEGAL BASIS",
  "KEY EVIDENCE IN YOUR FAVOUR",
  "WEAKNESSES",
  "WHAT THE OTHER SIDE WILL ARGUE",
  "RECOMMENDED NEXT STEP",
  "ESTIMATED CLAIM AMOUNT",
  "PROVINCE RULES",
];

type Section = {
  header: string;
  content: string;
};

// Inline markdown: **bold**, *italic*
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} style={{ color: "#f5f1eb", fontWeight: 600 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// Block markdown: headings, bullets, paragraphs
function MarkdownBlock({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  const pendingList: string[] = [];
  let k = 0;

  function flushList() {
    if (pendingList.length === 0) return;
    elements.push(
      <ul key={k++} className="flex flex-col gap-1.5">
        {pendingList.map((item, i) => (
          <li key={i} className="flex gap-2 items-start">
            <span className="mt-1 shrink-0 text-xs" style={{ color: "#c8392b" }}>
              &bull;
            </span>
            <span className="leading-relaxed" style={{ color: "#d4cfc9" }}>
              <InlineText text={item} />
            </span>
          </li>
        ))}
      </ul>
    );
    pendingList.length = 0;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); continue; }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const headText = headingMatch[2];
      elements.push(
        <p
          key={k++}
          className={level <= 2 ? "text-sm font-semibold mt-2" : "text-sm font-medium mt-1"}
          style={{ color: "#f5f1eb" }}
        >
          <InlineText text={headText} />
        </p>
      );
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) { pendingList.push(bulletMatch[1]); continue; }

    flushList();
    elements.push(
      <p key={k++} className="leading-relaxed" style={{ color: "#d4cfc9" }}>
        <InlineText text={trimmed} />
      </p>
    );
  }

  flushList();
  return <div className="flex flex-col gap-2">{elements}</div>;
}

function parseAssessment(text: string): Section[] {
  if (!text) return [];
  const sections: Section[] = [];
  for (let i = 0; i < SECTION_HEADERS.length; i++) {
    const header = SECTION_HEADERS[i];
    const nextHeader = SECTION_HEADERS[i + 1];
    const startIdx = text.indexOf(header);
    if (startIdx === -1) continue;
    const contentStart = startIdx + header.length;
    const contentEnd = nextHeader ? text.indexOf(nextHeader) : text.length;
    const content = text
      .slice(contentStart, contentEnd === -1 ? text.length : contentEnd)
      .trim();
    sections.push({ header, content });
  }
  if (sections.length === 0) {
    sections.push({ header: "Assessment", content: text });
  }
  return sections;
}

function readAssessmentFromSession(): string {
  const stored = sessionStorage.getItem("ruled_assessment");
  if (!stored) return "";
  try {
    return JSON.parse(stored).assessment ?? "";
  } catch {
    return "";
  }
}

export default function ResultsPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [rawText, setRawText] = useState("");
  const sections = useMemo(() => parseAssessment(rawText), [rawText]);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);

  useEffect(() => {
    setRawText(readAssessmentFromSession());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !rawText) router.replace("/");
  }, [mounted, rawText, router]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setEmailLoading(true);
    try {
      if (caseId) {
        await supabase.from("cases").update({ email }).eq("id", caseId);
      } else {
        const stored = sessionStorage.getItem("ruled_assessment");
        if (stored) {
          const { intake, province } = JSON.parse(stored);
          const { data } = await supabase
            .from("cases")
            .select("id")
            .eq("intake_text", intake)
            .eq("province", province)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          if (data) {
            await supabase.from("cases").update({ email }).eq("id", data.id);
            setCaseId(data.id);
          }
        }
      }
      setEmailSent(true);
    } catch (err) {
      console.error("Email save error:", err);
      setEmailSent(true);
    } finally {
      setEmailLoading(false);
    }
  }

  if (!mounted || !rawText) return null;

  return (
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-10">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm transition-colors cursor-pointer"
            style={{ color: "#9a9590" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f5f1eb")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9590")}
          >
            &larr; New assessment
          </button>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Ruled<span style={{ color: "#c8392b" }}>.</span>
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Your Case Assessment
        </h1>

        {/* Section cards */}
        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <div
              key={section.header}
              className="rounded-xl px-6 py-5 flex flex-col gap-3"
              style={{ background: "#1a1916", border: "1px solid #2a2825" }}
            >
              <h2
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "#c8392b" }}
              >
                {section.header}
              </h2>
              <MarkdownBlock content={section.content} />
            </div>
          ))}
        </div>

        {/* Email capture */}
        <div
          className="rounded-xl px-6 py-6 flex flex-col gap-4"
          style={{ background: "#1a1916", border: "1px solid #2a2825" }}
        >
          <div>
            <h2 className="text-base font-semibold">Save your case assessment</h2>
            <p className="text-sm mt-1" style={{ color: "#9a9590" }}>
              We&apos;ll send a copy to your inbox.
            </p>
          </div>
          {emailSent ? (
            <p className="text-sm" style={{ color: "#c8392b" }}>
              Saved. Check your inbox shortly.
            </p>
          ) : (
            <form onSubmit={handleEmailSubmit} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex-1 rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  background: "#0f0e0c",
                  color: "#f5f1eb",
                  border: "1px solid #2a2825",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#c8392b"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2825"; }}
              />
              <button
                type="submit"
                disabled={emailLoading}
                className="rounded-lg px-4 py-3 text-sm font-semibold transition-opacity disabled:opacity-60 cursor-pointer whitespace-nowrap"
                style={{ background: "#f5f1eb", color: "#0f0e0c" }}
              >
                {emailLoading ? "Sending..." : "Send to my email"}
              </button>
            </form>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            className="flex-1 rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Generate Demand Letter &mdash; $49
          </button>
          <button
            className="flex-1 rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer"
            style={{
              background: "#1a1916",
              color: "#f5f1eb",
              border: "1px solid #2a2825",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#c8392b")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2825")}
          >
            Get Full Case Pack &mdash; $199
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs leading-relaxed" style={{ color: "#6b6560" }}>
          Ruled provides legal information, not legal advice. This is not a
          substitute for a lawyer. The information above is for general guidance
          only and may not reflect the most current laws or apply to your
          specific circumstances.
        </p>

      </div>
    </main>
  );
}
