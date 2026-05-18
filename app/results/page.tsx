"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { startCheckout } from "@/lib/checkout";

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

// Line is only # characters (optional whitespace between hashes) — delete entirely
function isHashOnlyLine(line: string): boolean {
  const t = line.trim();
  if (!t.includes("#")) return false;
  return /^[\s#]+$/.test(t);
}

function isHorizontalRule(line: string): boolean {
  return /^[-*_]{3,}\s*$/.test(line.trim());
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

// Remove hash-only / horizontal-rule lines (safe on full assessment text)
function stripHashAndRuleLines(text: string): string {
  return normalizeNewlines(text)
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^[#\s]+$/.test(trimmed)) return false;
      if (/^[-*_]{3,}\s*$/.test(trimmed)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Remove markdown duplicate titles from a section body (after splitting)
function stripDuplicateSectionHeaderLines(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (isHashOnlyLine(trimmed) || isHorizontalRule(trimmed)) return false;
      const md = trimmed.match(/^#{1,6}\s+(.+)$/);
      if (md && SECTION_HEADERS.includes(md[1].trim().toUpperCase())) {
        return false;
      }
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeSectionContent(text: string): string {
  return stripDuplicateSectionHeaderLines(stripHashAndRuleLines(text));
}

// "- • item" or "• item" → "item"
function parseBulletLine(line: string): string | null {
  const match = line.trim().match(/^(?:\s*[-*•]\s*)+(.+)$/);
  return match ? match[1].trim() : null;
}

// Block markdown: headings, bullets, paragraphs
function MarkdownBlock({ content }: { content: string }) {
  const lines = sanitizeSectionContent(content).split("\n");
  const elements: React.ReactNode[] = [];
  const pendingList: string[] = [];
  let k = 0;

  function flushList() {
    if (pendingList.length === 0) return;
    elements.push(
      <ul
        key={k++}
        className="list-disc pl-5 flex flex-col gap-1.5 marker:text-[#c8392b]"
        style={{ color: "#d4cfc9" }}
      >
        {pendingList.map((item, i) => (
          <li key={i} className="leading-relaxed pl-0.5">
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    );
    pendingList.length = 0;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); continue; }
    if (isHashOnlyLine(trimmed) || isHorizontalRule(trimmed)) continue;

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

    const bulletText = parseBulletLine(trimmed);
    if (bulletText) {
      pendingList.push(bulletText);
      continue;
    }

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

function findSectionHeader(
  text: string,
  header: string,
  fromIndex: number
): { headerStart: number; contentStart: number } | null {
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:^|\\n)\\s*(?:#{1,6}\\s+)?(${escaped})\\s*(?:\\n|$)`,
    "i"
  );
  const slice = text.slice(fromIndex);
  const match = slice.match(re);
  if (!match || match.index === undefined) return null;
  const headerStart =
    fromIndex + match.index + match[0].indexOf(match[1]);
  const contentStart = headerStart + match[1].length;
  return { headerStart, contentStart };
}

function parseAssessment(text: string): Section[] {
  if (!text) return [];
  const cleaned = stripHashAndRuleLines(text);
  const sections: Section[] = [];
  let searchFrom = 0;

  for (let i = 0; i < SECTION_HEADERS.length; i++) {
    const header = SECTION_HEADERS[i];
    const nextHeader = SECTION_HEADERS[i + 1];
    const found = findSectionHeader(cleaned, header, searchFrom);
    if (!found) continue;

    const { contentStart } = found;
    let contentEnd = cleaned.length;
    if (nextHeader) {
      const next = findSectionHeader(cleaned, nextHeader, contentStart);
      if (next) contentEnd = next.headerStart;
    }

    const content = sanitizeSectionContent(
      cleaned.slice(contentStart, contentEnd === -1 ? cleaned.length : contentEnd)
    );
    if (content) sections.push({ header, content });
    searchFrom = contentEnd;
  }

  if (sections.length === 0) {
    sections.push({
      header: "Assessment",
      content: sanitizeSectionContent(cleaned),
    });
  }
  return sections;
}

function readAssessmentFromSession(): {
  assessment: string;
  caseId: string | null;
} {
  const stored = sessionStorage.getItem("ruled_assessment");
  if (!stored) return { assessment: "", caseId: null };
  try {
    const data = JSON.parse(stored);
    return {
      assessment: data.assessment ?? "",
      caseId: data.caseId ?? null,
    };
  } catch {
    return { assessment: "", caseId: null };
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
  const [checkoutLoading, setCheckoutLoading] = useState<
    "demand" | "full" | null
  >(null);
  const [checkoutError, setCheckoutError] = useState("");

  // caseId is stored for outcome tracking (/outcome?caseId=) and future 60-day follow-up via Resend.
  useEffect(() => {
    const { assessment, caseId: storedCaseId } = readAssessmentFromSession();
    setRawText(assessment);
    if (storedCaseId) setCaseId(storedCaseId);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !rawText) router.replace("/");
  }, [mounted, rawText, router]);

  async function handleCheckout(tier: "demand" | "full") {
    setCheckoutError("");
    setCheckoutLoading(tier);
    try {
      await startCheckout(tier, caseId);
    } catch {
      setCheckoutError("Could not start checkout. Please try again.");
      setCheckoutLoading(null);
    }
  }

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
        <div className="flex flex-col gap-3">
          {checkoutError && (
            <p className="text-sm" style={{ color: "#c8392b" }}>
              {checkoutError}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              disabled={checkoutLoading !== null}
              onClick={() => handleCheckout("demand")}
              className="flex-1 rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: "#c8392b", color: "#f5f1eb" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {checkoutLoading === "demand"
                ? "Redirecting…"
                : "Generate Demand Letter — $49"}
            </button>
            <button
              type="button"
              disabled={checkoutLoading !== null}
              onClick={() => handleCheckout("full")}
              className="flex-1 rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{
                background: "#1a1916",
                color: "#f5f1eb",
                border: "1px solid #2a2825",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#c8392b")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#2a2825")
              }
            >
              {checkoutLoading === "full"
                ? "Redirecting…"
                : "Get Full Case Pack — $199"}
            </button>
          </div>
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
