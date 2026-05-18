import Link from "next/link";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="May 18, 2026">
      <Section title="What We Collect">
        <p>
          When you use Ruled, we collect information you choose to give us:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2 mt-3">
          <li>Your case description — what happened, who owes you money, and why</li>
          <li>Your email address, if you save your assessment or join our waitlist</li>
          <li>Your province, so we apply the right small claims rules</li>
          <li>Outcome data, if you tell us whether you recovered your money</li>
          <li>Details you enter for demand letters, such as names and addresses</li>
        </ul>
      </Section>

      <Section title="How We Use It">
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 flex flex-col gap-2 mt-3">
          <li>Generate your case assessment and legal documents</li>
          <li>Send your assessment to your email when you request it</li>
          <li>Improve Ruled — for example, understanding which cases succeed</li>
          <li>Contact you about products you signed up for, like the Full Case Pack waitlist</li>
        </ul>
      </Section>

      <Section title="What We Don't Do">
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>We never sell your data</li>
          <li>We never share your case details with third parties for marketing</li>
          <li>We never publish your case details in a way that identifies you publicly</li>
        </ul>
        <p className="mt-3">
          We use service providers (such as hosting and AI providers) only to run
          the product — not to market to you on their behalf.
        </p>
      </Section>

      <Section title="Data Retention">
        <p>
          Case records are stored for up to two years, then deleted from our
          systems. You can ask us to delete your data sooner by emailing{" "}
          <a href="mailto:hello@ruled.ca" style={{ color: "#c8392b" }}>
            hello@ruled.ca
          </a>
          .
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about privacy? Email us at{" "}
          <a href="mailto:hello@ruled.ca" style={{ color: "#c8392b" }}>
            hello@ruled.ca
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}

function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <article className="max-w-2xl mx-auto w-full flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="text-sm w-fit"
            style={{ color: "#9a9590" }}
          >
            &larr; Back to home
          </Link>
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Ruled<span style={{ color: "#c8392b" }}>.</span>
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm" style={{ color: "#9a9590" }}>
            Last updated: {updated}
          </p>
        </div>
        <div className="flex flex-col gap-8 text-sm leading-relaxed" style={{ color: "#d4cfc9" }}>
          {children}
        </div>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold" style={{ color: "#f5f1eb" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
