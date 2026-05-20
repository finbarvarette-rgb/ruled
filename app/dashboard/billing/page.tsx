import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { dash } from "../theme";

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

function displayAmount(cents: number | null, tier: string | null): string {
  if (typeof cents === "number") {
    return `$${(cents / 100).toFixed(2)}`;
  }
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
    .select("id, created_at, tier_purchased, paid, amount_paid_cents, receipt_url, purchased_at")
    .or(filter)
    .eq("paid", true)
    .order("purchased_at", { ascending: false, nullsFirst: false });

  const purchases = (cases ?? []).filter((c) => c.paid);

  return (
    <main className="px-4 sm:px-6 py-8 md:py-10">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm" style={{ color: dash.mainMuted }}>
            Past purchases and receipts.
          </p>
        </header>

        {purchases.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-sm"
            style={{ ...dash.panel, color: dash.mainMuted }}
          >
            No purchases yet.
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ ...dash.panel }}
          >
            <div
              className="grid grid-cols-12 px-5 py-3 text-xs font-semibold"
              style={{ color: dash.mainMuted, borderBottom: `1px solid ${dash.rowDivider}` }}
            >
              <div className="col-span-4">Date</div>
              <div className="col-span-4">Product</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2 text-right">Receipt</div>
            </div>
            {purchases.map((p) => {
              const date = new Date(p.purchased_at ?? p.created_at).toLocaleDateString("en-CA", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-12 px-5 py-4 text-sm items-center"
                  style={{ borderBottom: `1px solid ${dash.rowDivider}` }}
                >
                  <div className="col-span-4" style={{ color: dash.mainText }}>
                    {date}
                  </div>
                  <div className="col-span-4" style={{ color: dash.mainText }}>
                    {productName(p.tier_purchased)}
                  </div>
                  <div className="col-span-2" style={{ color: dash.mainText }}>
                    {displayAmount(p.amount_paid_cents ?? null, p.tier_purchased ?? null)}
                  </div>
                  <div className="col-span-2 text-right">
                    {p.receipt_url ? (
                      <a
                        href={p.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold"
                        style={{ color: "#c8392b" }}
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-xs" style={{ color: dash.mainMuted }}>
                        —
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-sm" style={{ color: dash.mainMuted }}>
          Need help? Email{" "}
          <Link href="/contact" style={{ color: "#c8392b" }}>
            support
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

