"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

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

  return (
    <div className="min-h-screen w-full" style={{ background: "#0b0a08", color: "#f5f1eb" }}>
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
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header
            className="sticky top-0 z-40 border-b"
            style={{ borderColor: "#1f1d19", background: "rgba(15, 14, 12, 0.9)", backdropFilter: "blur(10px)" }}
          >
            <div className="h-16 px-4 sm:px-6 flex items-center gap-4">
              {/* Mobile logo */}
              <Link href="/dashboard" className="md:hidden">
                <span className="font-bold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  ruled<span style={{ color: "#c8392b" }}>.ca</span>
                </span>
              </Link>

              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-xl">
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                    style={{ background: "#0b0a08", border: "1px solid #1f1d19" }}
                  >
                    <IconSearch active={false} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search cases, documents…"
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: "#f5f1eb" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <IconButton label="Notifications">
                  <IconBell active={false} />
                </IconButton>
                <IconButton label="Settings" onClick={() => router.push("/dashboard/settings")}>
                  <IconSettings active={false} />
                </IconButton>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "#1a1916", border: "1px solid #1f1d19", color: "#f5f1eb" }}
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

      {/* Floating + button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <div
          className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 -top-10 text-xs font-semibold px-3 py-2 rounded-lg"
          style={{ background: "#1a1916", border: "1px solid #1f1d19", color: "#f5f1eb" }}
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
      style={{ background: "transparent", border: "1px solid #1f1d19" }}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function iconStyle(active: boolean) {
  return { stroke: active ? "#c8392b" : "#9a9590" };
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
function IconSettings({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active)}>
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
function IconSearch({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active)}>
      <path d="M10.5 18a7.5 7.5 0 1 1 7.5-7.5A7.5 7.5 0 0 1 10.5 18z" strokeWidth="1.8" />
      <path d="M16.5 16.5 21 21" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconBell({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={iconStyle(active)}>
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 19a2 2 0 0 1-4 0" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

