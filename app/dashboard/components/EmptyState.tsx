import Link from "next/link";
import { dash } from "../theme";

export function EmptyState() {
  return (
    <section className="rounded-xl p-8 md:p-10 flex flex-col gap-6 text-center items-center" style={{ ...dash.panel }}>
      <div className="flex flex-col gap-2 max-w-md">
        <h2 className="text-xl font-semibold tracking-tight">
          Welcome to your Ruled dashboard
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: dash.mainMuted }}>
          You haven&apos;t started a case yet. It&apos;s free to begin.
        </p>
      </div>
      <Link
        href="/onboarding"
        className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold w-full sm:w-auto transition-opacity hover:opacity-90"
        style={dash.primaryBtn}
      >
        Start My Free Case Assessment &rarr;
      </Link>
      <p className="text-sm leading-relaxed max-w-md" style={{ color: dash.mainMuted }}>
        Once you complete your assessment, your case strength, documents, next
        steps, and progress tracker will all live here — so you can fight back
        and get what you&apos;re owed.
      </p>
    </section>
  );
}
