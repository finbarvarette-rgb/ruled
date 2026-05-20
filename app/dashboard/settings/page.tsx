import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const emailNotifications =
    (user?.user_metadata as Record<string, unknown> | null)?.email_notifications;

  return (
    <SettingsClient
      initialEmailNotifications={
        typeof emailNotifications === "boolean" ? emailNotifications : true
      }
    />
  );
}

