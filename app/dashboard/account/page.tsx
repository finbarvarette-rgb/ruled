import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import { AccountSettings } from "./AccountSettings";

export default async function DashboardAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const emailNotifications =
    (user?.user_metadata as Record<string, unknown> | null)?.email_notifications;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, phone, address, city, province, postal_code")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8">
        <DashboardNav active="account" />
        <AccountSettings
          email={user!.email ?? ""}
          initialProfile={profile ?? null}
          initialEmailNotifications={
            typeof emailNotifications === "boolean" ? emailNotifications : true
          }
        />
      </div>
    </main>
  );
}
