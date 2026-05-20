/** Shared brand tokens for marketing / funnel pages (not dashboard). */
export const m = {
  bg: "#FAFAFA",
  text: "#0F172A",
  subtext: "#4B5563",
  muted: "#64748B",
  border: "#E2E8F0",
  surface: "#F1F5F9",
  blue: "#2563EB",
  amber: "#F59E0B",
  green: "#10B981",
  white: "#FFFFFF",
} as const;

export const marketingCard = {
  background: m.white,
  border: `1px solid ${m.border}`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
} as const;

export const marketingInput = {
  background: m.white,
  color: m.text,
  border: `1px solid ${m.border}`,
} as const;

export const marketingBtnPrimary = {
  background: m.blue,
  color: m.white,
} as const;

export const marketingBtnSecondary = {
  background: m.white,
  color: m.blue,
  border: `2px solid ${m.blue}`,
} as const;

export const marketingPageMain = {
  background: m.bg,
  color: m.text,
} as const;

export function ruledLogoSuffixStyle() {
  return { color: m.blue };
}

export function marketingLinkStyle() {
  return { color: m.blue };
}

export type MarketingStrength = "Strong" | "Moderate" | "Weak";

export function marketingStrengthBadgeStyle(strength: MarketingStrength): {
  background: string;
  color: string;
} {
  switch (strength) {
    case "Strong":
      return { background: "rgba(16, 185, 129, 0.15)", color: m.green };
    case "Moderate":
      return { background: "rgba(245, 158, 11, 0.15)", color: m.amber };
    case "Weak":
      return { background: "rgba(37, 99, 235, 0.12)", color: m.blue };
  }
}
