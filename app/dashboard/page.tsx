import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CaseList } from "@/components/CaseList";
import { DashboardNav } from "@/components/DashboardNav";
import { DashboardWelcome } from "@/components/DashboardWelcome";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .eq("email", user.email!)
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-10">
        <DashboardWelcome show={cases?.length === 0} />
        <DashboardNav />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Your cases</h1>
          <p className="text-sm" style={{ color: "#9a9590" }}>
            Welcome back, {user.email}
          </p>
        </div>

        <CaseList cases={cases ?? []} />

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
