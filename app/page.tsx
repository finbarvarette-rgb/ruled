"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const NAVY = "#0F172A";
const BLUE = "#C8392B";
const SUBTEXT = "#4B5563";
const SURFACE = "#F1F5F9";
const GREEN = "#10B981";
const AMBER = "#F59E0B";
const CARD_SHADOW = "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)";

const PRICING_TIERS = [
  {
    subtitle: "Case Assessment",
    price: "Free",
    popular: false,
    trustLine: "No account required to start",
    features: [
      "AI analysis of your case strength",
      "Evidence checklist",
      "Recommended next step",
      "Province-specific filing information",
    ],
    cta: "Start Free Assessment",
    href: "/onboarding",
  },
  {
    subtitle: "Demand Letter",
    price: "$49",
    popular: false,
    trustLine: "Delivered in minutes after payment",
    features: [
      "Everything in Free",
      "Professional demand letter drafted to your case",
      "14-day payment demand with legal language",
      "Ready to send within minutes",
      "Resolves 40% of cases before court",
    ],
    cta: "Start Free — Upgrade After →",
    href: "/onboarding",
  },
  {
    subtitle: "Full Case Pack",
    price: "$199",
    popular: true,
    trustLine: "Everything you need to walk into court ready",
    features: [
      "Everything in Demand Letter",
      "Province-specific court filing documents",
      "Step-by-step filing instructions",
      "Complete hearing preparation script",
      "Word-for-word opening and closing statements",
      "Anticipated defence arguments and rebuttals",
      "Unlimited AI Q&A about your case",
      "Download all documents",
    ],
    cta: "Start Free — Upgrade After →",
    href: "/onboarding",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "Is this legal advice?",
    answer:
      "No. Ruled provides legal information, not legal advice. We are not a law firm and do not represent you in court.",
  },
  {
    question: "How long does it take?",
    answer:
      "Your free case assessment takes about 60 seconds. Paid products are delivered within minutes of payment.",
  },
  {
    question: "What if the other person doesn't respond to the demand letter?",
    answer:
      "If they don't pay or respond within 14 days, your next step is filing in small claims court. Your free assessment already analyzed your case — the Full Case Pack ($199) gives you court documents, filing instructions, and hearing prep so you're ready.",
  },
  {
    question: "How long does the whole process take?",
    answer:
      "Many cases resolve within 2–6 weeks after sending a demand letter. If you need to go to court, hearings are often scheduled a few months after filing, depending on your province and courthouse backlog.",
  },
  {
    question: "What if I lose?",
    answer:
      "We cannot guarantee outcomes. Small claims court decisions depend on your facts, evidence, and how the judge applies the law.",
  },
  {
    question: "Which provinces are supported?",
    answer:
      "All Canadian provinces. Guidance is tailored to your province's small claims rules and procedures.",
  },
  {
    question: "Can businesses use Ruled?",
    answer:
      "Yes. Contractors, landlords, and small businesses use Ruled for unpaid invoices, deposits, and contract disputes.",
  },
  {
    question: "Is my information private?",
    answer:
      "Yes. Your case details are stored securely. See our privacy policy for full details.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col flex-1" style={{ background: "#ffffff", color: NAVY }}>

      {/* Hero — white background */}
      <section
        className="relative flex flex-col justify-center px-4 sm:px-6 py-16 md:py-24 overflow-hidden"
        style={{ background: "#ffffff" }}
      >
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16 items-center">
          <div className="flex flex-col gap-8 order-2 lg:order-1">
            <div className="flex flex-col gap-2">
              <h1
                className="font-bold tracking-tight leading-[1.05]"
                style={{ fontSize: "clamp(40px, 5.5vw, 80px)", color: NAVY }}
              >
                We give you the tools to get your money back. Fast.
              </h1>
              <p
                className="font-bold tracking-tight leading-[1.05]"
                style={{ fontSize: "clamp(40px, 5.5vw, 80px)", color: BLUE }}
              >
                Win without a lawyer.
              </p>
            </div>
            <p className="text-lg leading-relaxed max-w-lg" style={{ color: SUBTEXT }}>
              Tell us what happened. Our AI builds your case, drafts your demand letter, and prepares you for court — in minutes.
            </p>
            <p className="text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: SUBTEXT }}>
              ⭐⭐⭐⭐⭐ Trusted across all 10 provinces · Free to start · No credit card required
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/onboarding"
                className="min-h-12 rounded-full px-7 py-3.5 text-base font-semibold text-center flex items-center justify-center whitespace-nowrap"
                style={{ background: BLUE, color: "#ffffff" }}
              >
                Free Case Assessment →
              </Link>
              <Link
                href="#how-it-works"
                className="min-h-12 rounded-full px-7 py-3.5 text-base font-semibold text-center flex items-center justify-center whitespace-nowrap"
                style={{ color: NAVY, border: `1.5px solid ${NAVY}`, background: "transparent" }}
              >
                See How It Works
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div
              className="w-full"
              style={{
                maxWidth: "540px",
                transform: "rotate(-1.5deg) translateY(10px)",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(15,23,42,0.08)",
                background: "#1E293B",
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 14px",
                background: "#0F172A",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", display: "block" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B", display: "block" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981", display: "block" }} />
                </div>
                <div style={{
                  flex: 1, background: "#1E293B", borderRadius: "6px",
                  padding: "3px 10px", fontSize: "11px",
                  color: "rgba(255,255,255,0.35)", fontFamily: "monospace",
                }}>
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
      </section>

      {/* Stats — dark navy with texture */}
      <section
        className="px-4 sm:px-6 py-16 md:py-20 relative overflow-hidden"
        style={{
          backgroundColor: NAVY,
          backgroundImage: "url(/brand/stats_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 text-center relative z-10">
          <Stat icon="gavel" value="3M+" label="Canadians owed money every year who never see it back" />
          <Stat icon="trophy" value="76%" label="of claimants win when properly prepared" />
          <Stat icon="chart" value="40%" label="Resolve Before Court" />
          <StatAlert value="67%" label="Give up without a fight. You don't have to." />
        </div>
      </section>

      {/* Problem */}
      <section className="px-4 sm:px-6 py-20 md:py-28" style={{ background: "#ffffff" }}>
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight leading-tight"
            style={{ color: NAVY }}
          >
            You got screwed. You&apos;re not alone.
          </h2>
          <p className="text-xl leading-relaxed" style={{ color: SUBTEXT }}>
            Every year, millions of Canadians lose money to contractors who disappear, landlords who keep deposits, and businesses that don&apos;t deliver. Most do nothing — because the system feels too complicated, too expensive, and too intimidating. Ruled changes that.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 sm:px-6 py-16 md:py-20" style={{ background: "#F8F7F4" }}>
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight" style={{ color: NAVY }}>
            Why Ruled?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-7 flex flex-col gap-5" style={{ background: "#ffffff", border: "1px solid #E2E8F0" }}>
              <h3 className="font-bold text-lg text-center pb-4" style={{ color: NAVY, borderBottom: "1px solid #E2E8F0" }}>
                Traditional Lawyer
              </h3>
              <ul className="flex flex-col gap-4">
                {[
                  "$300–500/hour",
                  "Weeks or months to get started",
                  "Intimidating and confusing",
                  "No guarantee of outcome",
                  "Minimum $2,000–5,000 to start",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: SUBTEXT }}>
                    <XMarkIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-7 flex flex-col gap-5" style={{ background: "#ffffff", border: `2px solid ${BLUE}` }}>
              <h3 className="font-bold text-lg text-center pb-4" style={{ color: BLUE, borderBottom: "1px solid rgba(200,57,43,0.2)" }}>
                Ruled
              </h3>
              <ul className="flex flex-col gap-4">
                {[
                  "Flat fee — $49 or $199",
                  "Ready in minutes",
                  "Plain language, step by step",
                  "AI-powered and built for small claims",
                  "Free to start, no commitment",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium" style={{ color: NAVY }}>
                    <RedCheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex justify-center">
            <Link
              href="/onboarding"
              className="min-h-12 rounded-full px-8 py-3.5 text-base font-semibold inline-flex items-center justify-center"
              style={{ background: BLUE, color: "#ffffff" }}
            >
              Start Free — See If You Have a Case
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="px-4 sm:px-6 py-16 md:py-24 scroll-mt-16"
        style={{ background: "#ffffff" }}
      >
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-14">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight" style={{ color: NAVY }}>
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <StepCard
              step={1}
              title="Tell Your Story"
              description="Describe what happened in plain language. No legal jargon needed — just the facts."
            />
            <StepCard
              step={2}
              title="AI Analysis"
              description="Our AI instantly analyzes your case strength, evidence, and next steps tailored to your province."
            />
            <StepCard
              step={3}
              title="Get Paid"
              description="Send your demand letter or take it to court fully prepared. Get what you're owed."
            />
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="px-4 sm:px-6 py-16 md:py-20" style={{ background: "#ffffff" }}>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight" style={{ color: NAVY }}>
            Everything you need. Nothing you don&apos;t.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <WhatYouGetCard
              title="Free Case Assessment"
              price={null}
              description="AI analyzes your situation and tells you exactly where you stand. No fluff."
              imageSrc="/brand/product-screenshot.png"
            />
            <WhatYouGetCard
              title="Demand Letter"
              price="$49"
              description="A legally formatted letter that gets results. 40% of cases resolve here."
              imageSrc="/brand/demand-preview-screenshot.png"
            />
            <WhatYouGetCard
              title="Full Case Pack"
              price="$199"
              description="Everything to walk into court and win. Filing instructions, scripts, documents."
              imageSrc="/brand/product-screenshot.png"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-16 md:py-24 scroll-mt-16" style={{ background: "#F8F7F4" }}>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight" style={{ color: NAVY }}>
            Simple Flat-Fee Pricing. No surprises.
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {PRICING_TIERS.map((tier) => (
              <PricingTierCard key={tier.subtitle} tier={tier} />
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="px-4 sm:px-6 py-16 md:py-24" style={{ background: "#ffffff" }}>
        <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="flex flex-col items-center md:items-start gap-3 shrink-0">
            <div
              className="rounded-2xl w-48 md:w-56"
              style={{ background: SURFACE, border: "1px solid #E2E8F0", aspectRatio: "3/4" }}
            />
            <span className="text-sm" style={{ color: "#64748B" }}>Finn Varette — Founder</span>
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight" style={{ color: NAVY }}>
              Built from a bad experience.
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: SUBTEXT }}>
              I built Ruled because I got screwed out of money and had no idea what to do. I didn&apos;t know I could send a demand letter. I didn&apos;t know I could represent myself in court for a small filing fee. Most people don&apos;t. Ruled exists so that the next person who gets ripped off knows exactly what to do — and has the tools to fight back.
            </p>
            <Link
              href="/onboarding"
              className="min-h-12 rounded-full px-7 py-3.5 text-base font-semibold inline-flex items-center justify-center self-start"
              style={{ background: BLUE, color: "#ffffff" }}
            >
              Start Your Free Assessment →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-16 md:py-20" style={{ background: "#ffffff" }}>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight" style={{ color: NAVY }}>
            Common questions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="flex flex-col gap-4">
              {FAQ_ITEMS.slice(0, 4).map((item) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {FAQ_ITEMS.slice(4, 8).map((item) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="px-4 sm:px-6 py-16 md:py-20 text-center relative overflow-hidden"
        style={{
          backgroundColor: NAVY,
          backgroundImage: "url(/brand/cta_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.85))" }}
          aria-hidden
        />
        <div className="max-w-2xl mx-auto flex flex-col gap-5 items-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "#ffffff" }}>
            Ready to Fight Back?
          </h2>
          <p className="text-lg" style={{ color: "rgba(255, 255, 255, 0.92)" }}>
            Get your free case assessment in 60 seconds. No credit card required.
          </p>
          <Link
            href="/onboarding"
            className="min-h-12 rounded-full px-8 py-4 text-base font-semibold inline-flex items-center justify-center"
            style={{ background: BLUE, color: "#ffffff" }}
          >
            Start My Free Case Assessment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-12 md:py-14" style={{ background: NAVY, color: "#ffffff" }}>
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
              <RuledLogo size="sm" variant="light" />
              <p className="text-sm font-medium text-white/80">
                Win without a lawyer.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Product</p>
              <nav className="flex flex-col gap-2 text-sm">
                <Link href="/#how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</Link>
                <Link href="/#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</Link>
                <Link href="/demand-preview" className="text-white/80 hover:text-white transition-colors">Demand Letter</Link>
                <Link href="/full-case-pack-preview" className="text-white/80 hover:text-white transition-colors">Full Case Pack</Link>
                <Link href="/blog" className="text-white/80 hover:text-white transition-colors">Blog</Link>
              </nav>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Company</p>
              <nav className="flex flex-col gap-2 text-sm">
                <Link href="/login" className="text-white/80 hover:text-white transition-colors">Sign In</Link>
                <Link href="/about" className="text-white/80 hover:text-white transition-colors">About</Link>
                <Link href="/blog" className="text-white/80 hover:text-white transition-colors">Blog</Link>
                <Link href="/contact" className="text-white/80 hover:text-white transition-colors">Contact</Link>
              </nav>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Legal</p>
              <nav className="flex flex-col gap-2 text-sm">
                <Link href="/privacy" className="text-white/80 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="text-white/80 hover:text-white transition-colors">Terms of Service</Link>
              </nav>
            </div>
          </div>
          <p className="text-xs text-white/50 border-t border-white/10 pt-6">
            &copy; 2026 ruled.ca. Ruled provides legal information, not legal advice. Not a law firm.
          </p>
        </div>
      </footer>
    </div>
  );
}

function RuledLogo({ size = "lg", variant = "dark" }: { size?: "lg" | "sm"; variant?: "dark" | "light" }) {
  const textSize = size === "lg" ? "text-4xl md:text-5xl" : "text-xl";
  const ruledColor = variant === "light" ? "#ffffff" : NAVY;
  const caColor = variant === "light" ? "#ffffff" : BLUE;
  return (
    <span
      className={`${textSize} font-bold tracking-tight`}
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <span style={{ color: ruledColor }}>ruled</span>
      <span style={{ color: caColor }}>.ca</span>
    </span>
  );
}

function WhatYouGetCard({ title, price, description, imageSrc }: { title: string; price: string | null; description: string; imageSrc?: string }) {
  return (
    <div
      className="rounded-2xl p-7 flex flex-col gap-4"
      style={{
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        borderTop: `3px solid ${BLUE}`,
        boxShadow: CARD_SHADOW,
      }}
    >
      <div className="flex items-baseline gap-3 flex-wrap">
        <h3 className="font-bold text-lg" style={{ color: NAVY }}>{title}</h3>
        {price && (
          <span className="text-sm font-semibold" style={{ color: BLUE }}>{price}</span>
        )}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: SUBTEXT }}>{description}</p>
      {imageSrc && (
        <div className="mt-2 overflow-hidden rounded-xl" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.10)" }}>
          <Image
            src={imageSrc}
            alt=""
            width={800}
            height={500}
            className="w-full h-auto block"
            style={{ maxHeight: "200px", objectFit: "cover", objectPosition: "top" }}
          />
        </div>
      )}
    </div>
  );
}

function XMarkIcon() {
  return (
    <span
      className="inline-flex shrink-0 w-5 h-5 rounded-full items-center justify-center mt-0.5"
      style={{ background: "#E2E8F0" }}
      aria-hidden
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 2L8 8M8 2L2 8" stroke="#94A3B8" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function RedCheckIcon() {
  return (
    <span
      className="inline-flex shrink-0 w-5 h-5 rounded-full items-center justify-center mt-0.5"
      style={{ background: BLUE }}
      aria-hidden
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

const STEP_ICONS: Record<1 | 2 | 3, React.ReactNode> = {
  1: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="13" y2="13" />
    </svg>
  ),
  2: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="11" cy="15" r="2.5" />
      <line x1="13.5" y1="17.5" x2="16" y2="20" />
    </svg>
  ),
  3: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="7 12.5 10.5 16 17 9" />
    </svg>
  ),
};

function StepCard({
  step,
  title,
  description,
}: {
  step: 1 | 2 | 3;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex flex-col gap-5 rounded-2xl p-7 lg:p-8 h-full"
      style={{ background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #E2E8F0" }}
    >
      <div className="shrink-0">{STEP_ICONS[step]}</div>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: "rgba(200,57,43,0.10)", color: BLUE }}
      >
        {step}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold" style={{ color: NAVY }}>
          {title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: SUBTEXT }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: "gavel" | "trophy" | "chart" | "map";
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-2 text-white">
      <StatIcon type={icon} />
      <span
        className="text-4xl md:text-5xl font-bold"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {value}
      </span>
      <span className="text-sm opacity-90 leading-snug max-w-[14rem]">{label}</span>
    </div>
  );
}

function StatAlert({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-2 text-white">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span
        className="text-4xl md:text-5xl font-bold"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {value}
      </span>
      <span className="text-sm opacity-90 leading-snug max-w-[14rem]">{label}</span>
    </div>
  );
}

function StatIcon({ type }: { type: "gavel" | "trophy" | "chart" | "map" }) {
  const iconProps = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#93C5FD",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "gavel") {
    return (
      <svg {...iconProps} aria-hidden>
        <path d="M12 3v18" />
        <path d="M5 8h14" />
        <path d="M5 8 2.5 14h5L5 8z" />
        <path d="M19 8l-2.5 6h5L19 8z" />
      </svg>
    );
  }
  if (type === "trophy") {
    return (
      <svg {...iconProps} aria-hidden>
        <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
        <path d="M6 5h12v2a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V5z" />
        <path d="M10 15v2" />
        <path d="M14 15v2" />
        <path d="M8 21h8" />
        <path d="M9 17h6v4H9z" />
      </svg>
    );
  }
  if (type === "chart") {
    return (
      <svg {...iconProps} aria-hidden>
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    );
  }
  return (
    <svg {...iconProps} aria-hidden>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function CheckIcon({ color, checkColor }: { color: string; checkColor: string }) {
  return (
    <span
      className="inline-flex shrink-0 w-5 h-5 rounded-full items-center justify-center mt-0.5"
      style={{ background: color }}
      aria-hidden
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 6L5 8.5L9.5 3.5"
          stroke={checkColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#ffffff", border: "1px solid #E2E8F0" }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span className="font-semibold text-sm break-words" style={{ color: NAVY }}>
          {question}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
          }}
          aria-hidden
        >
          <path
            d="M4 6L8 10L12 6"
            stroke={BLUE}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t" style={{ borderColor: "#E2E8F0" }}>
          <p className="text-sm leading-relaxed break-words pt-3" style={{ color: SUBTEXT }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

function PricingTierCard({ tier }: { tier: (typeof PRICING_TIERS)[number] }) {
  const isPopular = tier.popular;
  const checkColor = isPopular ? AMBER : GREEN;

  return (
    <div
      className="relative rounded-2xl p-7 flex flex-col gap-5 h-full"
      style={
        isPopular
          ? {
              background: BLUE,
              border: `2px solid ${BLUE}`,
              color: "#ffffff",
              boxShadow: "0 8px 24px rgba(200, 57, 43, 0.28)",
            }
          : {
              background: "#ffffff",
              border: "1px solid #E2E8F0",
              boxShadow: CARD_SHADOW,
            }
      }
    >
      {isPopular && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
          style={{ background: AMBER, color: NAVY }}
        >
          Most Popular
        </span>
      )}
      <div>
        <p
          className="text-3xl font-bold"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            color: isPopular ? "#ffffff" : NAVY,
          }}
        >
          {tier.price}
        </p>
        <h3 className="text-base font-medium mt-1" style={{ color: isPopular ? "rgba(255,255,255,0.9)" : SUBTEXT }}>
          {tier.subtitle}
        </h3>
        <p
          className="text-xs mt-2 leading-relaxed"
          style={{ color: isPopular ? "rgba(255,255,255,0.85)" : SUBTEXT }}
        >
          {tier.trustLine}
        </p>
      </div>
      <ul className="flex flex-col gap-3 flex-1 text-sm">
        {tier.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 leading-relaxed items-start">
            <CheckIcon
              color={checkColor}
              checkColor={isPopular ? NAVY : "#ffffff"}
            />
            <span style={{ color: isPopular ? "rgba(255,255,255,0.95)" : SUBTEXT }}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={tier.href}
        className="w-full min-h-12 rounded-full px-4 py-3 text-sm font-semibold text-center flex items-center justify-center"
        style={
          isPopular
            ? { background: "#ffffff", color: BLUE }
            : { background: SURFACE, color: NAVY, border: "1px solid #E2E8F0" }
        }
      >
        {tier.cta}
      </Link>
    </div>
  );
}
