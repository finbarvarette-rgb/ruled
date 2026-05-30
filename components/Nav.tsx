"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const GOLD = "#D4A853";
const GOLD_LIGHT = "#E8C47A";
const NAVY = "#0A0F1E";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.75)";
const BORDER = "rgba(255,255,255,0.08)";

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
        style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${BORDER}`, color: WHITE }}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials}
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-44 rounded-xl overflow-hidden shadow-lg z-50"
          style={{ background: "#111827", border: `1px solid ${BORDER}` }}
        >
          <Link
            href="/dashboard/account"
            onClick={onClose}
            className="block px-4 py-3 text-sm font-medium transition-colors"
            style={{ color: WHITE, borderBottom: `1px solid ${BORDER}` }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            My Account
          </Link>
          <button
            type="button"
            onClick={() => { onClose(); onSignOut(); }}
            className="block w-full text-left px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
            style={{ color: WHITE }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  async function refreshAuthState() {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setSignedIn(!!user);
      if (!user) { setUserInitials("U"); return; }
      let initials = (user.email?.[0] ?? "U").toUpperCase();
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const fromName = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase().slice(0, 2);
      if (fromName) initials = fromName;
      setUserInitials(initials);
    } catch {
      setSignedIn(false);
      setUserInitials("U");
    }
  }

  async function handleSignOut() {
    try { await supabase.auth.signOut(); } finally {
      setSignedIn(false); setMobileOpen(false); setUserMenuOpen(false);
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
        setMobileOpen(false); setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false); setUserMenuOpen(false);
    refreshAuthState();
  }, [pathname]);

  useEffect(() => {
    function onFocus() { refreshAuthState(); }
    function onVisibilityChange() { if (document.visibilityState === "visible") refreshAuthState(); }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [supabase]);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 50); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const scrollTo = useCallback((id: string) => {
    setMobileOpen(false);
    if (pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      try { sessionStorage.setItem("ruled_pending_scroll", id); } catch { /* ignore */ }
      router.push("/");
    }
  }, [pathname, router]);

  useEffect(() => {
    if (pathname !== "/") return;
    let pending: string | null = null;
    try { pending = sessionStorage.getItem("ruled_pending_scroll"); } catch { return; }
    if (!pending) return;
    try { sessionStorage.removeItem("ruled_pending_scroll"); } catch { /* ignore */ }
    const id = window.setTimeout(() => {
      document.getElementById(pending!)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(id);
  }, [pathname]);

  if (pathname.startsWith("/dashboard")) return null;

  const navLinkStyle: React.CSSProperties = {
    color: MUTED,
    background: "none",
    border: "none",
    fontSize: "14px",
    fontWeight: 400,
    letterSpacing: "0.3px",
    cursor: "pointer",
    padding: 0,
    transition: "color 0.2s",
  };

  return (
    <header
      ref={navRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "68px",
        background: scrolled ? "rgba(10,15,30,0.92)" : "rgba(10,15,30,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${BORDER}`,
        transition: "background 0.3s ease",
      }}
    >
      <div
        className="max-w-6xl mx-auto px-6 md:px-12 h-full flex items-center justify-between"
      >
        {/* Logo — text only, no icon */}
        <Link href="/" className="shrink-0" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            <span style={{ color: WHITE }}>ruled</span>
            <span style={{ color: GOLD }}>.ca</span>
          </span>
        </Link>

        {/* Center links — desktop */}
        <nav className="hidden md:flex items-center gap-10">
          <button
            type="button"
            style={navLinkStyle}
            onClick={() => scrollTo("how-it-works")}
            onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            How It Works
          </button>
          <button
            type="button"
            style={navLinkStyle}
            onClick={() => scrollTo("strength-preview")}
            onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            Case Assessment
          </button>
          <button
            type="button"
            style={navLinkStyle}
            onClick={() => scrollTo("pricing")}
            onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            Pricing
          </button>
          <Link
            href="/login"
            style={{ color: MUTED, fontSize: "14px", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            Login
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center justify-center"
                style={{
                  background: GOLD,
                  color: NAVY,
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  padding: "10px 24px",
                  borderRadius: "4px",
                  textDecoration: "none",
                  transition: "background 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = GOLD_LIGHT;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = GOLD;
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                Dashboard
              </Link>
              <div className="hidden md:block">
                <UserMenu
                  initials={userInitials}
                  open={userMenuOpen}
                  onToggle={() => setUserMenuOpen(!userMenuOpen)}
                  onClose={() => setUserMenuOpen(false)}
                  onSignOut={handleSignOut}
                />
              </div>
            </>
          ) : (
            <Link
              href="/onboarding"
              className="hidden md:inline-flex items-center justify-center"
              style={{
                background: GOLD,
                color: NAVY,
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                padding: "10px 24px",
                borderRadius: "4px",
                textDecoration: "none",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = GOLD_LIGHT;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = GOLD;
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
            >
              Start Free
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 items-center justify-center w-11 h-11 cursor-pointer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            style={{ background: "none", border: "none" }}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="block w-5 h-0.5" style={{ background: WHITE }} />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden flex flex-col px-6 py-4 overflow-y-auto"
          style={{
            background: "rgba(10,15,30,0.97)",
            borderTop: `1px solid ${BORDER}`,
            maxHeight: "calc(100dvh - 68px)",
          }}
        >
          <button type="button" onClick={() => scrollTo("how-it-works")}
            className="text-left py-3 text-sm border-b cursor-pointer" style={{ color: WHITE, borderColor: BORDER, background: "none", border: "none", borderBottom: `1px solid ${BORDER}` }}>
            How It Works
          </button>
          <button type="button" onClick={() => scrollTo("strength-preview")}
            className="text-left py-3 text-sm cursor-pointer" style={{ color: WHITE, background: "none", border: "none", borderBottom: `1px solid ${BORDER}` }}>
            Case Assessment
          </button>
          <button type="button" onClick={() => scrollTo("pricing")}
            className="text-left py-3 text-sm cursor-pointer" style={{ color: WHITE, background: "none", border: "none", borderBottom: `1px solid ${BORDER}` }}>
            Pricing
          </button>
          <Link href="/login" className="block py-3 text-sm" style={{ color: WHITE, borderBottom: `1px solid ${BORDER}` }} onClick={() => setMobileOpen(false)}>
            Login
          </Link>
          <div className="mt-4 pt-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            {signedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="block text-center rounded py-3 text-sm font-semibold"
                  style={{ background: GOLD, color: NAVY, letterSpacing: "1.5px", textTransform: "uppercase" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-3 py-2 mt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${BORDER}`, color: WHITE }}>
                    {userInitials}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link href="/dashboard/account" className="text-sm font-medium" style={{ color: WHITE }} onClick={() => setMobileOpen(false)}>My Account</Link>
                    <button type="button" onClick={handleSignOut} className="text-sm text-left cursor-pointer" style={{ color: MUTED, background: "none", border: "none" }}>Sign Out</button>
                  </div>
                </div>
              </>
            ) : (
              <Link
                href="/onboarding"
                className="block text-center rounded py-3 text-sm font-semibold"
                style={{ background: GOLD, color: NAVY, letterSpacing: "1.5px", textTransform: "uppercase" }}
                onClick={() => setMobileOpen(false)}
              >
                Start Free
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
