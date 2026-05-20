import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import { AccountSettings } from "./AccountSettings";

export default async function DashboardAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8">
        <DashboardNav active="account" />
        <AccountSettings email={user!.email ?? ""} />
      </div>
    </main>
  );
}
