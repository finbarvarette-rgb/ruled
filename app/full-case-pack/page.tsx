"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readRuledSession, updateRuledSession } from "@/lib/session";
import { downloadTextFile } from "@/lib/download";
import { Spinner } from "@/components/Spinner";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTED_QUESTIONS = [
  "What are my chances of winning?",
  "How long will this take?",
  "What if they don't show up?",
  "Can I claim my time and stress?",
  "What if I lose?",
];

export default function FullCasePackPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(readRuledSession());

  const [openSection, setOpenSection] = useState<number | null>(1);
  const [demandLetter, setDemandLetter] = useState<string | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const [courtDocs, setCourtDocs] = useState<string | null>(null);
  const [courtLoading, setCourtLoading] = useState(false);
  const [hearingPrep, setHearingPrep] = useState<string | null>(null);
  const [hearingLoading, setHearingLoading] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = readRuledSession();
    if (!s.assessment) {
      router.replace("/");
      return;
    }
    setSession(s);
    setDemandLetter(s.demandLetter);
    setMounted(true);
  }, [router]);

  async function generateDemandLetter() {
    setLetterLoading(true);
    try {
      const res = await fetch("/api/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: "Claimant",
          senderEmail: session.email ?? "claimant@email.com",
          defendantName: "Defendant",
          defendantAddress: "Address on file",
          claimAmount: "0",
          disputeDate: new Date().toISOString().slice(0, 10),
          province: session.province,
          caseAssessment: session.assessment,
          caseId: session.caseId,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDemandLetter(data.letter);
      updateRuledSession({ demandLetter: data.letter });
    } catch {
      setDemandLetter(null);
    } finally {
      setLetterLoading(false);
    }
  }

  async function loadCourtDocs() {
    if (courtDocs || courtLoading) return;
    setCourtLoading(true);
    try {
      const res = await fetch("/api/court-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseAssessment: session.assessment,
          province: session.province,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCourtDocs(data.content);
    } catch {
      setCourtDocs("Unable to load. Please try again.");
    } finally {
      setCourtLoading(false);
    }
  }

  async function loadHearingPrep() {
    if (hearingPrep || hearingLoading) return;
    setHearingLoading(true);
    try {
      const res = await fetch("/api/hearing-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseAssessment: session.assessment,
          province: session.province,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setHearingPrep(data.content);
    } catch {
      setHearingPrep("Unable to load. Please try again.");
    } finally {
      setHearingLoading(false);
    }
  }

  function toggleSection(n: number) {
    const next = openSection === n ? null : n;
    setOpenSection(next);
    if (next === 2) loadCourtDocs();
    if (next === 3) loadHearingPrep();
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatInput("");
    const userMsg: ChatMessage = { role: "user", content: question };
    const nextMessages = [...chatMessages, userMsg].slice(-10);
    setChatMessages(nextMessages);
    setChatLoading(true);
    try {
      const res = await fetch("/api/case-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          caseAssessment: session.assessment,
          history: nextMessages.slice(0, -1),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.answer,
      };
      setChatMessages((prev) => [...prev, assistantMsg].slice(-10));
    } catch {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: "Sorry, I could not answer that. Please try again.",
      };
      setChatMessages((prev) => [...prev, errMsg].slice(-10));
    } finally {
      setChatLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16 overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 min-w-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Your Full Case Pack
          </h1>
          <p className="text-sm" style={{ color: "#9a9590" }}>
            Everything you need to fight back and get what you&apos;re owed.
          </p>
        </div>

        <ExpandableCard
          number={1}
          title="Demand Letter"
          open={openSection === 1}
          onToggle={() => toggleSection(1)}
          onDownload={
            demandLetter
              ? () => downloadTextFile("ruled-demand-letter.txt", demandLetter)
              : undefined
          }
        >
          {demandLetter ? (
            <>
              <div
                className="rounded-xl px-6 py-6 text-left whitespace-pre-wrap leading-relaxed text-sm mt-4"
                style={{
                  background: "#ffffff",
                  color: "#0f0e0c",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                }}
              >
                {demandLetter}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(demandLetter);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold cursor-pointer"
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
                    downloadTextFile("ruled-demand-letter.txt", demandLetter)
                  }
                  className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold cursor-pointer"
                  style={{ background: "#c8392b", color: "#f5f1eb" }}
                >
                  Download as Text File
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-sm" style={{ color: "#9a9590" }}>
                Generate your personalized demand letter from your case
                assessment.
              </p>
              <button
                type="button"
                disabled={letterLoading}
                onClick={generateDemandLetter}
                className="rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                {letterLoading && <Spinner />}
                {letterLoading ? "Drafting your letter..." : "Generate Demand Letter"}
              </button>
            </div>
          )}
        </ExpandableCard>

        <ExpandableCard
          number={2}
          title="Court Filing Documents"
          open={openSection === 2}
          onToggle={() => toggleSection(2)}
          onDownload={
            courtDocs
              ? () => downloadTextFile("ruled-court-filing-guide.txt", courtDocs)
              : undefined
          }
        >
          {courtLoading ? (
            <LoadingRow />
          ) : (
            <DocBody text={courtDocs} />
          )}
        </ExpandableCard>

        <ExpandableCard
          number={3}
          title="Hearing Preparation"
          open={openSection === 3}
          onToggle={() => toggleSection(3)}
          onDownload={
            hearingPrep
              ? () => downloadTextFile("ruled-hearing-prep.txt", hearingPrep)
              : undefined
          }
        >
          {hearingLoading ? (
            <LoadingRow />
          ) : (
            <DocBody text={hearingPrep} />
          )}
        </ExpandableCard>

        <ExpandableCard
          number={4}
          title="Unlimited Q&A"
          open={openSection === 4}
          onToggle={() => toggleSection(4)}
        >
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setChatInput(q)}
                  className="text-xs rounded-full px-3 py-1.5 cursor-pointer"
                  style={{
                    border: "1px solid #c8392b",
                    color: "#f5f1eb",
                    background: "transparent",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
            <div
              className="flex flex-col gap-3 max-h-80 overflow-y-auto rounded-lg p-4"
              style={{ background: "#0f0e0c", border: "1px solid #2a2825" }}
            >
              {chatMessages.length === 0 && (
                <p className="text-sm" style={{ color: "#9a9590" }}>
                  Ask anything about your case, filing, evidence, or the hearing.
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-sm leading-relaxed">
                  <span
                    className="text-xs font-semibold block mb-1"
                    style={{ color: "#c8392b" }}
                  >
                    {msg.role === "user" ? "You" : "Ruled"}
                  </span>
                  <span style={{ color: "#d4cfc9" }}>{msg.content}</span>
                </div>
              ))}
              {chatLoading && <LoadingRow />}
            </div>
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question about your case…"
                className="flex-1 rounded-lg px-4 py-3 text-sm outline-none min-w-0"
                style={{
                  background: "#0f0e0c",
                  color: "#f5f1eb",
                  border: "1px solid #2a2825",
                }}
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                {chatLoading && <Spinner />}
                {chatLoading ? "…" : "Ask"}
              </button>
            </form>
          </div>
        </ExpandableCard>
      </div>
    </main>
  );
}

function ExpandableCard({
  number,
  title,
  open,
  onToggle,
  onDownload,
  children,
}: {
  number: number;
  title: string;
  open: boolean;
  onToggle: () => void;
  onDownload?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#1a1916", border: "1px solid #2a2825" }}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center justify-between px-4 sm:px-6 py-4 text-left cursor-pointer min-w-0"
        >
          <span className="font-semibold truncate">
            <span style={{ color: "#c8392b" }}>{number}. </span>
            {title}
          </span>
          <span className="text-lg shrink-0" style={{ color: "#9a9590" }}>
            {open ? "−" : "+"}
          </span>
        </button>
        {open && onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="shrink-0 mr-4 text-xs font-medium cursor-pointer"
            style={{ color: "#c8392b" }}
          >
            Download
          </button>
        )}
      </div>
      {open && (
        <div
          className="px-4 sm:px-6 pb-6 border-t"
          style={{ borderColor: "#2a2825" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DocBody({ text }: { text: string | null }) {
  if (!text) {
    return (
      <p className="text-sm pt-4" style={{ color: "#9a9590" }}>
        Expand to generate your guide.
      </p>
    );
  }
  return (
    <pre
      className="whitespace-pre-wrap text-sm leading-relaxed pt-4"
      style={{ color: "#d4cfc9" }}
    >
      {text}
    </pre>
  );
}

function LoadingRow() {
  return (
    <p className="text-sm pt-4 flex items-center gap-2" style={{ color: "#9a9590" }}>
      <Spinner /> Generating…
    </p>
  );
}
