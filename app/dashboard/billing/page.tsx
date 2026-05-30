import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { generateCaseTitle } from "../case-utils";

const CARD = "#151C2E";
const GOLD = "#D4A853";
const GREEN = "#10B981";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.5)";
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

function displayAmount(cents: number | null, tier: string | null): string {
  if (typeof cents === "number") return `$${(cents / 100).toFixed(2)}`;
  if (tier === "full") return "$199.00";
  if (tier === "demand") return "$49.00";
  return "—";
}

function productName(tier: string | null): string {
  if (tier === "full") return "Full Case Pack";
  if (tier === "demand") return "Demand Letter";
  return "Purchase";
}

export default async function BillingPage() {
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
    .select(
      "id, created_at, tier_purchased, paid, amount_paid_cents, receipt_url, purchased_at, intake_text, case_assessment, province"
    )
    .or(filter)
    .eq("paid", true)
    .order("purchased_at", { ascending: false, nullsFirst: false });

  const purchases = (cases ?? []).filter((c) => c.paid);

  return (
    <main style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 32,
            color: WHITE,
            marginBottom: 4,
          }}
        >
          Billing
        </h1>
        <p style={{ color: MUTED, fontSize: 14 }}>
          Your purchase history and receipts.
        </p>
      </div>

      {purchases.length === 0 ? (
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
          No purchases yet.
        </div>
      ) : (
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.5fr 2fr 1fr 1fr",
              padding: "10px 16px",
              borderBottom: `1px solid ${BORDER}`,
            }}
            className="hidden md:grid"
          >
            {["Date", "Description", "Case", "Amount", "Receipt"].map((h) => (
              <div
                key={h}
                style={{
                  fontSize: 11,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: MUTED,
                  fontWeight: 500,
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {purchases.map((p, i) => {
            const date = new Date(
              (p as any).purchased_at ?? p.created_at
            ).toLocaleDateString("en-CA", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const amount = displayAmount(
              (p as any).amount_paid_cents ?? null,
              p.tier_purchased ?? null
            );
            const product = productName(p.tier_purchased);
            const caseTitle = generateCaseTitle(p as any);
            const isLast = i === purchases.length - 1;

            return (
              <div
                key={p.id}
                style={{
                  borderBottom: isLast ? "none" : `1px solid ${BORDER}`,
                }}
              >
                {/* Desktop row */}
                <div
                  className="hidden md:grid"
                  style={{
                    gridTemplateColumns: "1fr 1.5fr 2fr 1fr 1fr",
                    padding: "14px 16px",
                    fontSize: 13,
                    alignItems: "center",
                  }}
                >
                  <div style={{ color: MUTED }}>{date}</div>
                  <div style={{ color: WHITE }}>{product}</div>
                  <div
                    style={{
                      color: MUTED,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {caseTitle}
                  </div>
                  <div style={{ color: GOLD, fontWeight: 600 }}>{amount}</div>
                  <div>
                    {(p as any).receipt_url ? (
                      <a
                        href={(p as any).receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12,
                          color: GOLD,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        Download PDF ↓
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: MUTED }}>—</span>
                    )}
                  </div>
                </div>

                {/* Mobile row */}
                <div
                  className="md:hidden"
                  style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: WHITE }}>
                        {product}
                      </div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{date}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: GOLD }}>{amount}</div>
                  </div>
                  <div style={{ fontSize: 12, color: MUTED }}>{caseTitle}</div>
                  {(p as any).receipt_url && (
                    <a
                      href={(p as any).receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 12,
                        color: GOLD,
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      Download PDF ↓
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 13, color: MUTED }}>
        Need help?{" "}
        <Link href="/contact" style={{ color: GOLD, textDecoration: "none" }}>
          Contact support
        </Link>
        .
      </p>
    </main>
  );
}
