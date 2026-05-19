import Link from "next/link";

export function Nav() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b px-4 sm:px-6 py-4"
      style={{ background: "#0f0e0c", borderColor: "#2a2825" }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight shrink-0"
          style={{ fontFamily: "Georgia, \'Times New Roman\', serif" }}
        >
          ruled<span style={{ color: "#c8392b" }}>.ca</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 ml-auto">
          <Link
            href="/login"
            className="text-sm transition-opacity hover:opacity-80"
            style={{ color: "#9a9590" }}
          >
            Sign In
          </Link>
          <Link
            href="/onboarding"
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
