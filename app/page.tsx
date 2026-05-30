"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const NAVY = "#0A0F1E";
const NAVY2 = "#0D1220";
const GOLD = "#D4A853";
const GOLD_LIGHT = "#E8C47A";
const MUTED = "rgba(255,255,255,0.55)";
const BORDER = "rgba(255,255,255,0.08)";
const GREEN = "#10B981";
const PF = "var(--font-playfair), 'Playfair Display', serif";

const PROVINCES = [
  "Ontario", "British Columbia", "Alberta", "Quebec",
  "Nova Scotia", "New Brunswick", "Manitoba",
  "Saskatchewan", "Prince Edward Island", "Newfoundland and Labrador",
];

const FAQ_ITEMS = [
  {
    q: "Is this legal advice?",
    a: "No. Ruled provides legal information, not legal advice. We are not a law firm.",
  },
  {
    q: "What if I lose in court?",
    a: "In small claims court each party generally pays their own costs. You will not be on the hook for the other side's legal fees in most cases.",
  },
  {
    q: "How long does it take?",
    a: "Your free case assessment takes about 3 minutes. Your demand letter is ready within minutes of purchase.",
  },
  {
    q: "Which provinces are supported?",
    a: "All 10 Canadian provinces. Every document is tailored to your province's rules, limits, and filing process.",
  },
  {
    q: "What if they do not respond to the demand letter?",
    a: "You move to file in small claims court. Our Full Case Pack gives you everything you need — filing instructions, court documents, and hearing prep.",
  },
  {
    q: "Is my information private?",
    a: "Yes. Your case details are stored securely and never shared. Only you can access your assessments through your account.",
  },
  {
    q: "Do I need a lawyer?",
    a: "No. Small claims court is designed for self-represented parties. Ruled gives you everything a lawyer would prepare at a fraction of the cost.",
  },
  {
    q: "How long does the whole process take?",
    a: "A demand letter gives 14 days to respond. Small claims hearings are typically scheduled within 3 to 6 months of filing.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        padding: "28px 32px",
        border: `1px solid ${BORDER}`,
        cursor: "pointer",
        background: open ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "background 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,83,0.2)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <span style={{ fontSize: "15px", fontWeight: 500, color: "#ffffff", lineHeight: 1.5 }}>{q}</span>
        <span style={{
          color: GOLD,
          fontSize: "20px",
          lineHeight: 1,
          flexShrink: 0,
          transition: "transform 0.2s",
          transform: open ? "rotate(45deg)" : "none",
          userSelect: "none",
        }}>+</span>
      </div>
      {open && (
        <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.7, marginTop: "12px" }}>{a}</p>
      )}
    </div>
  );
}

function SectionEyebrow({ label, lines = false, align = "center" }: { label: string; lines?: boolean; align?: "center" | "left" }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: align === "center" ? "center" : "flex-start",
      gap: "16px",
      marginBottom: "20px",
    }}>
      {lines && <span style={{ display: "block", width: "40px", height: "1px", background: GOLD, opacity: 0.5 }} />}
      <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: GOLD }}>
        {label}
      </span>
      {lines && <span style={{ display: "block", width: "40px", height: "1px", background: GOLD, opacity: 0.5 }} />}
    </div>
  );
}

export default function Home() {
  const scoreCircleRef = useRef<SVGCircleElement>(null);
  const scoreNumRef = useRef<HTMLDivElement>(null);
  const scoreSectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // Fade-up observer for general sections
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-fade]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const delay = el.dataset.delay ?? "0";
            el.style.transition = `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Education panels — fade in and out
  useEffect(() => {
    const panels = document.querySelectorAll<HTMLElement>("[data-edu]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          } else {
            el.style.opacity = "0";
            el.style.transform = "translateY(30px)";
          }
        });
      },
      { threshold: 0.3 }
    );
    panels.forEach((p) => observer.observe(p));
    return () => observer.disconnect();
  }, []);

  // Step cards with stagger
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>("[data-step]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const delay = el.dataset.stepDelay ?? "0";
            el.style.transition = `opacity 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms`;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.2 }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  // Score meter animation
  useEffect(() => {
    const el = scoreSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (scoreCircleRef.current) {
            scoreCircleRef.current.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)";
            scoreCircleRef.current.style.strokeDashoffset = "73";
          }
          let count = 0;
          const interval = setInterval(() => {
            count += 2;
            if (count >= 82) { count = 82; clearInterval(interval); }
            if (scoreNumRef.current) scoreNumRef.current.textContent = String(count);
          }, 20);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Video autoplay on scroll into view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const fade = (delay?: number): React.CSSProperties => ({
    opacity: 0,
    transform: "translateY(32px)",
    ...(delay !== undefined ? { "--delay": `${delay}ms` } as React.CSSProperties : {}),
  });

  const stepInit: React.CSSProperties = { opacity: 0, transform: "translateY(40px)" };

  return (
    <>
      <style>{`
        @keyframes pulse-down {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.4; }
          50% { transform: translateX(-50%) translateY(6px); opacity: 0.7; }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      <div style={{ background: NAVY, color: "#ffffff", overflowX: "hidden" }}>

        {/* ── HERO ── */}
        <section style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "120px 48px 80px",
          position: "relative",
          overflow: "hidden",
          background: NAVY,
        }}>
          {/* Glow */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(212,168,83,0.07) 0%, transparent 70%)",
          }} />

          <div style={{
            maxWidth: "1200px", margin: "0 auto", width: "100%",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px",
            alignItems: "center", position: "relative",
          }}>
            {/* Left */}
            <div>
              {/* Eyebrow */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
                <span style={{ display: "block", width: "32px", height: "1px", background: GOLD }} />
                <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: GOLD }}>
                  Canadian Small Claims Assistance Platform
                </span>
              </div>

              {/* Headline */}
              <div style={{ marginBottom: "28px" }}>
                <h1 style={{
                  fontFamily: PF, fontSize: "clamp(52px, 7vw, 88px)",
                  fontWeight: 900, lineHeight: 1.0, letterSpacing: "-2px",
                  color: "#ffffff", margin: 0,
                }}>
                  You have rights.
                </h1>
                <h1 style={{
                  fontFamily: PF, fontSize: "clamp(52px, 7vw, 88px)",
                  fontWeight: 900, lineHeight: 1.0, letterSpacing: "-2px",
                  color: GOLD, fontStyle: "italic", margin: 0,
                }}>
                  Use them.
                </h1>
              </div>

              {/* Subtext */}
              <p style={{
                fontSize: "17px", fontWeight: 300, color: "rgba(255,255,255,0.65)",
                lineHeight: 1.65, maxWidth: "520px", marginBottom: "44px",
              }}>
                We give you <strong style={{ fontWeight: 700, color: "#ffffff" }}>the tools and confidence to get your money back</strong> — without paying $400 an hour for a lawyer. AI-powered case assessment, demand letters, and full court prep. Flat fee.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
                <Link
                  href="/onboarding"
                  style={{
                    background: GOLD, color: NAVY, fontSize: "13px", fontWeight: 700,
                    letterSpacing: "1.8px", textTransform: "uppercase",
                    padding: "16px 36px", borderRadius: "6px", textDecoration: "none",
                    display: "inline-flex", alignItems: "center", gap: "10px",
                    transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1), background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(-3px)";
                    el.style.boxShadow = "0 12px 32px rgba(212,168,83,0.35)";
                    el.style.background = GOLD_LIGHT;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "";
                    el.style.boxShadow = "";
                    el.style.background = GOLD;
                  }}
                >
                  Assess My Case Free
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <a
                  href="#how-it-works"
                  onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}
                  style={{ color: MUTED, fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
                >
                  See how it works
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </a>
              </div>
            </div>

            {/* Right — browser mockup */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                width: "100%", maxWidth: "540px",
                transform: "rotate(-1.5deg) translateY(10px)",
                borderRadius: "12px", overflow: "hidden",
                boxShadow: "0 30px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
                background: "#1E293B",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#0F172A", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", display: "block" }} />
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B", display: "block" }} />
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981", display: "block" }} />
                  </div>
                  <div style={{ flex: 1, background: "#1E293B", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                    ruled.ca
                  </div>
                </div>
                <Image
                  src="/brand/product-screenshot.png.PNG"
                  alt="Ruled.ca product interface"
                  width={1753}
                  height={1271}
                  className="w-full h-auto block"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: "absolute", bottom: "36px", left: "50%",
            animation: "pulse-down 2s ease-in-out infinite",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </div>
        </section>

        {/* ── EDUCATION STATS — sticky scroll ── */}
        <section style={{ position: "relative" }}>
          {[
            {
              bg: NAVY,
              num: "180,000+",
              numStyle: {},
              label: (<>small claims court cases are filed in Canada <strong>every single year.</strong></>),
              detail: "From contractors who disappear to landlords who keep deposits — Canadians are owed money every day. The system exists to help you get it back.",
            },
            {
              bg: NAVY2,
              num: "70%",
              numStyle: {},
              label: (<>of people who are owed money <strong>never do anything about it.</strong></>),
              detail: "Not because they do not have a case. Because the process feels complicated, expensive, and overwhelming. Most people do not even know where to start — and that is exactly the position I was in when I built this.",
            },
            {
              bg: NAVY,
              num: "What is a demand letter?",
              numStyle: { fontSize: "clamp(32px,5vw,56px)", letterSpacing: "-1px", marginBottom: "28px" },
              label: (<>A <strong>demand letter</strong> is a formal legal document you send to whoever owes you money. It clearly states what they owe, why they need to pay, and that you will be filing in small claims court if they do not respond within a set timeline.</>),
              detail: "It is your first move. It is professional. And it works more often than you would think.",
            },
            {
              bg: NAVY2,
              num: "40%",
              numStyle: {},
              label: (<>of cases are resolved by a demand letter alone — <strong>before ever going to court.</strong></>),
              detail: "One letter. That is often all it takes. Ruled builds it for you in minutes — personalized to your case, province-specific, and ready to send.",
            },
          ].map((panel, i) => (
            <div
              key={i}
              data-edu="true"
              style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "100px 48px",
                background: panel.bg,
                position: "sticky",
                top: 0,
                opacity: 0,
                transform: "translateY(30px)",
                transition: "opacity 0.8s ease, transform 0.8s ease",
              }}
            >
              <div style={{ maxWidth: "780px", textAlign: "center" }}>
                <div style={{
                  fontFamily: PF,
                  fontSize: "clamp(72px,12vw,140px)",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: GOLD,
                  letterSpacing: "-4px",
                  marginBottom: "20px",
                  ...panel.numStyle,
                }}>
                  {panel.num}
                </div>
                <p style={{ fontSize: "clamp(18px,2.5vw,26px)", fontWeight: 300, color: "#ffffff", lineHeight: 1.4, maxWidth: "600px", margin: "0 auto 0" }}>
                  {panel.label}
                </p>
                <div style={{ width: "48px", height: "2px", background: GOLD, margin: "32px auto", opacity: 0.5 }} />
                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.7, maxWidth: "500px", margin: "0 auto" }}>
                  {panel.detail}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* ── THREE STEPS ── */}
        <section id="how-it-works" style={{ padding: "120px 48px", background: NAVY, scrollMarginTop: "68px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <SectionEyebrow label="The Process" lines />
            <h2
              data-fade
              data-delay="0"
              style={{
                ...fade(0),
                fontFamily: PF, fontSize: "clamp(36px,4vw,52px)", fontWeight: 700,
                textAlign: "center", marginBottom: "16px", lineHeight: 1.15,
              }}
            >
              Three steps to fighting back.
            </h2>
            <p
              data-fade
              data-delay="100"
              style={{
                ...fade(100),
                textAlign: "center", color: MUTED, fontSize: "16px",
                maxWidth: "480px", margin: "0 auto 72px", lineHeight: 1.6,
              }}
            >
              No legal jargon. No confusing forms. Just a clear path from frustrated to paid.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
              {[
                {
                  num: "01",
                  title: "Tell us what happened.",
                  desc: "Answer a few straightforward questions about your situation. Who owes you money, what happened, what evidence you have. No legal knowledge required — just the facts.",
                  badge: "Free, takes 3 minutes",
                  delay: "0",
                },
                {
                  num: "02",
                  title: "Get your case strength score.",
                  desc: "Our AI analyzes your situation and gives you an instant case strength score. Know exactly where you stand, what evidence strengthens your position, and what risks to expect — before spending a cent.",
                  badge: "Instant results",
                  delay: "150",
                },
                {
                  num: "03",
                  title: "Send the demand letter.",
                  desc: "Get a professionally drafted, province-specific demand letter built around your case. Download it, send it. If they do not respond, we prep you for court — filing instructions, scripts, everything.",
                  badge: "From $49",
                  delay: "300",
                },
              ].map((card) => (
                <div
                  key={card.num}
                  data-step
                  data-step-delay={card.delay}
                  style={{
                    ...stepInit,
                    padding: "48px 40px",
                    border: `1px solid ${BORDER}`,
                    position: "relative",
                    cursor: "default",
                    transition: "border-color 0.3s, background 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,83,0.3)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = BORDER;
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <div style={{ fontFamily: PF, fontSize: "72px", fontWeight: 900, color: "rgba(212,168,83,0.15)", lineHeight: 1, marginBottom: "24px", letterSpacing: "-3px" }}>
                    {card.num}
                  </div>
                  <h3 style={{ fontFamily: PF, fontSize: "22px", fontWeight: 700, marginBottom: "14px", color: "#ffffff" }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.75, marginBottom: "20px" }}>
                    {card.desc}
                  </p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: GOLD }}>
                    <span style={{ display: "block", width: "16px", height: "1px", background: GOLD }} />
                    {card.badge}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CASE STRENGTH PREVIEW ── */}
        <section id="strength-preview" style={{ padding: "120px 48px", background: NAVY2, position: "relative", overflow: "hidden", scrollMarginTop: "68px" }}>
          {/* Gold glow top right */}
          <div style={{ position: "absolute", top: "-200px", right: "-200px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(212,168,83,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>

            {/* Top row — text left, score card right */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start", marginBottom: "32px" }}>

              {/* Left — eyebrow, title, desc, bullets, CTA */}
              <div data-fade style={fade(0)}>
                <SectionEyebrow label="Free Assessment" align="left" />
                <h2 style={{ fontFamily: PF, fontSize: "clamp(32px,3.5vw,46px)", fontWeight: 700, marginBottom: "20px", lineHeight: 1.2 }}>
                  See your case strength instantly.
                </h2>
                <p style={{ color: MUTED, fontSize: "15px", lineHeight: 1.75, marginBottom: "32px" }}>
                  Know exactly where you stand before spending a cent. Our AI reads your situation, weighs your evidence, and gives you a real score — not vague advice.
                </p>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px" }}>
                  {[
                    "Province-specific legal analysis",
                    "Strengths, weaknesses, and realistic outcome",
                    "Clear next steps with no legal jargon",
                    "Completely free — no account required to start",
                  ].map((item) => (
                    <li key={item} style={{ display: "flex", gap: "14px", alignItems: "flex-start", fontSize: "14px", color: "rgba(255,255,255,0.75)" }}>
                      <span style={{ color: GOLD, marginTop: "2px", flexShrink: 0 }}>—</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/onboarding"
                  style={{
                    background: GOLD, color: NAVY, fontSize: "13px", fontWeight: 700,
                    letterSpacing: "1.8px", textTransform: "uppercase",
                    padding: "16px 36px", borderRadius: "6px", textDecoration: "none",
                    display: "inline-flex", alignItems: "center", gap: "10px",
                    transition: "transform 0.25s, box-shadow 0.25s, background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(-3px)";
                    el.style.boxShadow = "0 12px 32px rgba(212,168,83,0.35)";
                    el.style.background = GOLD_LIGHT;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "";
                    el.style.boxShadow = "";
                    el.style.background = GOLD;
                  }}
                >
                  Start My Free Assessment
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>

              {/* Right — score card only */}
              <div data-fade data-delay="150" style={fade(150)} ref={scoreSectionRef}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "40px", position: "relative", overflow: "hidden" }}>
                  {/* Top accent */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

                  {/* Score meter */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
                    <div style={{ position: "relative", width: "160px", height: "160px", marginBottom: "16px" }}>
                      <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        <circle
                          ref={scoreCircleRef}
                          cx="80" cy="80" r="65"
                          fill="none"
                          stroke={GREEN}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="408"
                          strokeDashoffset="408"
                          style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.5))" }}
                        />
                      </svg>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                        <div ref={scoreNumRef} style={{ fontFamily: PF, fontSize: "42px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                          0
                        </div>
                        <div style={{ fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", color: MUTED, marginTop: "4px" }}>
                          Case Strength
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: "14px", color: GREEN, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
                      Strong Case
                    </div>
                  </div>

                  {/* Assessment preview */}
                  <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: "24px" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: GOLD, marginBottom: "12px" }}>
                      Summary
                    </div>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: "10px" }}>
                      You hired a contractor to repair and repaint your deck for $2,400. You paid a $1,200 deposit. They abandoned the job without explanation and stopped responding...
                    </p>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, filter: "blur(4px)", userSelect: "none", pointerEvents: "none" }}>
                      Alberta law requires contractors to complete work as agreed. Your evidence of payment combined with documented abandonment gives you a strong foundation. The written estimate strengthens your position significantly...
                    </p>
                    <div style={{ marginTop: "20px", textAlign: "center" }}>
                      <p style={{ fontSize: "12px", color: MUTED, marginBottom: "12px" }}>
                        Complete your free assessment to unlock your full analysis
                      </p>
                      <Link
                        href="/onboarding"
                        style={{
                          background: GOLD, color: NAVY, fontSize: "11px", fontWeight: 700,
                          letterSpacing: "1.5px", textTransform: "uppercase",
                          padding: "12px 24px", borderRadius: "6px", textDecoration: "none",
                          display: "inline-flex", alignItems: "center", gap: "8px",
                          transition: "transform 0.2s, background 0.2s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = GOLD_LIGHT; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = GOLD; }}
                      >
                        Get My Full Assessment Free
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom row — full-width questionnaire form */}
            <div data-fade data-delay="200" style={{ ...fade(200), background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`, padding: "32px", borderRadius: "8px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: GOLD, marginBottom: "20px" }}>
                Try it now — it is free
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "16px", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: GOLD, marginBottom: "8px" }}>
                    What happened in your own words
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. A contractor took my deposit and never completed the work..."
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
                      borderRadius: "8px", padding: "12px 16px", color: "#ffffff",
                      fontFamily: "inherit", fontSize: "14px", resize: "none", outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,168,83,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                  />
                </div>
                <div style={{ minWidth: "160px" }}>
                  <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: GOLD, marginBottom: "8px" }}>
                    Amount owed
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $3,500"
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
                      borderRadius: "8px", padding: "12px 16px", color: "#ffffff",
                      fontFamily: "inherit", fontSize: "14px", outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,168,83,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                  />
                </div>
                <div style={{ minWidth: "180px" }}>
                  <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: GOLD, marginBottom: "8px" }}>
                    Province
                  </label>
                  <select
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
                      borderRadius: "8px", padding: "12px 16px", color: "#ffffff",
                      fontFamily: "inherit", fontSize: "14px", outline: "none",
                      appearance: "none", cursor: "pointer",
                    }}
                  >
                    <option value="" style={{ background: "#111827" }}>Select...</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p} style={{ background: "#111827" }}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => router.push("/onboarding")}
                    style={{
                      background: GOLD, color: NAVY, border: "none", borderRadius: "8px",
                      padding: "12px 24px", fontFamily: "inherit", fontSize: "13px", fontWeight: 700,
                      letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer",
                      whiteSpace: "nowrap", transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(212,168,83,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "";
                      (e.currentTarget as HTMLElement).style.boxShadow = "";
                    }}
                  >
                    Get My Case Strength Score →
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "11px", color: MUTED, marginTop: "16px" }}>
                <span style={{ flex: 1, height: "1px", background: BORDER }} />
                Free · No account required · Results in 60 seconds
                <span style={{ flex: 1, height: "1px", background: BORDER }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY RULED ── */}
        <section id="vs" style={{ padding: "120px 48px", background: NAVY }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <SectionEyebrow label="Why Ruled" lines />
            <h2 data-fade style={{ ...fade(0), fontFamily: PF, fontSize: "clamp(36px,4vw,52px)", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>
              Why Ruled?
            </h2>
            <p data-fade data-delay="100" style={{ ...fade(100), textAlign: "center", color: MUTED, fontSize: "16px", maxWidth: "480px", margin: "0 auto 60px", lineHeight: 1.6 }}>
              The same outcome. A fraction of the cost.
            </p>

            <div data-fade data-delay="200" style={{ ...fade(200), display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", position: "relative" }}>
              {/* Traditional Lawyer */}
              <div style={{ padding: "40px", border: `1px solid ${BORDER}` }}>
                <div style={{ fontFamily: PF, fontSize: "20px", fontWeight: 700, marginBottom: "28px", color: MUTED }}>
                  Traditional Lawyer
                </div>
                {[
                  "$300 to $500 per hour",
                  "Weeks or months to get started",
                  "Intimidating and confusing process",
                  "Minimum $2,000 to $5,000 before anything happens",
                  "No guarantee of outcome",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 0", borderBottom: `1px solid ${BORDER}`, fontSize: "14px", color: MUTED, lineHeight: 1.5 }}>
                    <span style={{ color: "rgba(255,80,80,0.7)", fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>✕</span>
                    {item}
                  </div>
                ))}
              </div>

              {/* Ruled */}
              <div style={{ padding: "40px", border: `1px solid rgba(212,168,83,0.5)`, background: "rgba(212,168,83,0.04)", position: "relative" }}>
                <div style={{
                  position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                  background: GOLD, color: NAVY, fontSize: "10px", fontWeight: 700,
                  letterSpacing: "2px", padding: "4px 14px", borderRadius: "2px",
                }}>
                  RULED
                </div>
                <div style={{ fontFamily: PF, fontSize: "20px", fontWeight: 700, marginBottom: "28px", color: "#ffffff" }}>
                  Ruled
                </div>
                {[
                  "Flat fee — free to start, $49 or $199",
                  "Ready in minutes, not months",
                  "Plain language, step by step",
                  "No commitment until you are ready",
                  "Built specifically for small claims court",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 0", borderBottom: `1px solid ${BORDER}`, fontSize: "14px", color: "#ffffff", lineHeight: 1.5 }}>
                    <span style={{ color: GOLD, fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "48px" }}>
              <Link
                href="/onboarding"
                style={{
                  background: GOLD, color: NAVY, fontSize: "13px", fontWeight: 700,
                  letterSpacing: "1.8px", textTransform: "uppercase",
                  padding: "16px 36px", borderRadius: "6px", textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: "10px",
                  transition: "transform 0.25s, box-shadow 0.25s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-3px)";
                  el.style.boxShadow = "0 12px 32px rgba(212,168,83,0.35)";
                  el.style.background = GOLD_LIGHT;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "";
                  el.style.boxShadow = "";
                  el.style.background = GOLD;
                }}
              >
                Start Free — See If You Have a Case
              </Link>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" style={{ padding: "120px 48px", background: NAVY2, scrollMarginTop: "68px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <SectionEyebrow label="Pricing" lines />
            <h2 data-fade style={{ ...fade(0), fontFamily: PF, fontSize: "clamp(36px,4vw,52px)", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>
              Simple flat-fee pricing. No surprises.
            </h2>
            <p data-fade data-delay="100" style={{ ...fade(100), textAlign: "center", color: MUTED, fontSize: "16px", maxWidth: "480px", margin: "0 auto 60px", lineHeight: 1.6 }}>
              Pay only for what you need. Start free — upgrade when you are ready.
            </p>

            <div data-fade data-delay="200" style={{ ...fade(200), display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
              {[
                {
                  tier: "FREE",
                  price: "$0",
                  desc: "Know where you stand before spending anything.",
                  features: ["Full AI case analysis", "Case strength score", "Province-specific assessment", "Strengths and weaknesses", "Clear next steps"],
                  btnLabel: "Start Free Assessment",
                  btnStyle: "outline" as const,
                  featured: false,
                },
                {
                  tier: "DEMAND LETTER",
                  price: "$49",
                  desc: "A professionally drafted letter that resolves 40% of cases.",
                  features: ["Everything in Free", "Province-specific demand letter", "Legal language and proper formatting", "14-day payment demand", "Step-by-step sending instructions", "Saved to your dashboard"],
                  btnLabel: "Get Your Letter",
                  btnStyle: "filled" as const,
                  featured: true,
                },
                {
                  tier: "FULL CASE PACK",
                  price: "$199",
                  desc: "Everything you need to walk into court prepared.",
                  features: ["Everything in Demand Letter", "Province-specific filing instructions", "All court documents prepared", "Opening and closing hearing scripts", "Anticipated defence arguments", "Day of court checklist", "Unlimited AI case questions"],
                  btnLabel: "Get Full Pack",
                  btnStyle: "outline" as const,
                  featured: false,
                },
              ].map((card) => (
                <div
                  key={card.tier}
                  style={{
                    padding: "40px 36px",
                    border: card.featured ? `1px solid rgba(212,168,83,0.5)` : `1px solid ${BORDER}`,
                    background: card.featured ? "rgba(212,168,83,0.05)" : "transparent",
                    position: "relative",
                    transition: "border-color 0.3s",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => { if (!card.featured) (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,83,0.3)"; }}
                  onMouseLeave={(e) => { if (!card.featured) (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
                >
                  {card.featured && (
                    <div style={{
                      position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                      background: GOLD, color: NAVY, fontSize: "9px", fontWeight: 700,
                      letterSpacing: "2px", padding: "4px 14px", textTransform: "uppercase",
                    }}>
                      Most Popular
                    </div>
                  )}
                  <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: GOLD, marginBottom: "16px" }}>
                    {card.tier}
                  </div>
                  <div style={{ fontFamily: PF, fontSize: "52px", fontWeight: 900, lineHeight: 1, marginBottom: "8px" }}>
                    {card.price}
                  </div>
                  <p style={{ fontSize: "13px", color: MUTED, marginBottom: "28px", lineHeight: 1.5 }}>
                    {card.desc}
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px", flex: 1 }}>
                    {card.features.map((f) => (
                      <li key={f} style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "flex-start", gap: "10px", lineHeight: 1.4 }}>
                        <span style={{ color: GOLD, flexShrink: 0, fontSize: "12px", marginTop: "1px" }}>—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/onboarding"
                    style={{
                      display: "block", textAlign: "center", padding: "13px", marginTop: "auto",
                      borderRadius: "4px", fontSize: "12px", fontWeight: 600,
                      letterSpacing: "1.5px", textTransform: "uppercase", textDecoration: "none",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      ...(card.btnStyle === "filled"
                        ? { background: GOLD, color: NAVY, boxShadow: "0 4px 16px rgba(212,168,83,0.2)" }
                        : { border: `1px solid rgba(212,168,83,0.4)`, color: GOLD, background: "transparent" }),
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
                  >
                    {card.btnLabel}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOUNDER ── */}
        <section id="founder" style={{ padding: "120px 48px", background: NAVY }}>
          <div
            data-fade
            style={{ ...fade(0), maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "380px 1fr", gap: "80px", alignItems: "center" }}
          >
            {/* Founder video */}
            <div style={{ position: "relative" }}>
              <video
                ref={videoRef}
                src="/brand/founder-video.mp4"
                muted
                playsInline
                loop
                controls
                style={{
                  width: "100%",
                  aspectRatio: "3/4",
                  objectFit: "cover",
                  display: "block",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.04)",
                }}
              />
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <div style={{ fontFamily: PF, fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>Finn Varette</div>
                <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: GOLD, marginTop: "4px" }}>Founder</div>
              </div>
            </div>

            {/* Text */}
            <div>
              <SectionEyebrow label="The Story" align="left" />
              <h2 style={{ fontFamily: PF, fontSize: "clamp(22px,2.5vw,30px)", fontWeight: 700, lineHeight: 1.45, color: "#ffffff", marginBottom: "24px", marginTop: "20px" }}>
                Built from a bad experience.<br />
                <em style={{ color: GOLD, fontStyle: "italic" }}>Designed so it does not happen to you.</em>
              </h2>
              <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.8, marginBottom: "20px" }}>
                I built Ruled because I got screwed out of money and had <strong style={{ color: "#ffffff", fontWeight: 500 }}>no idea what to do.</strong> I did not know I could send a demand letter. I did not know I could represent myself in court for a small filing fee. Most people do not.
              </p>
              <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.8, marginBottom: "36px" }}>
                Ruled exists so the next person who gets ripped off — by a contractor, a landlord, a business that did not deliver — <strong style={{ color: "#ffffff", fontWeight: 500 }}>knows exactly what to do and has the tools to fight back.</strong>
              </p>
              <Link
                href="/onboarding"
                style={{
                  background: GOLD, color: NAVY, fontSize: "13px", fontWeight: 700,
                  letterSpacing: "1.8px", textTransform: "uppercase",
                  padding: "16px 36px", borderRadius: "6px", textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: "10px",
                  transition: "transform 0.25s, box-shadow 0.25s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-3px)";
                  el.style.boxShadow = "0 12px 32px rgba(212,168,83,0.35)";
                  el.style.background = GOLD_LIGHT;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "";
                  el.style.boxShadow = "";
                  el.style.background = GOLD;
                }}
              >
                Start My Free Assessment
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" style={{ padding: "120px 48px", background: NAVY2 }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <SectionEyebrow label="Questions" lines />
            <h2 data-fade style={{ ...fade(0), fontFamily: PF, fontSize: "clamp(36px,4vw,52px)", fontWeight: 700, textAlign: "center", marginBottom: "60px" }}>
              Common questions.
            </h2>
            <div data-fade data-delay="100" style={{ ...fade(100), display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ padding: "140px 48px", textAlign: "center", position: "relative", overflow: "hidden", background: NAVY }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: "700px", height: "700px",
            background: "radial-gradient(circle, rgba(212,168,83,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative" }}>
            <h2
              data-fade
              style={{
                ...fade(0),
                fontFamily: PF, fontSize: "clamp(42px,5vw,68px)", fontWeight: 900,
                lineHeight: 1.1, marginBottom: "20px",
              }}
            >
              Ready to fight back?<br />
              <em style={{ color: GOLD, fontStyle: "italic" }}>You do not need a lawyer.</em>
            </h2>
            <p data-fade data-delay="100" style={{ ...fade(100), fontSize: "17px", color: MUTED, maxWidth: "480px", margin: "0 auto 48px", lineHeight: 1.65 }}>
              Get your free case assessment in 60 seconds. Know exactly where you stand before spending anything.
            </p>
            <Link
              href="/onboarding"
              data-fade
              data-delay="200"
              style={{
                ...fade(200),
                background: GOLD, color: NAVY, fontSize: "14px", fontWeight: 700,
                letterSpacing: "1.8px", textTransform: "uppercase",
                padding: "18px 44px", borderRadius: "6px", textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: "10px",
                transition: "transform 0.25s, box-shadow 0.25s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-3px)";
                el.style.boxShadow = "0 12px 32px rgba(212,168,83,0.35)";
                el.style.background = GOLD_LIGHT;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "";
                el.style.boxShadow = "";
                el.style.background = GOLD;
              }}
            >
              Assess My Case Free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <div
              data-fade
              data-delay="300"
              style={{
                ...fade(300),
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "32px", marginTop: "28px", fontSize: "12px", color: MUTED, letterSpacing: "0.5px",
                flexWrap: "wrap",
              }}
            >
              <span>✓ Free to start</span>
              <span>✓ No credit card required</span>
              <span>✓ All 10 provinces</span>
              <span>✓ Results in 60 seconds</span>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding: "60px 48px 40px", borderTop: `1px solid ${BORDER}`, background: NAVY }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>
              {/* Brand */}
              <div>
                <span style={{ fontFamily: PF, fontSize: "20px", fontWeight: 700, display: "block", marginBottom: "12px" }}>
                  <span style={{ color: "#ffffff" }}>ruled</span>
                  <span style={{ color: GOLD }}>.ca</span>
                </span>
                <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.65, maxWidth: "240px" }}>
                  Win without a lawyer. AI-powered small claims court tools for everyday Canadians.
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 style={{ fontSize: "10px", letterSpacing: "2.5px", textTransform: "uppercase", color: GOLD, marginBottom: "18px" }}>
                  Product
                </h4>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { label: "How It Works", href: "/#how-it-works" },
                    { label: "Pricing", href: "/#pricing" },
                    { label: "Demand Letter", href: "/demand-preview" },
                    { label: "Full Case Pack", href: "/full-case-pack-preview" },
                    { label: "Blog", href: "/blog" },
                  ].map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} style={{ fontSize: "13px", color: MUTED, textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 style={{ fontSize: "10px", letterSpacing: "2.5px", textTransform: "uppercase", color: GOLD, marginBottom: "18px" }}>
                  Company
                </h4>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { label: "About", href: "/about" },
                    { label: "Contact", href: "/contact" },
                    { label: "Sign In", href: "/login" },
                  ].map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} style={{ fontSize: "13px", color: MUTED, textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 style={{ fontSize: "10px", letterSpacing: "2.5px", textTransform: "uppercase", color: GOLD, marginBottom: "18px" }}>
                  Legal
                </h4>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { label: "Privacy Policy", href: "/privacy" },
                    { label: "Terms of Service", href: "/terms" },
                  ].map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} style={{ fontSize: "13px", color: MUTED, textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer bottom */}
            <div style={{ paddingTop: "28px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "rgba(255,255,255,0.3)", flexWrap: "wrap", gap: "12px" }}>
              <span>© 2026 Ruled Technologies Inc. All rights reserved.</span>
              <span>Legal information, not legal advice.</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
