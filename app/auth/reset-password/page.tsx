"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";

const inputStyle = {
  background: "#1a1916",
  color: "#f5f1eb",
  border: "1px solid #2a2825",
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [ready, setReady] = useState(false);
  const [exchangeError, setExchangeError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) {
      setExchangeError("Invalid or expired reset link. Please request a new one.");
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setExchangeError("This reset link has expired or already been used. Please request a new one.");
      } else {
        setReady(true);
      }
    });
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || "Failed to update password. Please try again.");
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    }
  }

  if (exchangeError) {
    return (
      <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
        <div className="max-w-md mx-auto w-full flex flex-col gap-10 items-center text-center">
          <Link
            href="/"
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            ruled<span style={{ color: "#c8392b" }}>.ca</span>
          </Link>
          <div className="flex flex-col gap-3 w-full">
            <h1 className="text-2xl font-semibold tracking-tight">Link expired</h1>
            <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
              {exchangeError}
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="w-full rounded-lg px-6 py-4 text-sm font-semibold text-center"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Request a new link
          </Link>
          <Link href="/login" className="text-sm" style={{ color: "#9a9590" }}>
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex flex-1 items-center justify-center min-h-screen">
        <Spinner className="w-10 h-10" />
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
        <div className="max-w-md mx-auto w-full flex flex-col gap-10 items-center text-center">
          <Link
            href="/"
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            ruled<span style={{ color: "#c8392b" }}>.ca</span>
          </Link>
          <div className="flex flex-col gap-3 w-full">
            <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
            <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
              Your password has been changed. Redirecting you to your dashboard…
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-md mx-auto w-full flex flex-col gap-10 items-center text-center">
        <Link
          href="/"
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          ruled<span style={{ color: "#c8392b" }}>.ca</span>
        </Link>

        <div className="flex flex-col gap-3 w-full">
          <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min. 8 characters)"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#c8392b")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2825")}
          />
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#c8392b")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2825")}
          />
          {error && (
            <p className="text-sm text-left" style={{ color: "#c8392b" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-6 py-4 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            {loading && <Spinner />}
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>

        <Link href="/login" className="text-sm" style={{ color: "#9a9590" }}>
          &larr; Back to sign in
        </Link>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center min-h-screen">
          <Spinner className="w-10 h-10" />
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
