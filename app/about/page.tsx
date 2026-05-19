import Link from "next/link";

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
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16">
      <article className="max-w-2xl mx-auto w-full flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <Link href="/" className="text-sm w-fit" style={{ color: "#9a9590" }}>
            &larr; Home
          </Link>
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            ruled<span style={{ color: "#c8392b" }}>.ca</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Why We Built Ruled
          </h1>
        </div>

        <p className="text-base leading-relaxed" style={{ color: "#d4cfc9" }}>
          Every year, millions of Canadians get stiffed by contractors, landlords,
          and businesses. Most never fight back — not because they don&apos;t have a
          case, but because the system feels impossible to navigate without a
          lawyer. We built Ruled to change that. AI-powered, flat-fee, and built
          specifically for Canadian small claims court. No legal jargon. No hourly
          rates. Just you, your case, and everything you need to fight back.
        </p>

        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold">How It Works</h2>
          <div className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl p-5 flex flex-col gap-2"
                style={{ background: "#1a1916", border: "1px solid #2a2825" }}
              >
                <span className="text-xs font-bold" style={{ color: "#c8392b" }}>
                  Step {i + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm" style={{ color: "#9a9590" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/#assessment"
            className="inline-flex justify-center rounded-lg px-6 py-4 text-sm font-semibold w-full sm:w-auto"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Start Your Free Assessment
          </Link>
        </section>
      </article>
    </main>
  );
}
