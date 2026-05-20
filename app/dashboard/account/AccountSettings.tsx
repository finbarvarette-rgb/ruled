"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export function AccountSettings({ email: initialEmail }: { email: string }) {
  const router = useRouter();
  const [email] = useState(initialEmail);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    setEmailMessage("");
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
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

      <section
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ background: "#1a1916", border: "1px solid #2a2825" }}
      >
        <h2 className="font-semibold text-sm">Email address</h2>
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

      <section
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ background: "#1a1916", border: "1px solid #c8392b" }}
      >
        <h2 className="font-semibold text-sm" style={{ color: "#c8392b" }}>
          Delete account
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
