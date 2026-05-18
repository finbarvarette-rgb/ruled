export type CheckoutTier = "demand" | "full";

export async function startCheckout(
  tier: CheckoutTier,
  caseId: string | null
): Promise<void> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, caseId }),
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
