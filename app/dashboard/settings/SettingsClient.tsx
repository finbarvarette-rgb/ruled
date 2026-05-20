"use client";

import { useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Spinner } from "@/components/Spinner";
import { useRouter } from "next/navigation";
import { dash } from "../theme";

const inputStyle = { ...dash.input };

export function SettingsClient({
  initialEmailNotifications,
}: {
  initialEmailNotifications: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [emailNotifications, setEmailNotifications] = useState(
    initialEmailNotifications
  );
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
        credentials: "include",
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
    <main className="px-4 sm:px-6 py-8 md:py-10">
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Settings
          </h1>
          <p className="text-sm" style={{ color: dash.mainMuted }}>
            Security and preferences.
          </p>
        </header>

        {/* Password */}
        <section className="rounded-2xl p-6 flex flex-col gap-4" style={{ ...dash.panel }}>
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
                      ? dash.mainMuted
                      : dash.errorText,
                }}
              >
                {passwordMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={passwordLoading}
              className="rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-2"
              style={dash.primaryBtn}
            >
              {passwordLoading && <Spinner />}
              {passwordLoading ? "Updating…" : "Change password"}
            </button>
          </form>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl p-6 flex flex-col gap-4" style={{ ...dash.panel }}>
          <h2 className="font-semibold text-sm">Notification preferences</h2>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-sm" style={{ color: dash.mainMuted }}>
                Case updates, product delivery, and tips.
              </p>
            </div>
            <button
              type="button"
              disabled={notifLoading}
              onClick={() => handleToggleNotifications(!emailNotifications)}
              className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold disabled:opacity-60 cursor-pointer"
              style={{
                background: emailNotifications ? dash.blue : dash.input.background,
                color: emailNotifications ? "#ffffff" : dash.mainText,
                border: emailNotifications ? `1px solid ${dash.blue}` : dash.chromeBorder,
              }}
            >
              {emailNotifications ? "On" : "Off"}
            </button>
          </div>
          {notifMessage && (
            <p
              className="text-sm"
              style={{ color: notifMessage === "Saved." ? dash.mainMuted : dash.errorText }}
            >
              {notifMessage}
            </p>
          )}
        </section>

        {/* Danger zone */}
        <section
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ ...dash.panel, ...dash.dangerPanel }}
        >
          <h2 className="font-semibold text-sm" style={{ color: dash.dangerText }}>
            Danger zone
          </h2>
          <p className="text-sm" style={{ color: dash.mainMuted }}>
            Permanently delete your account and all associated cases. This cannot
            be undone.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="self-start rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer"
            style={{
              background: "transparent",
              ...dash.dangerBtn,
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
            <div className="max-w-md w-full rounded-2xl p-6 flex flex-col gap-4" style={{ ...dash.panel }}>
              <h3 className="font-semibold">Are you sure?</h3>
              <p className="text-sm" style={{ color: dash.mainMuted }}>
                This will permanently delete all your cases and data. Type DELETE
                to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="rounded-lg px-4 py-3 text-sm outline-none"
                style={inputStyle}
              />
              {deleteError && (
                <p className="text-sm" style={{ color: dash.errorText }}>
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
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer"
                  style={{ border: dash.chromeBorder, color: dash.mainMuted }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDelete}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer"
                  style={{ background: dash.amber, color: "#ffffff" }}
                >
                  {deleteLoading ? "Deleting…" : "Delete forever"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

