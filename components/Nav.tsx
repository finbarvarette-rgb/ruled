"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type DropdownItem = { label: string; href: string; desc?: string };

const NAV_ITEMS: { label: string; href?: string; dropdown?: DropdownItem[] }[] = [
  {
    label: "How It Works",
    dropdown: [
      { label: "The Process", href: "/#how-it-works", desc: "Three steps to getting paid" },
      { label: "Case Assessment", href: "/onboarding", desc: "Free AI-powered analysis" },
      { label: "Demand Letter", href: "/demand-preview", desc: "Put them on formal notice" },
    ],
  },
  {
    label: "Products",
    dropdown: [
      { label: "Demand Letter \u2014 $49", href: "/demand-preview", desc: "Ready-to-send legal letter" },
      { label: "Full Case Pack \u2014 $199", href: "/full-case-pack-preview", desc: "Everything you need to win" },
    ],
  },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/about" },
];

function Dropdown({ items, onClose }: { items: DropdownItem[]; onClose: () => void }) {
  return (
    <div
      className="absolute top-full left-1/2 mt-2 w-64 rounded-xl overflow-hidden shadow-2xl z-50"
      style={{
        transform: "translateX(-50%)",
        background: "#1a1916",
        border: "1px solid #2a2825",
      }}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="flex flex-col gap-0.5 px-4 py-3 transition-colors"
          style={{ borderBottom: "1px solid #2a2825" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#222018")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span className="text-sm font-medium" style={{ color: "#f5f1eb" }}>
            {item.label}
          </span>
          {item.desc && (
            <span className="text-xs" style={{ color: "#9a9590" }}>
              {item.desc}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  async function refreshAuthState() {
    try {
      const { data } = await supabase.auth.getUser();
      setSignedIn(!!data.user);
    } catch {
      setSignedIn(false);
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      setSignedIn(false);
      setMobileOpen(false);
      router.push("/");
    }
  }

  useEffect(() => {
    // Use getUser() (cookie-backed) so the nav reflects server-set auth cookies.
    // Note: when auth happens via server routes/callbacks, onAuthStateChange may
    // not fire in the existing tab. So we also refresh on route changes + focus.
    refreshAuthState();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
    refreshAuthState();
  }, [pathname]);

  useEffect(() => {
    function onFocus() {
      refreshAuthState();
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refreshAuthState();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [supabase]);

  const isLanding = pathname === "/";

  // Dashboard has its own app-like chrome.
  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 w-full border-b"
      style={{ background: "#0f0e0c", borderColor: "#2a2825" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight shrink-0"
          style={{ fontFamily: "Georgia, \'Times New Roman\', serif" }}
        >
          ruled<span style={{ color: "#c8392b" }}>.ca</span>
        </Link>

        {isLanding && (
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="relative">
                {item.dropdown ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === item.label ? null : item.label)
                    }
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                    style={{ color: openDropdown === item.label ? "#f5f1eb" : "#9a9590" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f5f1eb")}
                    onMouseLeave={(e) => {
                      if (openDropdown !== item.label) e.currentTarget.style.color = "#9a9590";
                    }}
                  >
                    {item.label}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="currentColor"
                      style={{
                        transform: openDropdown === item.label ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s",
                      }}
                    >
                      <path d="M6 8L1 3h10L6 8z" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    className="px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ color: "#9a9590" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f5f1eb")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9590")}
                  >
                    {item.label}
                  </Link>
                )}
                {item.dropdown && openDropdown === item.label && (
                  <Dropdown
                    items={item.dropdown}
                    onClose={() => setOpenDropdown(null)}
                  />
                )}
              </div>
            ))}
          </nav>
        )}

        {!isLanding && <div className="flex-1" />}

        <div className="flex items-center gap-3 ml-auto">
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/account"
                className="hidden sm:block text-sm transition-opacity hover:opacity-80"
                style={{ color: "#9a9590" }}
              >
                My Account
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden sm:block text-sm transition-opacity hover:opacity-80 cursor-pointer"
                style={{ color: "#9a9590" }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-sm transition-opacity hover:opacity-80"
                style={{ color: "#9a9590" }}
              >
                Sign In
              </Link>
              <Link
                href="/onboarding"
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                Get Started
              </Link>
            </>
          )}

          {isLanding && (
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
              aria-label="Menu"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block w-5 h-0.5"
                  style={{ background: "#9a9590" }}
                />
              ))}
            </button>
          )}
        </div>
      </div>

      {isLanding && mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-4 flex flex-col gap-1"
          style={{ background: "#0f0e0c", borderColor: "#2a2825" }}
        >
          {NAV_ITEMS.map((item) =>
            item.dropdown ? (
              <div key={item.label}>
                <p
                  className="text-xs font-semibold tracking-widest uppercase px-2 py-2"
                  style={{ color: "#c8392b" }}
                >
                  {item.label}
                </p>
                {item.dropdown.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className="block px-4 py-2 text-sm rounded-lg"
                    style={{ color: "#9a9590" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className="block px-2 py-2 text-sm rounded-lg"
                style={{ color: "#9a9590" }}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
          <div
            className="mt-2 pt-4 flex flex-col gap-2"
            style={{ borderTop: "1px solid #2a2825" }}
          >
            {signedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="block rounded-lg px-4 py-3 text-sm font-semibold text-center"
                  style={{ background: "#c8392b", color: "#f5f1eb" }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/account"
                  className="block px-2 py-2 text-sm"
                  style={{ color: "#9a9590" }}
                >
                  My Account
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block px-2 py-2 text-sm text-left cursor-pointer"
                  style={{ color: "#9a9590" }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-2 py-2 text-sm" style={{ color: "#9a9590" }}>
                  Sign In
                </Link>
                <Link
                  href="/onboarding"
                  className="block rounded-lg px-4 py-3 text-sm font-semibold text-center"
                  style={{ background: "#c8392b", color: "#f5f1eb" }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
