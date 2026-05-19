import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { email, password, next } = (await req.json()) as {
      email?: string;
      password?: string;
      next?: string;
    };

    const trimmedEmail = email?.trim();
    if (!trimmedEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Auth is not configured. Please contact support." },
        { status: 500 }
      );
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
    ).replace(/\/$/, "");

    const nextPath =
      typeof next === "string" && next.startsWith("/") ? next : "/dashboard";

    const emailRedirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;

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
            // Ignore in API routes
          }
        },
      },
    });

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { emailRedirectTo },
    });

    if (error) {
      console.error("Signup error:", error.message);
      // Surface friendly messages for common cases
      if (error.message.toLowerCase().includes("already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to create account. Please try again." },
        { status: 400 }
      );
    }

    // If session exists immediately → email confirmation is disabled in Supabase
    const hasSession = !!data.session;

    return NextResponse.json({ success: true, needsVerification: !hasSession });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
