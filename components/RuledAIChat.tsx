"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const NAVY = "#0F172A";
const BLUE = "#C8392B";
const AMBER = "#F59E0B";
const SURFACE = "#F1F5F9";
const BORDER = "#E2E8F0";
const MUTED = "#64748B";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — I'm Ruled AI. Ask about small claims, demand letters, or money you're owed. I'll keep it short and practical — legal information, not advice.",
};

function ChatIcon({ className, stroke }: { className?: string; stroke?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke ?? "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/** Strip leftover markers the model sometimes leaves unpaired. */
function cleanPlainText(text: string): string {
  return text.replace(/\*\*/g, "").replace(/__/g, "");
}

const INLINE_MD = /\*\*(.+?)\*\*|\*([^*\n]+?)\*|_([^_\n]+?)_/g;

function parseInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  INLINE_MD.lastIndex = 0;
  while ((match = INLINE_MD.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(cleanPlainText(text.slice(lastIndex, match.index)));
    }
    const key = `${keyPrefix}-i${n++}`;
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {cleanPlainText(match[1])}
        </strong>
      );
    } else {
      const italic = match[2] ?? match[3];
      nodes.push(
        <em key={key} className="italic">
          {cleanPlainText(italic ?? "")}
        </em>
      );
    }
    lastIndex = INLINE_MD.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(cleanPlainText(text.slice(lastIndex)));
  }
  return nodes.length ? nodes : [cleanPlainText(text)];
}

function preprocessAssistantContent(content: string): string {
  return content
    .split("\n")
    .map((line) => line.replace(/^#{1,6}\s+/, ""))
    .join("\n");
}

function AssistantMessageContent({ content }: { content: string }) {
  const lines = preprocessAssistantContent(content).split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ""));
        i++;
      }
      blocks.push(
        <ul
          key={`b${blockKey++}`}
          className="my-1 list-disc space-y-0.5 pl-4 marker:text-[#64748B]"
        >
          {items.map((item, j) => (
            <li key={j}>{parseInlineMarkdown(item, `li${blockKey}-${j}`)}</li>
          ))}
        </ul>
      );
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^\s*-\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    const para = paraLines.join(" ");
    blocks.push(
      <p key={`b${blockKey++}`} className="my-0">
        {parseInlineMarkdown(para, `p${blockKey}`)}
      </p>
    );
  }

  return <div className="space-y-1">{blocks}</div>;
}

export function RuledAIChat() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const showAssessmentCta =
    loggedIn === false && userMessageCount >= 2;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      const t = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(t);
    }
  }, [open, messages, loading, scrollToBottom]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const history = nextMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ruled-ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          loggedIn: loggedIn === true,
        }),
      });

      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer ?? "I could not generate a response.",
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const launcherPosition = isDashboard
    ? "bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6"
    : "bottom-6";

  const panelPosition = isDashboard
    ? "bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6"
    : "bottom-6";

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed right-4 md:right-6 z-[55] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] ${launcherPosition}`}
          style={{ background: NAVY, color: "#ffffff" }}
          aria-label="Open Ruled AI chat"
        >
          <ChatIcon stroke={AMBER} />
          <span>Ask Ruled AI</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className={`fixed right-4 md:right-6 z-[60] flex flex-col w-[min(400px,calc(100vw-2rem))] h-[min(500px,calc(100vh-6rem))] rounded-2xl shadow-2xl overflow-hidden border ${panelPosition}`}
          style={{ background: "#ffffff", borderColor: BORDER }}
          role="dialog"
          aria-label="Ruled AI chat"
        >
          <header
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: NAVY, color: "#ffffff" }}
          >
            <div className="flex items-center gap-2">
              <ChatIcon className="opacity-90" />
              <span className="font-semibold text-sm tracking-tight">Ruled AI</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              aria-label="Close chat"
            >
              <CloseIcon />
            </button>
          </header>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0"
            style={{ background: "#FAFAFA" }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user" ? "whitespace-pre-wrap" : ""
                  }`}
                  style={
                    msg.role === "user"
                      ? {
                          background: SURFACE,
                          color: NAVY,
                          border: `1px solid ${BORDER}`,
                        }
                      : {
                          background: "#ffffff",
                          color: NAVY,
                          border: `1px solid ${BORDER}`,
                        }
                  }
                >
                  {msg.role === "assistant" ? (
                    <AssistantMessageContent content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-3.5 py-2.5 text-sm"
                  style={{
                    background: "#ffffff",
                    color: MUTED,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  Thinking…
                </div>
              </div>
            )}

            {showAssessmentCta && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "#EFF6FF",
                  border: `1px solid ${BORDER}`,
                  color: NAVY,
                }}
              >
                <p className="mb-2 leading-snug">
                  Want a full analysis of your situation?
                </p>
                <Link
                  href="/onboarding"
                  className="font-semibold underline-offset-2 hover:underline"
                  style={{ color: BLUE }}
                  onClick={() => setOpen(false)}
                >
                  Start your free case assessment →
                </Link>
              </div>
            )}
          </div>

          {error && (
            <p
              className="px-4 py-2 text-xs shrink-0"
              style={{ color: "#DC2626", background: "#FEF2F2" }}
            >
              {error}
            </p>
          )}

          <form
            onSubmit={handleSend}
            className="shrink-0 flex gap-2 p-3 border-t"
            style={{ borderColor: BORDER, background: "#ffffff" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none min-h-[44px] max-h-28 disabled:opacity-60"
              style={{
                background: SURFACE,
                color: NAVY,
                border: `1px solid ${BORDER}`,
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed self-end"
              style={{ background: BLUE }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
