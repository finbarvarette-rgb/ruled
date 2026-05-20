import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfilePayload = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        "user_id, first_name, last_name, phone, address, city, province, postal_code"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to load profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data ?? null });
  } catch (err) {
    console.error("Get profile error:", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const body = (await req.json()) as ProfilePayload;

    const payload = {
      user_id: user.id,
      first_name: body.first_name ?? null,
      last_name: body.last_name ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      province: body.province ?? null,
      postal_code: body.postal_code ?? null,
    };

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select(
        "user_id, first_name, last_name, phone, address, city, province, postal_code"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to save profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("Save profile error:", err);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}

