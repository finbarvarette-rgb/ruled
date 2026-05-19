import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const TIER_PRICES: Record<string, number> = {
  demand: 49,
  full: 199,
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey || key !== adminKey) {
    redirect("/");
  }

  const supabase = getSupabaseAdmin();
  const { data: cases, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="px-6 py-16">
        <p style={{ color: "#c8392b" }}>Failed to load admin data.</p>
      </main>
    );
  }

  const rows = cases ?? [];
  const totalCases = rows.length;

  const byProvince: Record<string, number> = {};
  const byTier: Record<string, number> = {
    free: 0,
    demand: 0,
    full: 0,
  };
  const outcomes: Record<string, number> = {
    won: 0,
    lost: 0,
    pending: 0,
  };
  let totalRevenue = 0;

  for (const c of rows) {
    byProvince[c.province] = (byProvince[c.province] ?? 0) + 1;

    if (!c.paid || !c.tier_purchased) {
      byTier.free += 1;
    } else {
      const tier = c.tier_purchased as string;
      byTier[tier] = (byTier[tier] ?? 0) + 1;
      totalRevenue += TIER_PRICES[tier] ?? 0;
    }

    if (c.outcome === "won") outcomes.won += 1;
    else if (c.outcome === "lost") outcomes.lost += 1;
    else outcomes.pending += 1;
  }

  const recent = rows.slice(0, 20);

  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm mt-1" style={{ color: "#9a9590" }}>
            Ruled internal dashboard
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total cases" value={String(totalCases)} />
          <StatCard
            label="Total revenue"
            value={`$${totalRevenue.toLocaleString()}`}
          />
          <StatCard label="Won" value={String(outcomes.won)} />
          <StatCard label="Lost" value={String(outcomes.lost)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BreakdownCard title="Cases by province">
            {Object.entries(byProvince)
              .sort((a, b) => b[1] - a[1])
              .map(([province, count]) => (
                <Row key={province} left={province} right={String(count)} />
              ))}
          </BreakdownCard>
          <BreakdownCard title="Cases by tier">
            <Row left="Free" right={String(byTier.free)} />
            <Row left="Demand ($49)" right={String(byTier.demand)} />
            <Row left="Full ($199)" right={String(byTier.full)} />
          </BreakdownCard>
        </div>

        <BreakdownCard title="Outcomes">
          <Row left="Won / recovered" right={String(outcomes.won)} />
          <Row left="Lost / not recovered" right={String(outcomes.lost)} />
          <Row left="Pending" right={String(outcomes.pending)} />
        </BreakdownCard>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Recent cases</h2>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#2a2825" }}>
            <table className="w-full text-sm text-left min-w-[640px]">
              <thead style={{ background: "#1a1916" }}>
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Province</th>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Outcome</th>
                  <th className="px-4 py-3 font-medium">Intake</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t"
                    style={{ borderColor: "#2a2825" }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-3">{c.province}</td>
                    <td className="px-4 py-3">
                      {c.tier_purchased ?? "free"}
                    </td>
                    <td className="px-4 py-3">{c.paid ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{c.outcome ?? "—"}</td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {(c.intake_text ?? "").slice(0, 100)}
                      {(c.intake_text?.length ?? 0) > 100 ? "…" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: "#1a1916", border: "1px solid #2a2825" }}
    >
      <span className="text-xs" style={{ color: "#9a9590" }}>
        {label}
      </span>
      <span className="text-xl font-bold">{value}</span>
    </div>
  );
}

function BreakdownCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: "#1a1916", border: "1px solid #2a2825" }}
    >
      <h3 className="font-semibold text-sm">{title}</h3>
      {children}
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: "#9a9590" }}>{left}</span>
      <span>{right}</span>
    </div>
  );
}
