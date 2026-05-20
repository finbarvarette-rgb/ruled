import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, phone, address, city, province, postal_code")
    .eq("user_id", user!.id)
    .maybeSingle();

  return <ProfileClient initialProfile={profile ?? null} />;
}

