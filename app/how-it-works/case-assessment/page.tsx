import Link from "next/link";
import {
  m,
  marketingBtnPrimary,
  marketingCard,
  marketingPageMain,
  ruledLogoSuffixStyle,
} from "@/lib/marketing-theme";

const SAMPLE_ASSESSMENT = `CASE STRENGTH SUMMARY
─────────────────────
Overall position: Moderate to strong for small claims.

Key factors reviewed:
• Written agreement / text trail establishing scope and price
• Partial performance vs. promised work
• Payment history and outstanding balance

EVIDENCE CHECKLIST
──────────────────
□ Signed quote or estimate
□ Deposit receipt
□ Photos of incomplete work
□ Communication log (dates matter)

RISKS & WEAKNESSES
──────────────────
Counterparty may argue scope creep or oral change orders. Document everything before filing.

RECOMMENDED NEXT STEPS
───────────────────────
1. Send a formal demand with a clear deadline
2. Organize exhibits chronologically
3. File in the correct jurisdiction if unpaid after deadline`;

export default function CaseAssessmentHowItWorksPage() {
  return (
    <main
      className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16"
      style={marketingPageMain}
    >
      <article className="max-w-2xl mx-auto w-full flex flex-col gap-10">
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
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: m.amber }}>
            How it works
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: m.text }}>
            Your free case assessment
          </h1>
        </div>

        <p className="text-base leading-relaxed" style={{ color: m.subtext }}>
          The case assessment is the first step when you use Ruled. You describe what happened in
          plain language—no legal jargon required—and our system generates a structured analysis of
          your situation so you can decide what to do next.
        </p>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold" style={{ color: m.text }}>
            Why it matters
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
            Most people never recover money they&apos;re owed because they don&apos;t know whether they
            have a realistic path forward. A clear snapshot of strength, gaps, and next steps helps
            you avoid wasting time—or walking away from a winnable claim.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold" style={{ color: m.text }}>
            What the AI analyzes
          </h2>
          <ul
            className="list-disc pl-5 text-sm leading-relaxed flex flex-col gap-2 marker:text-[#2563EB]"
            style={{ color: m.subtext }}
          >
            <li>The facts you provide (who, what, when, amounts, province)</li>
            <li>How your story lines up with a typical small-claims style dispute</li>
            <li>Practical strengths, weaknesses, and evidence to gather</li>
            <li>Suggested next steps tailored to your case—not generic legal advice</li>
          </ul>
          <p className="text-xs leading-relaxed" style={{ color: m.muted }}>
            Ruled is not a law firm. The assessment is informational and decision-support—not a
            substitute for a lawyer where one is required.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold" style={{ color: m.text }}>
            What your output can look like
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
            Every case is different, but assessments are organized so you can scan headings, check
            evidence ideas, and move to action. Below is a stylized example of what you might
            receive.
          </p>
          <div
            className="rounded-xl p-5 overflow-hidden"
            style={marketingCard}
          >
            <pre
              className="whitespace-pre-wrap text-xs leading-relaxed font-mono"
              style={{ color: m.subtext }}
            >
              {SAMPLE_ASSESSMENT}
            </pre>
          </div>
          <p className="text-xs text-center" style={{ color: m.muted }}>
            Preview is illustrative only.
          </p>
        </section>

        <div className="pt-4">
          <Link
            href="/onboarding"
            className="inline-flex justify-center rounded-full px-6 py-4 text-sm font-semibold w-full sm:w-auto"
            style={marketingBtnPrimary}
          >
            Start My Free Case Assessment &rarr;
          </Link>
        </div>
      </article>
    </main>
  );
}
