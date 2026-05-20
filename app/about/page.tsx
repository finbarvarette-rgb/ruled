import Link from "next/link";
import {
  m,
  marketingBtnPrimary,
  marketingCard,
  marketingPageMain,
  ruledLogoSuffixStyle,
} from "@/lib/marketing-theme";

const STEPS = [
  {
    title: "Describe What Happened",
    description:
      "Tell us your situation in plain language. No legal jargon.",
  },
  {
    title: "Get Your Case Assessment",
    description:
      "AI analyzes your case instantly. Strength, evidence, weaknesses, next steps.",
  },
  {
    title: "Fight Back",
    description:
      "Get your demand letter and court prep. Show up prepared. Get what you're owed.",
  },
];

export default function AboutPage() {
  return (
    <main
      className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16"
      style={marketingPageMain}
    >
      <article className="max-w-2xl mx-auto w-full flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <Link href="/" className="text-sm w-fit" style={{ color: m.muted }}>
            &larr; Home
          </Link>
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: m.text }}
          >
            ruled<span style={ruledLogoSuffixStyle()}>.ca</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: m.text }}>
            Why We Built Ruled
          </h1>
        </div>

        <p className="text-base leading-relaxed" style={{ color: m.subtext }}>
          Every year, millions of Canadians get stiffed by contractors, landlords,
          and businesses. Most never fight back — not because they don&apos;t have a
          case, but because the system feels impossible to navigate without a
          lawyer. We built Ruled to change that. AI-powered, flat-fee, and built
          specifically for Canadian small claims court. No legal jargon. No hourly
          rates. Just you, your case, and everything you need to fight back.
        </p>

        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold" style={{ color: m.text }}>
            How It Works
          </h2>
          <div className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl p-5 flex flex-col gap-2"
                style={marketingCard}
              >
                <span className="text-xs font-bold" style={{ color: m.amber }}>
                  Step {i + 1}
                </span>
                <h3 className="font-semibold" style={{ color: m.text }}>
                  {step.title}
                </h3>
                <p className="text-sm" style={{ color: m.subtext }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/onboarding"
            className="inline-flex justify-center rounded-full px-6 py-4 text-sm font-semibold w-full sm:w-auto"
            style={marketingBtnPrimary}
          >
            Start Your Free Assessment
          </Link>
        </section>
      </article>
    </main>
  );
}
