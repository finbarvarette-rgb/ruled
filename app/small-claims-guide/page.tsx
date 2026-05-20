import Link from "next/link";

export default function SmallClaimsGuidePage() {
  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16">
      <article className="max-w-2xl mx-auto w-full flex flex-col gap-10">
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
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#c8392b" }}>
            Guide
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Small claims court in Canada
          </h1>
        </div>

        <p className="text-base leading-relaxed" style={{ color: "#d4cfc9" }}>
          Small claims court is designed for everyday disputes over money or property—without the
          cost and complexity of higher courts. Rules, dollar limits, and procedures vary by
          province and territory, but the idea is the same: a simpler path to resolve a claim.
        </p>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">What it is</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            A civil forum where individuals and small businesses can sue for a capped amount
            (limits differ by province—often in the tens of thousands of dollars). Hearings are
            usually less formal than superior court, and many people represent themselves.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">When it makes sense</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            Typical situations include unpaid invoices, deposit disputes, incomplete contractor work,
            small consumer issues, and similar money claims. If your claim is above the limit, you
            may need a different court level—check your province&apos;s rules.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">How long it takes</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            Timelines depend on backlog, whether the other side responds, and whether you settle.
            Filing is usually the fast part; getting a hearing date can range from weeks to many
            months depending on where you are. Your local court website publishes the most accurate
            expectations.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">What it costs to file</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            Filing fees are set by each province and often scale with the amount you&apos;re
            claiming. There may be additional fees for service or copies. Budget for filing plus
            your time to prepare evidence and attend steps or a hearing.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">How Ruled helps</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            Ruled helps you understand your position quickly with a free AI-powered case assessment,
            then offers flat-fee documents like a demand letter and a fuller case pack so you can
            communicate clearly, organize your evidence, and walk into small claims better prepared.
            We&apos;re built for Canadians navigating this process without a lawyer—not a substitute
            for one when you need individualized legal representation.
          </p>
        </section>

        <div className="pt-4">
          <Link
            href="/onboarding"
            className="inline-flex justify-center rounded-lg px-6 py-4 text-sm font-semibold w-full sm:w-auto"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            See If You Have a Case &rarr;
          </Link>
        </div>
      </article>
    </main>
  );
}
