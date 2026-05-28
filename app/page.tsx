"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const NAVY = "#0F172A";
const BLUE = "#C8392B";
const SUBTEXT = "#4B5563";
const SURFACE = "#F1F5F9";
const PAGE_BG = "#FAFAFA";
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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .site-body { border-top: none !important; }
        @keyframes heroBlob1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%       { transform: translate(50px, -70px) scale(1.15); }
          66%       { transform: translate(-35px, 40px) scale(0.9); }
        }
        @keyframes heroBlob2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40%       { transform: translate(-60px, 35px) scale(1.1); }
          70%       { transform: translate(40px, -50px) scale(0.95); }
        }
        @keyframes heroBlob3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          30%       { transform: translate(60px, -45px) scale(1.2); }
          65%       { transform: translate(-45px, 55px) scale(0.85); }
        }
      ` }} />
      <div className="flex flex-col flex-1" style={{ background: PAGE_BG, color: NAVY }}>

      {/* Hero */}
      <section
        className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 py-10 md:py-14 lg:py-16 overflow-hidden"
        style={{ background: NAVY }}
      >
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div style={{
            position: "absolute", borderRadius: "50%",
            width: "640px", height: "640px", top: "-180px", left: "-120px",
            background: "radial-gradient(circle, rgba(37,99,235,0.38) 0%, transparent 70%)",
            filter: "blur(64px)",
            animation: "heroBlob1 20s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", borderRadius: "50%",
            width: "520px", height: "520px", bottom: "-120px", right: "-100px",
            background: "radial-gradient(circle, rgba(245,158,11,0.28) 0%, transparent 70%)",
            filter: "blur(64px)",
            animation: "heroBlob2 25s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", borderRadius: "50%",
            width: "480px", height: "480px", top: "35%", left: "38%",
            background: "radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "heroBlob3 30s ease-in-out infinite",
          }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="flex flex-col gap-8 order-2 lg:order-1">
            <div className="flex flex-col gap-4">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight break-words"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#ffffff" }}
              >
                Get the money you&apos;re owed.
              </h1>
              <p className="text-base md:text-lg leading-relaxed max-w-lg" style={{ color: "rgba(255,255,255,0.70)" }}>
                Win without a lawyer.
              </p>
            </div>
            <div className="flex flex-col gap-4 w-full max-w-md">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/onboarding"
                  className="w-full sm:flex-1 min-h-12 rounded-full px-6 py-4 text-base font-semibold text-center flex items-center justify-center whitespace-nowrap"
                  style={{ background: BLUE, color: "#ffffff" }}
                >
                  Start Free Assessment →
                </Link>
                <Link
                  href="/#how-it-works"
                  className="w-full sm:flex-1 min-h-12 rounded-full px-6 py-4 text-base font-semibold text-center flex items-center justify-center"
                  style={{ color: "#ffffff", border: "2px solid rgba(255,255,255,0.30)", background: "transparent" }}
                >
                  Learn More
                </Link>
              </div>
              <p className="text-sm text-center sm:text-left" style={{ color: "rgba(255,255,255,0.50)" }}>
                ✅ Free to start · No credit card required
              </p>
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
                boxShadow: "0 30px 60px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.07)",
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

      {/* Stats — connected to hero, no separator */}
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
          <Stat icon="gavel" value="$35,000" label="Maximum claim limit in most provinces" />
          <Stat icon="trophy" value="76%" label="of claimants win when properly prepared" />
          <Stat icon="chart" value="40%" label="Resolve Before Court" />
          <Stat icon="map" value="All 10" label="Provinces Supported" />
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="px-4 sm:px-6 py-16 md:py-20 scroll-mt-16"
        style={{ background: SURFACE }}
      >
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight" style={{ color: NAVY }}>
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StepCard
              step={1}
              iconIndex={0}
              title="Tell Your Story"
              description="Describe what happened in plain language. No legal jargon needed—just the facts."
            />
            <StepCard
              step={2}
              iconIndex={1}
              title="AI Analysis"
              description="Our AI instantly analyzes your case strength, evidence, and next steps tailored to your province."
            />
            <StepCard
              step={3}
              iconIndex={2}
              title="Get Paid"
              description="Send your demand letter or take it to court fully prepared. Get what you're owed."
            />
          </div>
        </div>
      </section>

      {/* Built for situations like yours */}
      <section className="px-4 sm:px-6 py-16 md:py-20" style={{ background: "#ffffff" }}>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight" style={{ color: NAVY }}>
            Built for situations like yours
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SituationCard
              icon={<WrenchIcon />}
              title="Contractors and Trades"
              description="Client won't pay after job completion. Draft a formal demand and file if needed."
            />
            <SituationCard
              icon={<KeyIcon />}
              title="Landlords"
              description="Deposit disputes, property damage, unpaid rent — know your rights and act."
            />
            <SituationCard
              icon={<BriefcaseIcon />}
              title="Small Businesses"
              description="Reversed payments, broken contracts, and suppliers who didn't deliver."
            />
            <SituationCard
              icon={<ShieldIcon />}
              title="Everyday Canadians"
              description="Bad contractors, faulty products, or services you paid for and never received."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-16 md:py-20 scroll-mt-16" style={{ background: PAGE_BG }}>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight" style={{ color: NAVY }}>
            Simple Flat-Fee Pricing. No surprises.
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PRICING_TIERS.map((tier) => (
              <PricingTierCard key={tier.subtitle} tier={tier} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-16 md:py-20" style={{ background: "#F8F7F4" }}>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
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

      {/* Social Proof / Waitlist */}
      <section className="px-4 sm:px-6 py-16 md:py-20" style={{ background: SURFACE }}>
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 items-center text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: NAVY }}>
            Real results from real Canadians
          </h2>
          <p className="text-lg leading-relaxed max-w-lg" style={{ color: SUBTEXT }}>
            Ruled is helping Canadians fight back. Be among the first.
          </p>
          <WaitlistCapture />
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
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: "#ffffff", textShadow: "0 2px 12px rgba(0, 0, 0, 0.45)" }}
          >
            Ready to Fight Back?
          </h2>
          <p className="text-lg" style={{ color: "rgba(255, 255, 255, 0.92)", textShadow: "0 1px 6px rgba(0, 0, 0, 0.35)" }}>
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
                Fight back. Get what you&apos;re owed.
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
    </>
  );
}

function RuledLogo({ size = "lg", variant = "dark" }: { size?: "lg" | "sm"; variant?: "dark" | "light" }) {
  const textSize = size === "lg" ? "text-4xl md:text-5xl" : "text-xl";
  const ruledColor = variant === "light" ? "#ffffff" : NAVY;
  const caColor = variant === "light" ? "#93C5FD" : BLUE;
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

function WaitlistCapture() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-base font-semibold py-3" style={{ color: BLUE }}>
        You&apos;re on the list — we&apos;ll be in touch.
      </p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && email.trim()) setSubmitted(true); }}
        placeholder="Enter your email"
        className="flex-1 rounded-full px-5 py-3 text-sm outline-none"
        style={{ background: "#ffffff", border: "1px solid #E2E8F0", color: NAVY }}
      />
      <button
        type="button"
        onClick={() => { if (email.trim()) setSubmitted(true); }}
        className="rounded-full px-6 py-3 text-sm font-semibold whitespace-nowrap cursor-pointer"
        style={{ background: BLUE, color: "#ffffff" }}
      >
        Get Early Access
      </button>
    </div>
  );
}

function SituationCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-4"
      style={{ background: "#ffffff", border: "1px solid #E2E8F0", boxShadow: CARD_SHADOW }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(245,158,11,0.12)" }}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-bold text-base" style={{ color: NAVY }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: SUBTEXT }}>{description}</p>
      </div>
    </div>
  );
}

function WrenchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2 12h20" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function StepCard({
  step,
  iconIndex,
  title,
  description,
}: {
  step: number;
  iconIndex: 0 | 1 | 2;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-xl p-6 h-full"
      style={{ background: "#ffffff", boxShadow: CARD_SHADOW, border: "1px solid #E2E8F0" }}
    >
      <div className="relative w-16 h-16 overflow-hidden rounded-lg shrink-0 border border-[#E2E8F0] bg-white">
        <Image
          src="/brand/steps_illustration.png"
          alt=""
          width={720}
          height={280}
          className="absolute max-w-none"
          style={{ width: "300%", height: "auto", left: `-${iconIndex * 100}%`, top: "50%", transform: "translateY(-50%)" }}
        />
      </div>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: "#DBEAFE", color: BLUE }}
      >
        {step}
      </div>
      <h3 className="text-lg font-semibold" style={{ color: NAVY }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: SUBTEXT }}>
        {description}
      </p>
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
        className="text-3xl md:text-4xl font-bold"
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
      className="relative rounded-2xl p-6 flex flex-col gap-5 h-full"
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
