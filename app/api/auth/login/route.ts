import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { email, next } = (await req.json()) as {
      email?: string;
      next?: string;
    };
    const trimmed = email?.trim();

    if (!trimmed) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { error: "Auth is not configured. Please contact support." },
        { status: 500 }
      );
    }

    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      new URL(req.url).origin;

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? origin).replace(
      /\/$/,
      ""
    );

    const nextPath =
      typeof next === "string" && next.startsWith("/") ? next : "/dashboard";

    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const supabase = createClient(url, key);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error("Magic link error:", error.message);
      return NextResponse.json(
        { error: error.message || "Failed to send magic link. Check your email and try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Failed to send magic link. Please try again." },
      { status: 500 }
    );
  }
}
