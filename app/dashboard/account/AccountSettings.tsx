"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Spinner } from "@/components/Spinner";
import { PROVINCES } from "@/lib/constants";

type UserProfile = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
};

const inputStyle = {
  background: "#0f0e0c",
  color: "#f5f1eb",
  border: "1px solid #2a2825",
};

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9a9590" }}>
      {children}
    </p>
  );
}

export function AccountSettings({
  email: initialEmail,
  initialProfile,
  initialEmailNotifications,
}: {
  email: string;
  initialProfile: UserProfile | null;
  initialEmailNotifications: boolean;
}) {
  const router = useRouter();
  const [email] = useState(initialEmail);

  const [firstName, setFirstName] = useState(initialProfile?.first_name ?? "");
  const [lastName, setLastName] = useState(initialProfile?.last_name ?? "");
  const [phone, setPhone] = useState(initialProfile?.phone ?? "");
  const [address, setAddress] = useState(initialProfile?.address ?? "");
  const [city, setCity] = useState(initialProfile?.city ?? "");
  const [province, setProvince] = useState(initialProfile?.province ?? "");
  const [postalCode, setPostalCode] = useState(initialProfile?.postal_code ?? "");

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(
    initialEmailNotifications
  );
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage("");
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
      setProfileMessage("Saved.");
      setTimeout(() => setProfileMessage(""), 2000);
    } catch (err) {
      setProfileMessage(
        err instanceof Error ? err.message : "Could not save profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    setEmailMessage("");
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });
      if (error) throw error;
      setEmailMessage(
        "Check your new email inbox for a confirmation link to complete the change."
      );
      setNewEmail("");
    } catch {
      setEmailMessage("Could not update email. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage("");

    if (!currentPassword) {
      setPasswordMessage("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const currentEmail = userData.user?.email;
      if (!currentEmail) throw new Error("Missing email on account.");

      // Re-authenticate to verify current password.
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword,
      });
      if (signInErr) throw signInErr;

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) throw updateErr;

      setPasswordMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordMessage(
        err instanceof Error ? err.message : "Could not update password."
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleToggleNotifications(next: boolean) {
    setNotifMessage("");
    setNotifLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { email_notifications: next },
      });
      if (error) throw error;
      setEmailNotifications(next);
      setNotifMessage("Saved.");
      setTimeout(() => setNotifMessage(""), 2000);
    } catch (err) {
      setNotifMessage(
        err instanceof Error ? err.message : "Could not update preferences."
      );
    } finally {
      setNotifLoading(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== "DELETE") {
      setDeleteError("Type DELETE to confirm.");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: deleteConfirm }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
      }
      router.replace("/");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete account."
      );
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm mt-1" style={{ color: "#9a9590" }}>
          Manage your Ruled account
        </p>
      </div>

      {/* Profile information */}
      <section
        className="rounded-xl p-6 flex flex-col gap-5"
        style={{ background: "#1a1916", border: "1px solid #2a2825" }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-sm">Profile information</h2>
          <p className="text-sm" style={{ color: "#9a9590" }}>
            This helps us personalize your documents and case pack.
          </p>
        </div>

        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-2 sm:col-span-1">
              <FieldLabel>City</FieldLabel>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="(optional)"
                className="rounded-lg px-4 py-3 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-1">
              <FieldLabel>Province</FieldLabel>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="rounded-lg px-4 py-3 text-sm outline-none appearance-none cursor-pointer"
                style={{
                  ...inputStyle,
                  color: province ? "#f5f1eb" : "#9a9590",
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
            <div className="flex flex-col gap-2 sm:col-span-1">
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
              disabled={profileLoading}
              className="rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-2"
              style={{ background: "#c8392b", color: "#f5f1eb" }}
            >
              {profileLoading && <Spinner />}
              {profileLoading ? "Saving…" : "Save profile"}
            </button>
            {profileMessage && (
              <p
                className="text-sm"
                style={{
                  color: profileMessage === "Saved." ? "#9a9590" : "#c8392b",
                }}
              >
                {profileMessage}
              </p>
            )}
          </div>
        </form>
      </section>

      <section
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ background: "#1a1916", border: "1px solid #2a2825" }}
      >
        <h2 className="font-semibold text-sm">Email</h2>
        <p className="text-sm" style={{ color: "#9a9590" }}>
          Current: <span style={{ color: "#f5f1eb" }}>{email}</span>
        </p>
        <form
          onSubmit={handleEmailUpdate}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email address"
            required
            className="flex-1 rounded-lg px-4 py-3 text-sm outline-none"
            style={{
              background: "#0f0e0c",
              color: "#f5f1eb",
              border: "1px solid #2a2825",
            }}
          />
          <button
            type="submit"
            disabled={emailLoading}
            className="rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer shrink-0"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            {emailLoading ? "Sending…" : "Update email"}
          </button>
        </form>
        {emailMessage && (
          <p className="text-sm" style={{ color: "#9a9590" }}>
            {emailMessage}
          </p>
        )}
      </section>

      {/* Password */}
      <section
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ background: "#1a1916", border: "1px solid #2a2825" }}
      >
        <h2 className="font-semibold text-sm">Password</h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="rounded-lg px-4 py-3 text-sm outline-none"
            style={inputStyle}
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min. 8 characters)"
            className="rounded-lg px-4 py-3 text-sm outline-none"
            style={inputStyle}
            required
          />
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Confirm new password"
            className="rounded-lg px-4 py-3 text-sm outline-none"
            style={inputStyle}
            required
          />
          {passwordMessage && (
            <p
              className="text-sm"
              style={{
                color:
                  passwordMessage === "Password updated."
                    ? "#9a9590"
                    : "#c8392b",
              }}
            >
              {passwordMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-2"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            {passwordLoading && <Spinner />}
            {passwordLoading ? "Updating…" : "Change password"}
          </button>
        </form>
      </section>

      {/* Notification preferences */}
      <section
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ background: "#1a1916", border: "1px solid #2a2825" }}
      >
        <h2 className="font-semibold text-sm">Notification preferences</h2>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Email notifications</p>
            <p className="text-sm" style={{ color: "#9a9590" }}>
              Case updates, product delivery, and tips.
            </p>
          </div>
          <button
            type="button"
            disabled={notifLoading}
            onClick={() => handleToggleNotifications(!emailNotifications)}
            className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold disabled:opacity-60 cursor-pointer"
            style={{
              background: emailNotifications ? "#c8392b" : "#0f0e0c",
              color: "#f5f1eb",
              border: emailNotifications ? "1px solid #c8392b" : "1px solid #2a2825",
            }}
          >
            {emailNotifications ? "On" : "Off"}
          </button>
        </div>
        {notifMessage && (
          <p
            className="text-sm"
            style={{ color: notifMessage === "Saved." ? "#9a9590" : "#c8392b" }}
          >
            {notifMessage}
          </p>
        )}
      </section>

      <section
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ background: "#1a1916", border: "1px solid #c8392b" }}
      >
        <h2 className="font-semibold text-sm" style={{ color: "#c8392b" }}>
          Danger zone
        </h2>
        <p className="text-sm" style={{ color: "#9a9590" }}>
          Permanently delete your account and all associated cases. This cannot
          be undone.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="self-start rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
          style={{
            background: "transparent",
            color: "#c8392b",
            border: "1px solid #c8392b",
          }}
        >
          Delete account
        </button>
      </section>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(15, 14, 12, 0.85)" }}
        >
          <div
            className="max-w-md w-full rounded-xl p-6 flex flex-col gap-4"
            style={{ background: "#1a1916", border: "1px solid #2a2825" }}
          >
            <h3 className="font-semibold">Are you sure?</h3>
            <p className="text-sm" style={{ color: "#9a9590" }}>
              This will permanently delete all your cases and data. Type DELETE
              to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="rounded-lg px-4 py-3 text-sm outline-none"
              style={{
                background: "#0f0e0c",
                color: "#f5f1eb",
                border: "1px solid #2a2825",
              }}
            />
            {deleteError && (
              <p className="text-sm" style={{ color: "#c8392b" }}>
                {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                  setDeleteError("");
                }}
                className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold cursor-pointer"
                style={{ border: "1px solid #2a2825", color: "#9a9590" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDelete}
                className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer"
                style={{ background: "#c8392b", color: "#f5f1eb" }}
              >
                {deleteLoading ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
