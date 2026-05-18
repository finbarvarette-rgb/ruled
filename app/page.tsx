"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Nova Scotia",
  "Ontario",
  "Quebec",
  "Saskatchewan",
];

function RuledLogo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const textSize = size === "lg" ? "text-4xl md:text-5xl" : "text-xl";
  return (
    <span
      className={`${textSize} font-bold tracking-tight`}
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      Ruled<span style={{ color: "#c8392b" }}>.</span>
    </span>
  );
}

export default function Home() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const [intake, setIntake] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function scrollToHero() {
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!intake.trim() || !province) {
      setError("Please describe your situation and select your province.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake, province }),
      });

      if (!res.ok) throw new Error("Assessment failed");

      const data = await res.json();
      sessionStorage.setItem(
        "ruled_assessment",
        JSON.stringify({
          assessment: data.assessment,
          province,
          intake,
          caseId: data.caseId ?? null,
        })
      );
      router.push("/results");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Section 1 — Hero assessment form */}
      <section
        ref={heroRef}
        id="assessment"
        className="px-6 py-16 md:py-24"
      >
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-12">
          <RuledLogo />
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
              Someone owes you money.
              <br />
              We&apos;ll help you get it back.
            </h1>
            <p style={{ color: "#9a9590" }} className="text-lg leading-relaxed">
              AI-powered small claims court preparation. No lawyer required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <textarea
              value={intake}
              onChange={(e) => setIntake(e.target.value)}
              rows={6}
              placeholder="Describe what happened in plain language. Who owes you money, how much, and why."
              className="w-full rounded-lg px-4 py-3 text-base leading-relaxed resize-none outline-none"
              style={{
                background: "#1a1916",
                color: "#f5f1eb",
                border: "1px solid #2a2825",
                caretColor: "#c8392b",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#c8392b";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#2a2825";
              }}
            />
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-base outline-none appearance-none cursor-pointer"
              style={{
                background: "#1a1916",
                color: province ? "#f5f1eb" : "#9a9590",
                border: "1px solid #2a2825",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#c8392b";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#2a2825";
              }}
            >
              <option value="" disabled>
                Select your province
              </option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {error && (
              <p className="text-sm" style={{ color: "#c8392b" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-6 py-4 text-base font-semibold transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ background: "#f5f1eb", color: "#0f0e0c" }}
            >
              {loading ? "Assessing your case…" : "Assess My Case"}
            </button>
            <p className="text-center text-sm" style={{ color: "#9a9590" }}>
              Free case assessment. No credit card required.
            </p>
          </form>
        </div>
      </section>

      {/* Section 2 — How It Works */}
      <section className="px-6 py-16 md:py-20 border-t" style={{ borderColor: "#2a2825" }}>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-center tracking-tight">
            Three Steps to Getting Paid
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              icon={<PencilIcon />}
              title="Describe What Happened"
              description="Tell us your situation in plain language. No legal jargon."
            />
            <StepCard
              icon={<ScalesIcon />}
              title="Get Your Case Assessment"
              description="AI analyzes your case instantly. Strength, evidence, weaknesses, next steps."
            />
            <StepCard
              icon={<FistIcon />}
              title="Fight Back and Win"
              description="Get your demand letter and court prep. Show up confident. Get your money back."
            />
          </div>
        </div>
      </section>

      {/* Section 3 — Who This Is For */}
      <section className="px-6 py-16 md:py-20" style={{ background: "#1a1916" }}>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-center tracking-tight">
            Built for People Who Got Screwed
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AudienceCard
              title="Contractors and Trades"
              description="Client won't pay. Chargeback after job completion. We help you fight back."
            />
            <AudienceCard
              title="Landlords"
              description="Deposit dispute. Property damage. Unpaid rent. Know your rights."
            />
            <AudienceCard
              title="Small Businesses"
              description="Reversed payment. Broken contract. Supplier didn't deliver."
            />
            <AudienceCard
              title="Everyday Canadians"
              description="Bad contractor. Faulty product. Service never delivered."
            />
          </div>
        </div>
      </section>

      {/* Section 4 — Success stats placeholder */}
      {/* PLACEHOLDER — replace with real Ruled data */}
      <section className="px-6 py-14 md:py-16" style={{ background: "#c8392b" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <Stat
            value="40%"
            label="of cases resolve after demand letter alone"
          />
          <Stat
            value="$4,200"
            label="Average claim amount"
          />
          <Stat
            value="$35,000"
            label="Small claims limit in most provinces"
          />
        </div>
      </section>

      {/* Section 5 — Pricing */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-center tracking-tight">
            Simple Flat-Fee Pricing. No surprises.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingCard
              tier="Free"
              title="Case Assessment"
              description="Instant AI case analysis. Know if you have a case before spending a dollar."
              buttonLabel="Get Free Assessment"
              onClick={scrollToHero}
            />
            <PricingCard
              tier="$49"
              title="Demand Letter"
              description="Professional demand letter drafted to your exact case. Sent within minutes."
              buttonLabel="Get Demand Letter"
              onClick={() => router.push("/demand")}
            />
            <PricingCard
              tier="$199"
              title="Full Case Pack"
              description="Demand letter plus all court documents plus hearing prep plus unlimited Q&A."
              buttonLabel="Get Full Case Pack"
              onClick={() => router.push("/waitlist")}
              popular
            />
          </div>
        </div>
      </section>

      {/* Section 6 — Testimonials placeholder */}
      {/* PLACEHOLDER — replace with real testimonials */}
      <section className="px-6 py-16 md:py-20" style={{ background: "#1a1916" }}>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-center tracking-tight">
            Canadians Getting Their Money Back
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="I got my $4,200 deposit back in 6 weeks. The demand letter did it — never even went to court."
              author="Sarah M., Halifax NS"
            />
            <TestimonialCard
              quote="My contractor took $8,000 and ghosted. Ruled helped me file and win in 3 months."
              author="James T., Moncton NB"
            />
            <TestimonialCard
              quote="I was ready to give up on $3,500. The case assessment gave me confidence to fight. I won."
              author="Mike R., Toronto ON"
            />
          </div>
        </div>
      </section>

      {/* Section 7 — Bottom CTA */}
      <section className="px-6 py-16 md:py-20 text-center">
        <div className="max-w-2xl mx-auto flex flex-col gap-6 items-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Ready to Fight Back?
          </h2>
          <p className="text-lg" style={{ color: "#9a9590" }}>
            Get your free case assessment in 60 seconds. No credit card required.
          </p>
          <button
            type="button"
            onClick={scrollToHero}
            className="rounded-lg px-8 py-4 text-base font-semibold cursor-pointer"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Assess My Case Free
          </button>
        </div>
      </section>

      {/* Section 8 — Footer */}
      <footer
        className="px-6 py-12 border-t"
        style={{ borderColor: "#2a2825" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="flex flex-col gap-2">
              <RuledLogo size="sm" />
              <p className="text-sm font-medium" style={{ color: "#9a9590" }}>
                Fight back. Win.
              </p>
            </div>
            <nav className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm">
              <Link
                href="/login"
                className="hover:opacity-80"
                style={{ color: "#9a9590" }}
              >
                Sign In
              </Link>
              <Link
                href="/privacy"
                className="hover:opacity-80"
                style={{ color: "#9a9590" }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:opacity-80"
                style={{ color: "#9a9590" }}
              >
                Terms of Service
              </Link>
              <a
                href="mailto:hello@ruled.ca"
                className="hover:opacity-80"
                style={{ color: "#9a9590" }}
              >
                Contact
              </a>
            </nav>
          </div>
          <p className="text-xs" style={{ color: "#6b6560" }}>
            &copy; 2026 Ruled.ca. Ruled provides legal information, not legal
            advice. Not a law firm.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 items-center text-center md:items-start md:text-left rounded-xl p-6"
      style={{ background: "#1a1916", border: "1px solid #2a2825" }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center"
        style={{ background: "#0f0e0c", color: "#c8392b" }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
        {description}
      </p>
    </div>
  );
}

function AudienceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-2"
      style={{ background: "#0f0e0c", border: "1px solid #2a2825" }}
    >
      <h3 className="font-semibold" style={{ color: "#c8392b" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
        {description}
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-3xl md:text-4xl font-bold">{value}</span>
      <span className="text-sm opacity-90">{label}</span>
    </div>
  );
}

function PricingCard({
  tier,
  title,
  description,
  buttonLabel,
  onClick,
  popular,
}: {
  tier: string;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  popular?: boolean;
}) {
  return (
    <div
      className="relative rounded-xl p-6 flex flex-col gap-4"
      style={{
        background: "#1a1916",
        border: popular ? "2px solid #c8392b" : "1px solid #2a2825",
      }}
    >
      {popular && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: "#c8392b", color: "#f5f1eb" }}
        >
          Most Popular
        </span>
      )}
      <div>
        <p className="text-2xl font-bold">{tier}</p>
        <h3 className="text-lg font-semibold mt-1">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed flex-1" style={{ color: "#9a9590" }}>
        {description}
      </p>
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg px-4 py-3 text-sm font-semibold cursor-pointer"
        style={{
          background: popular ? "#c8392b" : "#f5f1eb",
          color: popular ? "#f5f1eb" : "#0f0e0c",
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
}: {
  quote: string;
  author: string;
}) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-4"
      style={{ background: "#0f0e0c", border: "1px solid #2a2825" }}
    >
      <p className="text-sm leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
      <p className="text-xs font-medium" style={{ color: "#c8392b" }}>
        — {author}
      </p>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function ScalesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3v18M5 7h14M7 7l-2 6h4L7 7zm10 0l-2 6h4l-2-6z" />
    </svg>
  );
}

function FistIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7 11V7a2 2 0 0 1 4 0v4M11 7V5a2 2 0 0 1 4 0v6M15 7v2a2 2 0 0 1-4 0V9M7 11v6a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4v-2" />
    </svg>
  );
}
