import { createClient } from "@/lib/supabase/server";
import { AccountSettings } from "../account/AccountSettings";

export default async function ProfilePage() {
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
    <main className="px-4 sm:px-6 py-8 md:py-10">
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
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

