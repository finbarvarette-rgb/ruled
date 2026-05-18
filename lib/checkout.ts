export type CheckoutTier = "demand" | "full";

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem("ruled_assessment");
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data.email ?? null;
  } catch {
    return null;
  }
}

export async function startCheckout(
  tier: CheckoutTier,
  caseId: string | null,
  email?: string | null
): Promise<void> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tier,
      caseId,
      email: email ?? getStoredEmail(),
    }),
  });

  if (!res.ok) {
    throw new Error("Checkout failed");
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) {
    throw new Error("No checkout URL returned");
  }

  window.location.href = data.url;
}
