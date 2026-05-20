import { createClient } from "@/lib/supabase/server";
import { generateCaseTitle, getCaseMeta } from "./case-utils";
import { dash } from "./theme";

async function syncUserCases(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined
) {
  if (!email) return;

  await supabase
    .from("cases")
    .update({ user_id: userId })
    .eq("email", email)
    .is("user_id", null);

  await supabase
    .from("cases")
    .update({ email })
    .eq("user_id", userId)
    .is("email", null);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await syncUserCases(supabase, user!.id, user!.email ?? undefined);

  const filter = user!.email
    ? `user_id.eq.${user!.id},email.eq.${user!.email}`
    : `user_id.eq.${user!.id}`;

  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .or(filter)
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name")
    .eq("user_id", user!.id)
    .maybeSingle();

  const firstName = profile?.first_name ?? null;

  const allCases = cases ?? [];
  const totalCases = allCases.length;
  const casesInProgress = allCases.filter((c) => {
    const meta = getCaseMeta(c);
    return meta.statusBadge !== "Resolved";
  }).length;
  const documentsReady = allCases.reduce((acc, c) => {
    const meta = getCaseMeta(c);
    return (
      acc +
      meta.documents.filter((d) => d.available && d.content?.trim()).length
    );
  }, 0);

  const recent = allCases.slice(0, 3).map((c) => {
    const meta = getCaseMeta(c);
    return {
      id: c.id,
      title: generateCaseTitle(c),
      createdAt: c.created_at,
      status: meta.statusBadge,
    };
  });

  return (
    <main className="px-4 sm:px-6 py-8 md:py-10">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm" style={{ color: dash.mainMuted }}>
            Here&apos;s what&apos;s happening with your cases.
          </p>
        </header>

        {/* Summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Total cases" value={String(totalCases)} />
          <SummaryCard label="Cases in progress" value={String(casesInProgress)} />
          <SummaryCard label="Documents ready" value={String(documentsReady)} />
        </div>

        {/* Recent activity */}
        <section className="rounded-2xl p-6 md:p-8 flex flex-col gap-5" style={{ ...dash.panel }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Recent activity</h2>
              <p className="text-sm" style={{ color: dash.mainMuted }}>
                Your latest case updates
              </p>
            </div>
            <a
              href="/dashboard/case-assessments"
              className="text-sm font-semibold"
              style={{ color: "#c8392b" }}
            >
              View all →
            </a>
          </div>

          {recent.length === 0 ? (
            <div
              className="rounded-xl p-6 text-sm"
              style={{ ...dash.nested, color: dash.mainMuted }}
            >
              No cases yet. Click the + button to start a new assessment.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recent.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  style={{ ...dash.nested }}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs" style={{ color: dash.mainMuted }}>
                      Created{" "}
                      {new Date(item.createdAt).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 w-fit"
                    style={{
                      background: "rgba(200, 57, 43, 0.12)",
                      color: "#c8392b",
                      border: "1px solid rgba(200, 57, 43, 0.30)",
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ ...dash.panel }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: dash.mainMuted }}>
        {label}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
