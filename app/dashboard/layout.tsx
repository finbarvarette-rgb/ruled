import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { DashboardShell } from "./shell/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const firstName = profile?.first_name ?? null;
  const lastName = profile?.last_name ?? null;
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? user.email?.[0] ?? "U"}`
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardShell
      user={{
        email: user.email ?? null,
        firstName,
        lastName,
        initials,
      }}
    >
      {children}
    </DashboardShell>
  );
}
