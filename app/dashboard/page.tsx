import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { extractClaimAmount, generateCaseTitle, getCaseMeta, inferDisputeType } from "./case-utils";

const NAVY = "#0A0F1E";
const CARD = "#151C2E";
const CARD2 = "#1A2236";
const GOLD = "#D4A853";
const GREEN = "#10B981";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(212,168,83,0.25)";
const MUTED = "rgba(255,255,255,0.5)";
const GOLD_DIM = "rgba(212,168,83,0.12)";
const WHITE = "#FFFFFF";

async function syncUserCases(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined
) {
  if (!email) return;
  await supabase.from("cases").update({ user_id: userId }).eq("email", email).is("user_id", null);
  await supabase.from("cases").update({ email }).eq("user_id", userId).is("email", null);
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

  // Stat computations
  const totalCases = allCases.length;
  const activeCases = allCases.filter((c) => {
    const meta = getCaseMeta(c);
    return meta.statusBadge !== "Resolved";
  });

  const moneyAtStake = activeCases.reduce((sum, c) => {
    const amt = extractClaimAmount(c.case_assessment, c.intake_text);
    return sum + (amt ? Number(amt) : 0);
  }, 0);

  const demandLettersSent = allCases.filter((c) => getCaseMeta(c).hasDemandTier).length;

  // 4th card — next response deadline
  const demandCases = allCases.filter((c) => getCaseMeta(c).hasDemandTier);
  let stat4: { label: string; value: string; sub: string; valueColor: string } | null = null;
  if (demandCases.length > 0) {
    const latest = demandCases[0];
    const daysSince = Math.floor(
      (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = 14 - daysSince;
    stat4 = {
      label: "Response Due",
      value: daysRemaining > 0 ? `${daysRemaining} days` : "Deadline Passed",
      sub: inferDisputeType(latest.intake_text),
      valueColor: daysRemaining > 0 ? GREEN : MUTED as string,
    };
  }

  const recent = allCases.slice(0, 5);

  return (
    <main style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 32,
            color: WHITE,
            marginBottom: 4,
          }}
        >
          Welcome back{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p style={{ color: MUTED, fontSize: 14 }}>
          Here&apos;s where all your cases stand.
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
        className="grid-cols-2 md:grid-cols-4"
      >
        <StatCard
          label="Total Cases"
          value={String(totalCases)}
          sub={totalCases === 1 ? "1 active" : `${activeCases.length} active`}
        />
        <StatCard
          label="Money at Stake"
          value={moneyAtStake > 0 ? `$${moneyAtStake.toLocaleString("en-CA")}` : "—"}
          sub="Across active cases"
          valueColor={GOLD}
        />
        <StatCard
          label="Demand Letters"
          value={String(demandLettersSent)}
          sub={demandLettersSent === 1 ? "Sent" : "Sent"}
        />
        {stat4 ? (
          <StatCard
            label={stat4.label}
            value={stat4.value}
            sub={stat4.sub}
            valueColor={stat4.valueColor}
          />
        ) : totalCases === 0 ? (
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER_GOLD}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: MUTED, marginBottom: 8 }}>
              Get Started
            </div>
            <Link
              href="/onboarding"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 15,
                color: GOLD,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Start Your First Case →
            </Link>
          </div>
        ) : (
          <StatCard label="Cases Active" value={String(activeCases.length)} sub="In progress" />
        )}
      </div>

      {/* Recent cases */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 20,
              color: WHITE,
            }}
          >
            Your Cases
          </h2>
          <Link href="/dashboard/case-assessments" style={{ fontSize: 13, color: GOLD, textDecoration: "none" }}>
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 32,
              textAlign: "center",
              color: MUTED,
              fontSize: 14,
            }}
          >
            No cases yet.{" "}
            <Link href="/onboarding" style={{ color: GOLD, textDecoration: "none" }}>
              Start your first case →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {recent.map((c) => {
              const meta = getCaseMeta(c);
              const amount = extractClaimAmount(c.case_assessment, c.intake_text);
              const title = generateCaseTitle(c);
              const disputeType = inferDisputeType(c.intake_text);
              const dateStr = new Date(c.created_at).toLocaleDateString("en-CA", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const progress = meta.pipelineIndex === 0 ? 33 : meta.pipelineIndex === 1 ? 66 : 100;
              const progressColor = meta.pipelineIndex >= 1 ? GREEN : GOLD;

              let badgeStyle: React.CSSProperties = {
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.5px",
                padding: "4px 10px",
                borderRadius: 20,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              };
              if (meta.statusBadge === "Demand Letter Sent") {
                badgeStyle = { ...badgeStyle, background: "rgba(16,185,129,0.15)", color: GREEN };
              } else if (meta.statusBadge === "Filed" || meta.statusBadge === "Hearing Scheduled") {
                badgeStyle = { ...badgeStyle, background: "rgba(200,57,43,0.15)", color: "#C8392B" };
              } else {
                badgeStyle = { ...badgeStyle, background: "rgba(212,168,83,0.15)", color: GOLD };
              }

              return (
                <Link
                  key={c.id}
                  href={`/dashboard/cases/${c.id}`}
                  style={{
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    padding: "20px 24px",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    textDecoration: "none",
                    color: WHITE,
                    transition: "all 0.2s",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: GOLD_DIM,
                      border: `1px solid ${BORDER_GOLD}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" fill="none" stroke={GOLD} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED }}>
                      {disputeType} · {c.province} · {dateStr}
                    </div>
                  </div>

                  {/* Stage */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <span style={badgeStyle}>{meta.statusBadge}</span>
                    <div style={{ width: 120, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                      <div style={{ width: `${progress}%`, height: 4, borderRadius: 2, background: progressColor }} />
                    </div>
                  </div>

                  {/* Amount */}
                  {amount && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: GOLD, flexShrink: 0 }}>
                      ${Number(amount).toLocaleString("en-CA")}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueColor = WHITE,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: MUTED,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 28,
          color: valueColor,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
