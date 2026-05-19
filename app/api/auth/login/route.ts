import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Auth is not configured. Please contact support." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore cookie errors in API routes
          }
        },
      },
    });

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
    ).replace(/\/$/, "");

    const nextPath =
      typeof next === "string" && next.startsWith("/") ? next : "/dashboard";

    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error("Magic link error:", error.message);
      return NextResponse.json(
        {
          error:
            error.message ||
            "Failed to send magic link. Check your email and try again.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Failed to send magic link. Please try again." },
      { status: 500 }
    );
  }
}
