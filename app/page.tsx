import Link from "next/link";
import { PricingComparison } from "@/components/PricingComparison";

function RuledLogo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const textSize = size === "lg" ? "text-4xl md:text-5xl" : "text-xl";
  return (
    <span
      className={`${textSize} font-bold tracking-tight`}
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      ruled<span style={{ color: "#c8392b" }}>.ca</span>
    </span>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="hero-section relative px-4 sm:px-6 py-16 md:py-24 overflow-hidden">
        <div className="hero-blobs" aria-hidden>
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto w-full flex flex-col gap-8 items-center text-center md:items-center">
          <RuledLogo />
          <div className="flex flex-col gap-4 w-full">
            <h1 className="hero-headline-serif break-words">
              Get the money you&apos;re owed.
            </h1>
            <p
              className="text-base md:text-lg leading-relaxed max-w-lg mx-auto"
              style={{ color: "#9a9590" }}
            >
              Ruled prepares your small claims case in minutes. AI-powered. Flat
              fee. No lawyer needed.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-md">
            <Link
              href="/onboarding"
              className="w-full min-h-12 rounded-lg px-6 py-4 text-base font-semibold text-center flex items-center justify-center"
              style={{ background: "#c8392b", color: "#f5f1eb" }}
            >
              Start My Free Case Assessment
            </Link>
            <p className="text-sm" style={{ color: "#9a9590" }}>
              Join Canadians who fought back
            </p>
            <p className="text-xs" style={{ color: "#6b6560" }}>
              Free to start · No credit card required · Results in 60 seconds
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="px-4 sm:px-6 py-16 md:py-20 border-t scroll-mt-16"
        style={{ borderColor: "#2a2825" }}
      >
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-center tracking-tight">
            Three Steps to Getting Paid
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              title="Describe What Happened"
              description="Tell us your situation in plain language. No legal jargon."
            />
            <StepCard
              title="Get Your Case Assessment"
              description="AI analyzes your case instantly. Strength, evidence, weaknesses, next steps."
            />
            <StepCard
              title="Fight Back"
              description="Get your demand letter and court prep. Show up prepared. Get what you're owed."
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 py-14 md:py-16" style={{ background: "#c8392b" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 text-center">
          <Stat value="40%" label="of cases resolve after demand letter alone" />
          <Stat value="$4,200" label="Average claim amount" />
          <Stat
            value="$35,000"
            label="Small claims limit in most provinces"
          />
          <Stat value="All 10" label="provinces supported" />
        </div>
      </section>

      {/* Who This Is For */}
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

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-16 md:py-20 scroll-mt-16">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-center tracking-tight">
            Simple Flat-Fee Pricing. No surprises.
          </h2>
          <PricingComparison />
        </div>
      </section>

      {/* FAQ */}
      <section
        className="px-6 py-16 md:py-20 border-t"
        style={{ borderColor: "#2a2825" }}
      >
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-center tracking-tight">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-6">
            <FaqItem
              question="Is this legal advice?"
              answer="No. Ruled provides legal information, not legal advice. We are not a law firm and do not represent you in court."
            />
            <FaqItem
              question="How long does it take?"
              answer="Your free case assessment takes about 60 seconds. Paid products are delivered within minutes of payment."
            />
            <FaqItem
              question="What if the other person doesn't respond to the demand letter?"
              answer="If they don't pay or respond within 14 days, your next step is filing in small claims court. Your free assessment already analyzed your case — the Full Case Pack ($199) gives you court documents, filing instructions, and hearing prep so you're ready."
            />
            <FaqItem
              question="How long does the whole process take?"
              answer="Many cases resolve within 2–6 weeks after sending a demand letter. If you need to go to court, hearings are often scheduled a few months after filing, depending on your province and courthouse backlog."
            />
            <FaqItem
              question="What if I lose?"
              answer="We cannot guarantee outcomes. Small claims court decisions depend on your facts, evidence, and how the judge applies the law."
            />
            <FaqItem
              question="Which provinces are supported?"
              answer="All Canadian provinces. Guidance is tailored to your province's small claims rules and procedures."
            />
            <FaqItem
              question="Can businesses use Ruled?"
              answer="Yes. Contractors, landlords, and small businesses use Ruled for unpaid invoices, deposits, and contract disputes."
            />
            <FaqItem
              question="Is my information private?"
              answer="Yes. Your case details are stored securely. See our privacy policy for full details."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
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
              quote="My contractor took $8,000 and ghosted. Ruled helped me file and recover in 3 months."
              author="James T., Moncton NB"
            />
            <TestimonialCard
              quote="I was ready to give up on $3,500. The case assessment gave me confidence to fight. I got paid."
              author="Mike R., Toronto ON"
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-16 md:py-20 text-center">
        <div className="max-w-2xl mx-auto flex flex-col gap-6 items-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Ready to Fight Back?
          </h2>
          <p className="text-lg" style={{ color: "#9a9590" }}>
            Get your free case assessment in 60 seconds. No credit card required.
          </p>
          <Link
            href="/onboarding"
            className="min-h-12 rounded-lg px-8 py-4 text-base font-semibold inline-flex items-center justify-center"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Start My Free Case Assessment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-12 border-t"
        style={{ borderColor: "#2a2825" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="flex flex-col gap-2">
              <RuledLogo size="sm" />
              <p className="text-sm font-medium" style={{ color: "#9a9590" }}>
                Fight back. Get what you&apos;re owed.
              </p>
            </div>
            <nav className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm">
              <Link href="/login" style={{ color: "#9a9590" }}>
                Sign In
              </Link>
              <Link href="/about" style={{ color: "#9a9590" }}>
                About
              </Link>
              <Link href="/blog" style={{ color: "#9a9590" }}>
                Blog
              </Link>
              <Link href="/contact" style={{ color: "#9a9590" }}>
                Contact
              </Link>
              <Link href="/privacy" style={{ color: "#9a9590" }}>
                Privacy Policy
              </Link>
              <Link href="/terms" style={{ color: "#9a9590" }}>
                Terms of Service
              </Link>
            </nav>
          </div>
          <p className="text-xs" style={{ color: "#6b6560" }}>
            &copy; 2026 ruled.ca. Ruled provides legal information, not legal
            advice. Not a law firm.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-xl p-6"
      style={{ background: "#1a1916", border: "1px solid #2a2825" }}
    >
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
    <div className="flex flex-col gap-2 px-2">
      <span className="text-3xl md:text-4xl font-bold">{value}</span>
      <span className="text-sm opacity-90 leading-snug max-w-[16rem] mx-auto">{label}</span>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-2"
      style={{ background: "#1a1916", border: "1px solid #2a2825" }}
    >
      <h3 className="font-semibold text-sm break-words">{question}</h3>
      <p className="text-sm leading-relaxed break-words" style={{ color: "#9a9590" }}>
        {answer}
      </p>
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
      <p className="text-sm leading-relaxed italic break-words">&ldquo;{quote}&rdquo;</p>
      <p className="text-xs font-medium" style={{ color: "#c8392b" }}>
        — {author}
      </p>
    </div>
  );
}
