import Link from "next/link";

export function DashboardNav() {
  return (
    <nav className="flex items-center gap-4 text-sm mb-6">
      <Link href="/dashboard" style={{ color: "#f5f1eb" }}>
        Dashboard
      </Link>
      <Link href="/account" style={{ color: "#9a9590" }}>
        Account
      </Link>
      <Link href="/" style={{ color: "#9a9590" }}>
        New assessment
      </Link>
    </nav>
  );
}
