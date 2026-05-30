"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";

const NAVY = "#0A0F1E";
const NAVY2 = "#0D1220";
const GOLD = "#D4A853";
const GOLD_DIM = "rgba(212,168,83,0.12)";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.5)";
const WHITE = "#FFFFFF";

type NavKey = "home" | "cases" | "billing" | "account";

const TOPBAR_LABELS: Record<NavKey, string> = {
  home: "Dashboard",
  cases: "My Cases",
  billing: "Billing",
  account: "Account",
};

const NAV: Array<{
  key: NavKey;
  label: string;
  href: string;
  icon: (color: string) => React.ReactNode;
}> = [
  {
    key: "home",
    label: "Home",
    href: "/dashboard",
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    ),
  },
  {
    key: "cases",
    label: "My Cases",
    href: "/dashboard/case-assessments",
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
  },
  {
    key: "billing",
    label: "Billing",
    href: "/dashboard/billing",
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
      </svg>
    ),
  },
  {
    key: "account",
    label: "Account",
    href: "/dashboard/account",
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
  },
];

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    initials: string;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const activeKey: NavKey =
    pathname === "/dashboard"
      ? "home"
      : pathname.startsWith("/dashboard/case-assessments") ||
        pathname.startsWith("/dashboard/cases")
      ? "cases"
      : pathname.startsWith("/dashboard/billing")
      ? "billing"
      : pathname.startsWith("/dashboard/account")
      ? "account"
      : "home";

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email?.split("@")[0] ||
    "User";

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.push("/");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: NAVY, color: WHITE }}>
      <div className="flex" style={{ minHeight: "100vh" }}>
        {/* Sidebar — desktop only */}
        <aside
          className="hidden md:flex md:flex-col"
          style={{
            width: 240,
            minHeight: "100vh",
            background: NAVY2,
            borderRight: `1px solid ${BORDER}`,
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 100,
          }}
        >
          {/* Logo */}
          <div
            style={{
              padding: "28px 24px 24px",
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 22,
                }}
              >
                <span style={{ color: WHITE }}>ruled</span>
                <span style={{ color: GOLD }}>.ca</span>
              </span>
            </Link>
          </div>

          {/* Nav items */}
          <nav style={{ padding: "16px 0", flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "1.5px",
                color: MUTED,
                textTransform: "uppercase",
                padding: "12px 24px 6px",
              }}
            >
              Main
            </div>
            {NAV.map((item) => {
              const active = item.key === activeKey;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 24px",
                    color: active ? GOLD : MUTED,
                    fontSize: 14,
                    borderLeft: `2px solid ${active ? GOLD : "transparent"}`,
                    background: active ? GOLD_DIM : "transparent",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>
                    {item.icon(active ? GOLD : MUTED)}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom user info */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            style={{
              padding: "16px 24px",
              borderTop: `1px solid ${BORDER}`,
              borderRight: "none",
              borderBottom: "none",
              borderLeft: "none",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "none",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: GOLD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                color: NAVY,
                flexShrink: 0,
              }}
            >
              {user.initials}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: WHITE,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: MUTED,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>
          </button>
        </aside>

        {/* Main content */}
        <div
          className="flex-1 md:ml-[240px] flex flex-col"
          style={{ minHeight: "100vh" }}
        >
          {/* Topbar */}
          <header
            style={{
              height: 64,
              background: "rgba(10,15,30,0.95)",
              borderBottom: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 32px",
              position: "sticky",
              top: 0,
              zIndex: 50,
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Mobile: logo */}
            <Link
              href="/dashboard"
              className="md:hidden"
              style={{ textDecoration: "none" }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 18,
                }}
              >
                <span style={{ color: WHITE }}>ruled</span>
                <span style={{ color: GOLD }}>.ca</span>
              </span>
            </Link>
            {/* Desktop: page title */}
            <span
              className="hidden md:block"
              style={{ fontSize: 15, fontWeight: 500, color: MUTED }}
            >
              {TOPBAR_LABELS[activeKey]}
            </span>

            <Link
              href="/onboarding"
              style={{
                background: GOLD,
                color: NAVY,
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              + New Case
            </Link>
          </header>

          {/* Page content */}
          <div
            className="flex-1 min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0"
            style={{ background: NAVY }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="flex md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: NAVY2,
          borderTop: `1px solid ${BORDER}`,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {NAV.map((item) => {
          const active = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "10px 4px",
                color: active ? GOLD : MUTED,
                textDecoration: "none",
                fontSize: 10,
                fontWeight: 500,
              }}
            >
              {item.icon(active ? GOLD : MUTED)}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
