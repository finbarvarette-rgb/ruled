import Link from "next/link";

const INCLUDED = [
  "Province-specific court filing instructions",
  "All court documents prepared for you",
  "Step-by-step hearing script — opening and closing statements",
  "Anticipated defence arguments and how to respond",
  "Day of court checklist",
  "Unlimited AI Q&A",
  "Everything downloadable as PDF",
];

const PREVIEW_CARDS = [
  {
    title: "How to File",
    desc: "Exactly where to file in your province, what forms to bring, and the filing fee — step by step.",
    preview: `COURT NAME AND ADDRESS
Ontario Court of Justice — Small Claims Court
Find your local courthouse or file online.

FILING FEE
Approx. $102–$220 depending on claim amount.

WHAT TO BRING
1. Plaintiff's Claim (Form 7A)
2. Copies of evidence
3. Demand letter + proof of sending
4. Photo ID
5. Filing fee payment`,
  },
  {
    title: "Your Documents",
    desc: "Your court-ready paperwork, organized and downloadable — plus an evidence index so you look prepared.",
    preview: `DOCUMENT PACK (EXCERPT)

✓ Plaintiff's Claim / Notice of Claim (completed guidance)
✓ Affidavit of Service template
✓ Evidence index + exhibit labels
✓ Demand letter (court copy)

EVIDENCE INDEX
Exhibit A — Contract / agreement
Exhibit B — Proof of payment
Exhibit C — Photos of incomplete work
Exhibit D — Messages / emails`,
  },
  {
    title: "Hearing Prep",
    desc: "A word-for-word script for the hearing: opening, evidence order, rebuttals, and closing statement.",
    preview: `YOUR OPENING STATEMENT
Your Honour, my name is [Name] and I am here today because...

PRESENTING YOUR EVIDENCE
1. Exhibit A — the contract (what it says)
2. Exhibit B — payment proof (amount and date)
3. Exhibit C — photos (what they show)

WHAT THE DEFENDANT WILL SAY
Argument: “The work was completed.”
Response: The photos and messages show...`,
  },
  {
    title: "Day of Court Checklist",
    desc: "A printable checklist for what to bring, what to say, and how to stay calm when you’re called.",
    preview: `DAY OF COURT CHECKLIST

WHAT TO BRING
☐ Photo ID
☐ Evidence binder + 3 copies of exhibits
☐ Filed claim + claim number
☐ Proof of service
☐ Opening + closing statement printouts

WHEN CALLED
Stand and say: “Your Honour, I am [Name], the plaintiff.”`,
  },
] as const;

const FAQ = [
  {
    q: "What's in the hearing script?",
    a: "A word-for-word opening statement, the order to present your evidence, likely defence arguments (and how to respond), and a word-for-word closing statement — written in plain language.",
  },
  {
    q: "Do I need a lawyer?",
    a: "No. Small claims is designed for self-representation. Ruled gives you legal information and a structured plan so you can present your case clearly.",
  },
  {
    q: "What if they don't show up?",
    a: "In many provinces you can ask for a default judgment if the defendant doesn’t respond or appear. Your case pack explains the steps and what to bring so you can request it properly.",
  },
  {
    q: "How long does it take?",
    a: "Your assessment is fast. Demand letters can resolve disputes in weeks. If you file, timelines vary by province — hearings are often scheduled a few months after filing depending on backlog.",
  },
] as const;

function BlurredPreview({ text }: { text: string }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ background: "#ffffff", border: "1px solid #e8e4de" }}
    >
      <div
        className="px-4 sm:px-6 py-6 text-left whitespace-pre-wrap text-sm leading-relaxed break-words"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#0f0e0c",
        }}
      >
        {text}
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
        style={{
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(245, 241, 235, 0.35) 35%, rgba(245, 241, 235, 0.95) 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}

export default function FullCasePackPreviewPage() {
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
            Full Case Pack — $199
          </p>
          <h1
            className="hero-headline-serif text-left sm:text-center"
            style={{ fontSize: "clamp(1.9rem, 5vw, 2.7rem)" }}
          >
            Everything you need to walk into court and win.
          </h1>
          <p
            className="text-base md:text-lg leading-relaxed text-left sm:text-center"
            style={{ color: "#9a9590" }}
          >
            Province-specific filing instructions, all your court documents, a
            full hearing script, and unlimited AI Q&amp;A — flat fee, no lawyer
            needed.
          </p>
          <div className="pt-2 flex flex-col gap-3 items-center">
            <Link
              href="/onboarding"
              className="w-full max-w-md min-h-12 rounded-xl px-6 py-4 text-base font-semibold text-center flex items-center justify-center"
              style={{ background: "#c8392b", color: "#f5f1eb" }}
            >
              Start Free — Get Full Case Pack →
            </Link>
            <p className="text-xs text-center" style={{ color: "#6b6560" }}>
              Start with your free assessment · Upgrade after · No hourly billing
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 pb-16 md:pb-20 flex flex-col gap-10 md:gap-12">
        {/* Stats bar */}
        <section
          className="rounded-xl px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-center sm:text-left"
          style={{ background: "#1a1916", border: "1px solid #2a2825" }}
        >
          <span className="text-sm" style={{ color: "#d4cfc9" }}>
            40% resolve at demand letter stage
          </span>
          <span className="hidden sm:block" style={{ color: "#2a2825" }}>
            •
          </span>
          <span className="text-sm" style={{ color: "#d4cfc9" }}>
            $4,200 average claim
          </span>
          <span className="hidden sm:block" style={{ color: "#2a2825" }}>
            •
          </span>
          <span className="text-sm" style={{ color: "#d4cfc9" }}>
            Flat fee — no hourly billing
          </span>
        </section>

        {/* Visual preview */}
        <section className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-center">
            Here&apos;s what you get
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {PREVIEW_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl px-5 sm:px-6 py-6 flex flex-col gap-4"
                style={{ background: "#1a1916", border: "1px solid #2a2825" }}
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold">{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
                    {card.desc}
                  </p>
                </div>
                <BlurredPreview text={card.preview} />
              </div>
            ))}
          </div>
        </section>

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

        {/* Primary CTA (again) */}
        <section className="flex flex-col gap-3 items-center">
          <Link
            href="/onboarding"
            className="w-full max-w-md min-h-12 rounded-xl px-6 py-4 text-base font-semibold text-center flex items-center justify-center"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Start Free — Get Full Case Pack →
          </Link>
          <p className="text-xs text-center" style={{ color: "#6b6560" }}>
            Free assessment first · $199 after · Built for all Canadian provinces
          </p>
        </section>

        {/* FAQ */}
        <section className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-center">
            Full Case Pack FAQ
          </h2>
          <div className="flex flex-col gap-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-xl px-5 py-5 flex flex-col gap-2"
                style={{ background: "#1a1916", border: "1px solid #2a2825" }}
              >
                <h3 className="text-sm font-semibold">{item.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
                  {item.a}
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

