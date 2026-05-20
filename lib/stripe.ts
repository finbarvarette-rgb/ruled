import Stripe from "stripe";

let stripe: Stripe | null = null;

function resolveStripeSecretKey(): string {
  const testKey = process.env.STRIPE_SECRET_KEY_TEST?.trim();
  const liveKey = process.env.STRIPE_SECRET_KEY?.trim();
  const stripeMode = process.env.STRIPE_USE_TEST?.trim().toLowerCase();
  const useTest =
    stripeMode === "true" ||
    (stripeMode !== "false" &&
      process.env.NODE_ENV === "development" &&
      !!testKey);

  const key = useTest ? testKey : liveKey;
  if (!key) {
    throw new Error(
      useTest
        ? "Missing STRIPE_SECRET_KEY_TEST"
        : "Missing STRIPE_SECRET_KEY"
    );
  }
  return key;
}

export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(resolveStripeSecretKey());
  }
  return stripe;
}
