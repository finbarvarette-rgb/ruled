import Link from "next/link";

type ActiveTab = "dashboard" | "account";

export function DashboardNav({ active = "dashboard" }: { active?: ActiveTab }) {
  return (
    <nav className="flex items-center gap-4 text-sm mb-6">
      <Link
        href="/dashboard"
        style={{ color: active === "dashboard" ? "#f5f1eb" : "#9a9590" }}
      >
        Dashboard
      </Link>
      <Link
        href="/dashboard/account"
        style={{ color: active === "account" ? "#f5f1eb" : "#9a9590" }}
      >
        Account
      </Link>
      <Link href="/onboarding" style={{ color: "#9a9590" }}>
        New assessment
      </Link>
    </nav>
  );
}
