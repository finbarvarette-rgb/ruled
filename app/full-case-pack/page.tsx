"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readRuledSession } from "@/lib/session";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function FullCasePackPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [assessment, setAssessment] = useState("");
  const [province, setProvince] = useState("");
  const [demandLetter, setDemandLetter] = useState<string | null>(null);

  const [openSection, setOpenSection] = useState<number | null>(1);
  const [courtDocs, setCourtDocs] = useState<string | null>(null);
  const [courtLoading, setCourtLoading] = useState(false);
  const [hearingPrep, setHearingPrep] = useState<string | null>(null);
  const [hearingLoading, setHearingLoading] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const session = readRuledSession();
    if (!session.assessment) {
      router.replace("/");
      return;
    }
    setAssessment(session.assessment);
    setProvince(session.province);
    setDemandLetter(session.demandLetter);
    setMounted(true);
  }, [router]);

  async function loadCourtDocs() {
    if (courtDocs || courtLoading) return;
    setCourtLoading(true);
    try {
      const res = await fetch("/api/court-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseAssessment: assessment, province }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCourtDocs(data.content);
    } catch {
      setCourtDocs("Unable to load court filing guidance. Please try again.");
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
        body: JSON.stringify({ caseAssessment: assessment, province }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setHearingPrep(data.content);
    } catch {
      setHearingPrep("Unable to load hearing preparation. Please try again.");
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
          caseAssessment: assessment,
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
    <main className="flex flex-col flex-1 min-h-screen px-6 py-12 md:py-16">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Your Full Case Pack
          </h1>
          <p className="text-sm" style={{ color: "#9a9590" }}>
            Everything you need to fight back and win.
          </p>
        </div>

        <ExpandableCard
          number={1}
          title="Demand Letter"
          open={openSection === 1}
          onToggle={() => toggleSection(1)}
        >
          {demandLetter ? (
            <pre
              className="whitespace-pre-wrap text-sm leading-relaxed font-serif"
              style={{ color: "#d4cfc9" }}
            >
              {demandLetter}
            </pre>
          ) : (
            <p className="text-sm" style={{ color: "#9a9590" }}>
              No demand letter on file yet.{" "}
              <a href="/demand" style={{ color: "#c8392b" }}>
                Generate your demand letter
              </a>{" "}
              first — it will appear here automatically.
            </p>
          )}
        </ExpandableCard>

        <ExpandableCard
          number={2}
          title="Court Filing Documents"
          open={openSection === 2}
          onToggle={() => toggleSection(2)}
        >
          {courtLoading ? (
            <LoadingText />
          ) : (
            <DocContent text={courtDocs} />
          )}
        </ExpandableCard>

        <ExpandableCard
          number={3}
          title="Hearing Preparation"
          open={openSection === 3}
          onToggle={() => toggleSection(3)}
        >
          {hearingLoading ? (
            <LoadingText />
          ) : (
            <DocContent text={hearingPrep} />
          )}
        </ExpandableCard>

        <ExpandableCard
          number={4}
          title="Unlimited Q&A"
          open={openSection === 4}
          onToggle={() => toggleSection(4)}
        >
          <div className="flex flex-col gap-4">
            <div
              className="flex flex-col gap-3 max-h-80 overflow-y-auto rounded-lg p-4"
              style={{ background: "#0f0e0c", border: "1px solid #2a2825" }}
            >
              {chatMessages.length === 0 && (
                <p className="text-sm" style={{ color: "#9a9590" }}>
                  Ask anything about your case, filing, evidence, or the
                  hearing.
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className="text-sm leading-relaxed"
                  style={{
                    color: msg.role === "user" ? "#f5f1eb" : "#d4cfc9",
                  }}
                >
                  <span
                    className="text-xs font-semibold block mb-1"
                    style={{ color: "#c8392b" }}
                  >
                    {msg.role === "user" ? "You" : "Ruled"}
                  </span>
                  {msg.content}
                </div>
              ))}
              {chatLoading && <LoadingText />}
            </div>
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question about your case…"
                className="flex-1 rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  background: "#0f0e0c",
                  color: "#f5f1eb",
                  border: "1px solid #2a2825",
                }}
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                Ask
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
  children,
}: {
  number: number;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#1a1916", border: "1px solid #2a2825" }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer"
      >
        <span className="font-semibold">
          <span style={{ color: "#c8392b" }}>{number}. </span>
          {title}
        </span>
        <span className="text-lg" style={{ color: "#9a9590" }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div
          className="px-6 pb-6 border-t"
          style={{ borderColor: "#2a2825" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DocContent({ text }: { text: string | null }) {
  if (!text) {
    return (
      <p className="text-sm pt-4" style={{ color: "#9a9590" }}>
        Expand this section to generate your guidance.
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

function LoadingText() {
  return (
    <p className="text-sm pt-4 animate-pulse" style={{ color: "#9a9590" }}>
      Generating…
    </p>
  );
}
