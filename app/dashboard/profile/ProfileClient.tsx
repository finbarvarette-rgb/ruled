"use client";

import { useState } from "react";
import { Spinner } from "@/components/Spinner";
import { PROVINCES } from "@/lib/constants";
import { dash } from "../theme";

type UserProfile = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
};

const inputStyle = { ...dash.input };

function FieldLabel({ children }: { children: string }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-wide"
      style={{ color: dash.mainMuted }}
    >
      {children}
    </p>
  );
}

export function ProfileClient({
  initialProfile,
}: {
  initialProfile: UserProfile | null;
}) {
  const [firstName, setFirstName] = useState(initialProfile?.first_name ?? "");
  const [lastName, setLastName] = useState(initialProfile?.last_name ?? "");
  const [phone, setPhone] = useState(initialProfile?.phone ?? "");
  const [address, setAddress] = useState(initialProfile?.address ?? "");
  const [city, setCity] = useState(initialProfile?.city ?? "");
  const [province, setProvince] = useState(initialProfile?.province ?? "");
  const [postalCode, setPostalCode] = useState(initialProfile?.postal_code ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          province: province || null,
          postal_code: postalCode.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save profile");
      setMessage("Saved.");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="px-4 sm:px-6 py-8 md:py-10">
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Profile
          </h1>
          <p className="text-sm" style={{ color: dash.mainMuted }}>
            Your name and contact details used in documents.
          </p>
        </header>

        <section className="rounded-2xl p-6 flex flex-col gap-5" style={{ ...dash.panel }}>
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <FieldLabel>First name</FieldLabel>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel>Last name</FieldLabel>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <FieldLabel>Phone number</FieldLabel>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(optional)"
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel>Street address</FieldLabel>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="(optional)"
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <FieldLabel>City</FieldLabel>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="(optional)"
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel>Province</FieldLabel>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="rounded-lg px-4 py-3 text-sm outline-none appearance-none cursor-pointer"
                  style={{
                    ...inputStyle,
                    color: province ? dash.mainText : dash.mainMuted,
                  }}
                >
                  <option value="">Select</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel>Postal code</FieldLabel>
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="(optional)"
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-2"
                style={dash.primaryBtn}
              >
                {saving && <Spinner />}
                {saving ? "Saving…" : "Save profile"}
              </button>
              {message && (
                <p
                  className="text-sm"
                  style={{ color: message === "Saved." ? dash.mainMuted : dash.errorText }}
                >
                  {message}
                </p>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

