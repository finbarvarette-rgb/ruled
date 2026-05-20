import Link from "next/link";

const INCLUDED = [
  "Custom demand letter based on your case details",
  "Proper legal language and tone",
  "14-day payment demand (standard legal timeline)",
  "Step-by-step sending instructions",
  "What to expect after sending",
  "Saved to your dashboard",
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Complete your free case assessment",
    description: "Describe your situation in plain language — about 5 minutes.",
  },
  {
    step: "2",
    title: "Purchase your demand letter",
    description: "One flat fee of $49. No hourly lawyer rates.",
  },
  {
    step: "3",
    title: "Download, send, and wait 14 days",
    description: "Send by email and registered mail. Many cases settle here.",
  },
];

const FAQ = [
  {
    question: "How long is the letter?",
    answer:
      "Typically one to two pages. It includes your case facts, the amount owed, applicable legal language for your province, and a clear 14-day payment deadline.",
  },
  {
    question: "Can I edit it?",
    answer:
      "Yes. You receive the full letter as text you can copy or download. Review it, adjust details if needed, then send it yourself.",
  },
  {
    question: "What if they ignore it?",
    answer:
      "If they do not pay or respond within 14 days, your next step is usually filing in your province's small claims court. Ruled can help you prepare with the Full Case Pack ($199).",
  },
  {
    question: "Is this legally binding?",
    answer:
      "A demand letter is not a court order, but it is a formal legal notice. It creates a clear record of your claim and deadline, which can support you if you file in court later.",
  },
];

function SampleLetterPreview() {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-center" style={{ color: "#9a9590" }}>
        Your letter will look like this — personalized to your case
      </p>
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: "#ffffff",
          border: "1px solid #2a2825",
        }}
      >
        <div
          className="px-6 sm:px-8 py-6 text-left"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            color: "#0f0e0c",
          }}
        >
          <p className="text-sm leading-relaxed">Alex Morgan</p>
          <p className="text-sm leading-relaxed">Morgan Contracting</p>
          <p className="text-sm leading-relaxed mb-4">alex.morgan@email.com</p>
          <p className="text-sm leading-relaxed mb-4">May 18, 2026</p>
          <p className="text-sm leading-relaxed mb-4">
            Summit Renovations Ltd.
            <br />
            456 King Street West, Toronto, ON M5H 1A1
          </p>
          <p className="text-sm font-semibold mb-3">
            RE: Formal Demand for Payment — $5,000.00
          </p>
          <p className="text-sm leading-relaxed">
            Dear Summit Renovations Ltd., I am writing regarding the renovation
            contract we entered into on March 1, 2026. I paid a deposit of
            $5,000.00 on March 5, 2026. You began work but ceased before
            completion and have not responded to my requests to resolve this
            matter.
          </p>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-[58%] pointer-events-none"
          style={{
            backdropFilter: "blur(7px)",
            WebkitBackdropFilter: "blur(7px)",
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(245, 241, 235, 0.4) 35%, rgba(245, 241, 235, 0.95) 100%)",
          }}
          aria-hidden
        />
      </div>
    </section>
  );
}

export default function DemandPreviewPage() {
  return (
    <main className="flex flex-col flex-1 min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="hero-section relative px-4 sm:px-6 py-14 md:py-20 overflow-hidden">
        <div className="hero-blobs" aria-hidden>
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto w-full flex flex-col gap-6 text-center">
          <p
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: "#c8392b" }}
          >
            Demand Letter — $49
          </p>
          <h1
            className="hero-headline-serif text-left sm:text-center"
            style={{ fontSize: "clamp(1.75rem, 5vw, 2.5rem)" }}
          >
            A professionally drafted demand letter — built around your case
          </h1>
          <p
            className="text-base md:text-lg leading-relaxed text-left sm:text-center"
            style={{ color: "#9a9590" }}
          >
            Send it in minutes. 40% of cases resolve without ever going to court.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 pb-16 md:pb-20 flex flex-col gap-10 md:gap-12">
        <SampleLetterPreview />

        {/* What's included */}
        <section
          className="rounded-xl px-5 sm:px-6 py-6 flex flex-col gap-5"
          style={{ background: "#1a1916", border: "1px solid #2a2825" }}
        >
          <h2 className="text-lg font-semibold">What&apos;s Included</h2>
          <ul className="flex flex-col gap-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span className="shrink-0 font-bold" style={{ color: "#c8392b" }}>
                  ✓
                </span>
                <span style={{ color: "#d4cfc9" }}>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-center">How It Works</h2>
          <div className="grid grid-cols-1 gap-4">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl px-5 py-5 flex gap-4"
                style={{ background: "#1a1916", border: "1px solid #2a2825" }}
              >
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "#c8392b", color: "#f5f1eb" }}
                >
                  {item.step}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-sm" style={{ color: "#9a9590" }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Primary CTA */}
        <section className="flex flex-col gap-3 items-center">
          <Link
            href="/onboarding"
            className="w-full max-w-md rounded-xl px-6 py-4 text-base font-semibold text-center"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Start Free Assessment → Get Your Letter
          </Link>
          <p className="text-xs text-center" style={{ color: "#6b6560" }}>
            Free assessment first · $49 for your letter · No lawyer required
          </p>
        </section>

        {/* FAQ */}
        <section className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-center">
            Demand Letter FAQ
          </h2>
          <div className="flex flex-col gap-4">
            {FAQ.map((item) => (
              <div
                key={item.question}
                className="rounded-xl px-5 py-5 flex flex-col gap-2"
                style={{ background: "#1a1916", border: "1px solid #2a2825" }}
              >
                <h3 className="text-sm font-semibold">{item.question}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-sm text-center">
          <Link href="/" style={{ color: "#9a9590" }}>
            &larr; Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
