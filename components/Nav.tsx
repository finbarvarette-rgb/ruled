"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const NAVY = "var(--color-navy)";
const BLUE = "var(--color-blue)";
const NAV_BORDER = "var(--color-nav-border)";
const SURFACE = "var(--color-surface)";

type DropdownItem = {
  label: string;
  href: string;
  desc?: string;
  /** In-page scroll on home; navigate home then scroll from elsewhere */
  scrollToId?: "how-it-works";
};

const NAV_ITEMS: { label: string; href?: string; dropdown?: DropdownItem[] }[] = [
  {
    label: "How It Works",
    dropdown: [
      {
        label: "The Process",
        href: "/",
        desc: "Three steps to getting paid",
        scrollToId: "how-it-works",
      },
      {
        label: "Case Assessment",
        href: "/how-it-works/case-assessment",
        desc: "What the free assessment is and what you get",
      },
      {
        label: "Small Claims Guide",
        href: "/small-claims-guide",
        desc: "How small claims works in Canada",
      },
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
  { label: "Blog", href: "/blog" },
];

function Dropdown({
  items,
  onClose,
  onScrollToHowItWorks,
}: {
  items: DropdownItem[];
  onClose: () => void;
  onScrollToHowItWorks: () => void;
}) {
  return (
    <div
      className="absolute top-full left-1/2 mt-2 w-64 rounded-xl overflow-hidden shadow-lg z-50"
      style={{
        transform: "translateX(-50%)",
        background: "#ffffff",
        border: `1px solid ${NAV_BORDER}`,
      }}
    >
      {items.map((item) =>
        item.scrollToId === "how-it-works" ? (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              onClose();
              onScrollToHowItWorks();
            }}
            className="flex flex-col gap-0.5 px-4 py-3 transition-colors w-full text-left cursor-pointer"
            style={{ borderBottom: `1px solid ${NAV_BORDER}` }}
            onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span className="text-sm font-medium" style={{ color: NAVY }}>
              {item.label}
            </span>
            {item.desc && (
              <span className="text-xs" style={{ color: "#64748b" }}>
                {item.desc}
              </span>
            )}
          </button>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex flex-col gap-0.5 px-4 py-3 transition-colors"
            style={{ borderBottom: `1px solid ${NAV_BORDER}` }}
            onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span className="text-sm font-medium" style={{ color: NAVY }}>
              {item.label}
            </span>
            {item.desc && (
              <span className="text-xs" style={{ color: "#64748b" }}>
                {item.desc}
              </span>
            )}
          </Link>
        )
      )}
    </div>
  );
}

function UserMenu({
  initials,
  open,
  onToggle,
  onClose,
  onSignOut,
}: {
  initials: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer transition-opacity hover:opacity-90"
        style={{
          background: SURFACE,
          border: `1px solid ${NAV_BORDER}`,
          color: NAVY,
        }}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials}
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-44 rounded-xl overflow-hidden shadow-lg z-50"
          style={{
            background: "#ffffff",
            border: `1px solid ${NAV_BORDER}`,
          }}
        >
          <Link
            href="/dashboard/account"
            onClick={onClose}
            className="block px-4 py-3 text-sm font-medium transition-colors"
            style={{ color: NAVY, borderBottom: `1px solid ${NAV_BORDER}` }}
            onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            My Account
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="block w-full text-left px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
            style={{ color: NAVY }}
            onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <img
        src="/brand/logo_icon.png"
        alt=""
        width={32}
        height={32}
        className="shrink-0 object-contain"
      />
      <span
        className="text-lg sm:text-xl font-bold tracking-tight"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <span style={{ color: NAVY }}>ruled</span>
        <span style={{ color: BLUE }}>.ca</span>
      </span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
      const user = data.user;
      setSignedIn(!!user);
      if (!user) {
        setUserInitials("U");
        return;
      }
      let initials = (user.email?.[0] ?? "U").toUpperCase();
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const fromName = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`
        .toUpperCase()
        .slice(0, 2);
      if (fromName) initials = fromName;
      setUserInitials(initials);
    } catch {
      setSignedIn(false);
      setUserInitials("U");
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      setSignedIn(false);
      setMobileOpen(false);
      setUserMenuOpen(false);
      router.push("/");
    }
  }

  useEffect(() => {
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
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
    setUserMenuOpen(false);
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

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const showMarketingNav = !pathname.startsWith("/dashboard");

  const scrollToHowItWorks = useCallback(() => {
    if (pathname === "/") {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      try {
        sessionStorage.setItem("ruled_pending_scroll", "how-it-works");
      } catch {
        /* ignore */
      }
      router.push("/");
    }
  }, [pathname, router]);

  useEffect(() => {
    if (pathname !== "/") return;
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem("ruled_pending_scroll");
    } catch {
      return;
    }
    if (pending !== "how-it-works") return;
    try {
      sessionStorage.removeItem("ruled_pending_scroll");
    } catch {
      /* ignore */
    }
    const id = window.setTimeout(() => {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(id);
  }, [pathname]);

  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  function navLinkColor(active: boolean) {
    return active ? BLUE : NAVY;
  }

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 w-full border-b"
      style={{ background: "#ffffff", borderColor: NAV_BORDER }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center min-w-0 relative">
        <div className="shrink-0">
          <Logo />
        </div>

        {showMarketingNav && (
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {NAV_ITEMS.map((item) => {
              const isOpen = openDropdown === item.label;
              return (
                <div key={item.label} className="relative">
                  {item.dropdown ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setOpenDropdown(isOpen ? null : item.label);
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                      style={{ color: navLinkColor(isOpen) }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = BLUE)}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = navLinkColor(isOpen);
                      }}
                    >
                      {item.label}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                        style={{
                          transform: isOpen ? "rotate(180deg)" : "none",
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
                      style={{ color: NAVY }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = BLUE)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = NAVY)}
                    >
                      {item.label}
                    </Link>
                  )}
                  {item.dropdown && isOpen && (
                    <Dropdown
                      items={item.dropdown}
                      onClose={() => setOpenDropdown(null)}
                      onScrollToHowItWorks={scrollToHowItWorks}
                    />
                  )}
                </div>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-4 sm:px-5 py-2.5 min-h-11 text-sm font-semibold transition-opacity hover:opacity-90 inline-flex items-center justify-center"
                style={{ background: BLUE, color: "#ffffff" }}
              >
                Dashboard
              </Link>
              <div className="hidden md:block">
                <UserMenu
                  initials={userInitials}
                  open={userMenuOpen}
                  onToggle={() => {
                    setOpenDropdown(null);
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  onClose={() => setUserMenuOpen(false)}
                  onSignOut={handleSignOut}
                />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-sm transition-colors"
                style={{ color: NAVY }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BLUE)}
                onMouseLeave={(e) => (e.currentTarget.style.color = NAVY)}
              >
                Sign In
              </Link>
              <Link
                href="/onboarding"
                className="rounded-full px-4 sm:px-5 py-2.5 min-h-11 text-sm font-semibold transition-opacity hover:opacity-90 inline-flex items-center justify-center whitespace-nowrap"
                style={{ background: BLUE, color: "#ffffff" }}
              >
                Get Started
              </Link>
            </>
          )}

          {showMarketingNav && (
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex flex-col gap-1.5 items-center justify-center min-w-11 min-h-11 p-2 cursor-pointer -mr-1"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block w-5 h-0.5"
                  style={{ background: NAVY }}
                />
              ))}
            </button>
          )}
        </div>
      </div>

      {showMarketingNav && mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-4 flex flex-col gap-1 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
          style={{ background: "#ffffff", borderColor: NAV_BORDER }}
        >
          {NAV_ITEMS.map((item) =>
            item.dropdown ? (
              <div key={item.label}>
                <p
                  className="text-xs font-semibold tracking-widest uppercase px-2 py-2"
                  style={{ color: BLUE }}
                >
                  {item.label}
                </p>
                {item.dropdown.map((sub) =>
                  sub.scrollToId === "how-it-works" ? (
                    <button
                      key={sub.label}
                      type="button"
                      className="block w-full text-left px-4 py-3 min-h-11 text-sm rounded-lg cursor-pointer"
                      style={{ color: NAVY }}
                      onClick={() => {
                        setMobileOpen(false);
                        scrollToHowItWorks();
                      }}
                    >
                      {sub.label}
                    </button>
                  ) : (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="block px-4 py-3 min-h-11 text-sm rounded-lg flex items-center"
                      style={{ color: NAVY }}
                      onClick={() => setMobileOpen(false)}
                    >
                      {sub.label}
                    </Link>
                  )
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className="block px-2 py-3 min-h-11 text-sm rounded-lg flex items-center"
                style={{ color: NAVY }}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
          <div
            className="mt-2 pt-4 flex flex-col gap-2"
            style={{ borderTop: `1px solid ${NAV_BORDER}` }}
          >
            {signedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="block rounded-full px-4 py-3 min-h-12 text-sm font-semibold text-center flex items-center justify-center"
                  style={{ background: BLUE, color: "#ffffff" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <div
                  className="flex items-center gap-3 px-2 py-2 mt-1"
                  style={{ borderTop: `1px solid ${NAV_BORDER}` }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: SURFACE,
                      border: `1px solid ${NAV_BORDER}`,
                      color: NAVY,
                    }}
                  >
                    {userInitials}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <Link
                      href="/dashboard/account"
                      className="text-sm font-medium"
                      style={{ color: NAVY }}
                      onClick={() => setMobileOpen(false)}
                    >
                      My Account
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="text-sm text-left cursor-pointer"
                      style={{ color: NAVY }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-2 py-3 min-h-11 text-sm" style={{ color: NAVY }}>
                  Sign In
                </Link>
                <Link
                  href="/onboarding"
                  className="block rounded-full px-4 py-3 min-h-12 text-sm font-semibold text-center flex items-center justify-center"
                  style={{ background: BLUE, color: "#ffffff" }}
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
