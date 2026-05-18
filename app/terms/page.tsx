import Link from "next/link";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="May 18, 2026">
      <Section title="What Ruled Is">
        <p>
          Ruled is a legal information tool for Canadians dealing with small
          claims disputes. We use AI to help you understand your case, draft
          documents, and prepare for court. Ruled is not a law firm and does not
          provide legal advice. Nothing on Ruled creates a lawyer-client
          relationship.
        </p>
      </Section>

      <Section title="What Ruled Is Not">
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>Ruled is not a lawyer and does not represent you in court</li>
          <li>
            We are not responsible for the outcome of your case — winning or
            losing depends on the facts, the law, and the court
          </li>
          <li>
            We are not liable for decisions you make based on an assessment or
            document we generated
          </li>
        </ul>
        <p className="mt-3">
          If you need legal advice for your specific situation, talk to a
          licensed lawyer in your province.
        </p>
      </Section>

      <Section title="Your Responsibilities">
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>
            Provide accurate information when describing your case and filling
            out forms
          </li>
          <li>
            Make your own decision about whether to send a demand letter, file in
            court, or settle
          </li>
          <li>
            Review any document we generate before you send or file it
          </li>
        </ul>
      </Section>

      <Section title="Payment Terms">
        <p>
          Paid features are flat-fee — you pay once for the service listed at
          checkout. Once a document has been generated and delivered to you, fees
          are non-refundable. Free features, including the case assessment, cost
          nothing.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, Ruled&apos;s total liability
          to you for any claim related to the service is limited to the amount
          you paid us for that specific service. We are not liable for indirect,
          incidental, or consequential damages.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms? Email{" "}
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
