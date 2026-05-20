"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Case } from "@/lib/supabase";
import { generateCaseTitle, getCaseMeta } from "../case-utils";
import { dash } from "../theme";

type NavItem = {
  key:
    | "home"
    | "case-assessments"
    | "documents"
    | "billing"
    | "profile"
    | "settings";
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
};

const NAV: NavItem[] = [
  {
    key: "home",
    label: "Home",
    href: "/dashboard",
    icon: (active) => <IconHome active={active} />,
  },
  {
    key: "case-assessments",
    label: "Case Assessments",
    href: "/dashboard/case-assessments",
    icon: (active) => <IconFileText active={active} />,
  },
  {
    key: "documents",
    label: "Documents",
    href: "/dashboard/documents",
    icon: (active) => <IconFolder active={active} />,
  },
  {
    key: "billing",
    label: "Billing",
    href: "/dashboard/billing",
    icon: (active) => <IconCreditCard active={active} />,
  },
  {
    key: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    icon: (active) => <IconUser active={active} />,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: (active) => <IconSettings active={active} />,
  },
];

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email: string | null; firstName: string | null; initials: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCases, setSearchCases] = useState<Case[]>([]);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const activeKey =
    NAV.find((n) => (n.href === "/dashboard" ? pathname === n.href : pathname.startsWith(n.href)))
      ?.key ?? "home";

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.push("/");
    }
  }

  useEffect(() => {
    setNotifOpen(false);
  }, [pathname]);

  async function openSearch() {
    setSearchOpen(true);
    setNotifOpen(false);
    if (searchCases.length > 0 || searchLoading) return;
    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from("cases")
        .select(
          "id,created_at,intake_text,province,case_assessment,email,outcome,paid,tier_purchased,user_id,demand_letter,court_docs,hearing_prep"
        )
        .order("created_at", { ascending: false });
      setSearchCases((data as Case[] | null) ?? []);
    } finally {
      setSearchLoading(false);
    }
  }

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { cases: [] as Case[], docs: [] as { key: string; label: string; content: string; caseId: string }[] };

    const cases = searchCases.filter((c) => {
      const title = generateCaseTitle(c).toLowerCase();
      return (
        title.includes(q) ||
        c.province.toLowerCase().includes(q) ||
        c.intake_text.toLowerCase().includes(q)
      );
    });

    const docs: { key: string; label: string; content: string; caseId: string }[] = [];
    for (const c of searchCases) {
      const meta = getCaseMeta(c);
      for (const d of meta.documents) {
        if (!d.available || !d.content?.trim()) continue;
        const label = `${d.title} — ${generateCaseTitle(c)}`;
        const hay = `${label}\n${d.content}`.toLowerCase();
        if (hay.includes(q)) {
          docs.push({ key: `${c.id}-${d.id}`, label, content: d.content, caseId: c.id });
        }
      }
    }
    return { cases: cases.slice(0, 8), docs: docs.slice(0, 10) };
  }, [query, searchCases]);

  return (
    <div className="min-h-screen w-full" style={{ background: "#0b0a08" }}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className="hidden md:flex w-64 shrink-0 border-r"
          style={{ borderColor: "#1f1d19", background: "#0f0e0c" }}
        >
          <div className="flex flex-col w-full p-4 gap-4">
            <Link href="/dashboard" className="px-2 py-3">
              <span
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                ruled<span style={{ color: "#c8392b" }}>.ca</span>
              </span>
            </Link>

            <nav className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = item.key === activeKey;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      background: active ? "rgba(200, 57, 43, 0.12)" : "transparent",
                      color: active ? "#f5f1eb" : "#9a9590",
                      border: active ? "1px solid rgba(200, 57, 43, 0.30)" : "1px solid transparent",
                    }}
                  >
                    {item.icon(active)}
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t" style={{ borderColor: "#1f1d19" }}>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  background: "transparent",
                  color: "#9a9590",
                  border: "1px solid #1f1d19",
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div
          className="flex-1 flex flex-col min-w-0 min-h-screen"
          style={{ background: dash.mainBg, color: dash.mainText }}
        >
          {/* Top bar */}
          <header className="sticky top-0 z-40" style={dash.topBar}>
            <div className="h-16 px-4 sm:px-6 flex items-center gap-4">
              {/* Mobile logo */}
              <Link href="/dashboard" className="md:hidden">
                <span
                  className="font-bold"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: dash.mainText }}
                >
                  ruled<span style={{ color: "#c8392b" }}>.ca</span>
                </span>
              </Link>

              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-xl">
                  <button
                    type="button"
                    onClick={openSearch}
                    className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                    style={{ background: dash.input.background, border: dash.input.border }}
                  >
                    <IconSearch active={false} mutedStroke="#534f4a" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={openSearch}
                      placeholder="Search cases, documents…"
                      className="w-full bg-transparent outline-none text-sm placeholder:text-[#534f4a]"
                      style={{ color: dash.mainText }}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <IconButton
                    label="Notifications"
                    onClick={() => {
                      setNotifOpen((v) => !v);
                      setSearchOpen(false);
                    }}
                  >
                  <IconBell active={false} mutedStroke="#534f4a" />
                  </IconButton>
                  {notifOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-xl overflow-hidden"
                      style={{ ...dash.panel }}
                    >
                      <div className="px-4 py-3 text-sm" style={{ color: dash.mainMuted }}>
                        No notifications yet
                      </div>
                    </div>
                  )}
                </div>
                <Link
                  href="/dashboard/settings"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: "transparent", border: dash.chromeBorder }}
                  aria-label="Settings"
                  title="Settings"
                >
                  <IconSettings active={false} mutedStroke="#534f4a" />
                </Link>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "#eeecea",
                    border: dash.chromeBorder,
                    color: dash.mainText,
                  }}
                  title={user.email ?? undefined}
                >
                  {user.initials}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>

      {/* Search modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20"
          style={{ background: "rgba(5, 5, 5, 0.75)" }}
          onClick={() => setSearchOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{ ...dash.panel }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Search"
          >
            <div
              className="px-5 py-4 border-b flex items-center justify-between gap-4"
              style={{ borderColor: dash.rowDivider }}
            >
              <p className="text-sm font-semibold">Search</p>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-sm cursor-pointer"
                style={{ color: dash.mainMuted }}
              >
                Close
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: dash.input.background, border: dash.input.border }}
              >
                <IconSearch active={false} mutedStroke="#534f4a" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search your cases and documents…"
                  className="w-full bg-transparent outline-none text-sm placeholder:text-[#534f4a]"
                  style={{ color: dash.mainText }}
                  autoFocus
                />
              </div>

              {searchLoading ? (
                <p className="text-sm" style={{ color: dash.mainMuted }}>
                  Loading…
                </p>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: dash.mainMuted }}>
                      Cases
                    </p>
                    {searchResults.cases.length === 0 ? (
                      <p className="text-sm" style={{ color: dash.mainMuted }}>
                        No matching cases.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {searchResults.cases.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              sessionStorage.setItem("dashboard_open_case_id", c.id);
                              router.push("/dashboard/case-assessments");
                              setSearchOpen(false);
                            }}
                            className="text-left rounded-xl px-4 py-3 cursor-pointer"
                            style={{ background: dash.nested.background, border: dash.nested.border }}
                          >
                            <p className="text-sm font-semibold">{generateCaseTitle(c)}</p>
                            <p className="text-xs" style={{ color: dash.mainMuted }}>
                              {c.province}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: dash.mainMuted }}>
                      Documents
                    </p>
                    {searchResults.docs.length === 0 ? (
                      <p className="text-sm" style={{ color: dash.mainMuted }}>
                        No matching documents.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {searchResults.docs.map((d) => (
                          <div
                            key={d.key}
                            className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                            style={{ background: dash.nested.background, border: dash.nested.border }}
                          >
                            <p className="text-sm font-semibold min-w-0 truncate">{d.label}</p>
                            <button
                              type="button"
                              onClick={() => {
                                const blob = new Blob([d.content], { type: "text/plain;charset=utf-8" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = "ruled-document.txt";
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer shrink-0"
                              style={{ background: "#c8392b", color: "#f5f1eb" }}
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating + button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <div
          className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 -top-10 text-xs font-semibold px-3 py-2 rounded-lg"
          style={{ ...dash.panel, color: dash.mainText }}
        >
          Start New Case Assessment
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/new-assessment")}
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold cursor-pointer shadow-lg"
          style={{ background: "#c8392b", color: "#f5f1eb" }}
          aria-label="Start New Case Assessment"
        >
          +
        </button>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
      style={{ background: "transparent", border: dash.chromeBorder }}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function iconStyle(active: boolean, mutedStroke = "#9a9590") {
  return { stroke: active ? "#c8392b" : mutedStroke };
}

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active)}>
      <path d="M3 11.5L12 4l9 7.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20h14v-9.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconFileText({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active)}>
      <path d="M7 3h7l3 3v15H7V3z" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12h6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 16h6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 3v4h4" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function IconFolder({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active)}>
      <path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function IconCreditCard({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active)}>
      <path d="M3 7h18v10H3V7z" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 10h18" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 15h4" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active)}>
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconSettings({ active, mutedStroke }: { active: boolean; mutedStroke?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active, mutedStroke)}>
      <path
        d="M12 15.5a3.5 3.5 0 1 0-3.5-3.5 3.5 3.5 0 0 0 3.5 3.5z"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a8 8 0 0 0 .1-6l2-1.6-2-3.4-2.4 1a8.4 8.4 0 0 0-5.2-2L11.5 1h-4L7 3a8.4 8.4 0 0 0-5.2 2L-.6 4l-2 3.4L-.6 9a8 8 0 0 0 .1 6L-2.5 16.6l2 3.4 2.4-1a8.4 8.4 0 0 0 5.2 2l.4 2h4l.4-2a8.4 8.4 0 0 0 5.2-2l2.4 1 2-3.4L19.4 15z"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.0"
      />
    </svg>
  );
}
function IconSearch({ active, mutedStroke }: { active: boolean; mutedStroke?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active, mutedStroke)}>
      <path d="M10.5 18a7.5 7.5 0 1 1 7.5-7.5A7.5 7.5 0 0 1 10.5 18z" strokeWidth="1.8" />
      <path d="M16.5 16.5 21 21" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconBell({ active, mutedStroke }: { active: boolean; mutedStroke?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active, mutedStroke)}>
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 19a2 2 0 0 1-4 0" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

