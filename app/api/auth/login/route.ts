import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const trimmed = email?.trim();

    if (!trimmed) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { error: "Auth not configured" },
        { status: 500 }
      );
    }

    const baseUrl =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      new URL(req.url).origin;

    const supabase = createClient(url, key);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error("Magic link error:", error);
      return NextResponse.json(
        { error: "Failed to send magic link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
}
