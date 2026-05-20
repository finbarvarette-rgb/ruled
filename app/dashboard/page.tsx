import { createClient } from "@/lib/supabase/server";
import { CaseList } from "@/components/CaseList";
import { DashboardNav } from "@/components/DashboardNav";
import { DashboardWelcome } from "@/components/DashboardWelcome";
import Link from "next/link";

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

  const hasCases = (cases?.length ?? 0) > 0;

  return (
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-10">
        <DashboardWelcome show={!hasCases} />
        <DashboardNav active="dashboard" />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Your cases</h1>
          <p className="text-sm" style={{ color: "#9a9590" }}>
            Welcome back, {user!.email}
          </p>
        </div>

        {hasCases ? (
          <CaseList cases={cases ?? []} />
        ) : (
          <div
            className="rounded-xl p-8 flex flex-col gap-5"
            style={{ background: "#1a1916", border: "1px solid #2a2825" }}
          >
            <p className="text-sm" style={{ color: "#9a9590" }}>
              You haven&apos;t started a case yet. It&apos;s free to begin.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold w-fit transition-opacity hover:opacity-90"
              style={{ background: "#c8392b", color: "#f5f1eb" }}
            >
              Start My Free Case Assessment &rarr;
            </Link>
            <p className="text-sm" style={{ color: "#9a9590" }}>
              Once you complete your assessment, your case, documents, and next
              steps will all live here.
            </p>
          </div>
        )}

        <Link
          href="/onboarding"
          className="text-sm w-fit"
          style={{ color: "#c8392b" }}
        >
          &larr; New assessment
        </Link>
      </div>
    </main>
  );
}
