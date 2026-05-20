import Link from "next/link";

const TIERS = [
  {
    name: "Free",
    subtitle: "Case Assessment",
    price: "Free",
    popular: false,
    trustLine: "No account required to start",
    features: [
      "AI analysis of your case strength",
      "Evidence checklist",
      "Recommended next step",
      "Province-specific filing information",
    ],
    cta: "Start Free Assessment",
    href: "/onboarding",
  },
  {
    name: "$49",
    subtitle: "Demand Letter",
    price: "$49",
    popular: false,
    trustLine: "Delivered in minutes after payment",
    features: [
      "Everything in Free",
      "Professional demand letter drafted to your case",
      "14-day payment demand with legal language",
      "Ready to send within minutes",
      "Resolves 40% of cases before court",
    ],
    cta: "Start Free — Upgrade After →",
    href: "/onboarding",
  },
  {
    name: "$199",
    subtitle: "Full Case Pack",
    price: "$199",
    popular: true,
    trustLine: "Everything you need to walk into court ready",
    features: [
      "Everything in Demand Letter",
      "Province-specific court filing documents",
      "Step-by-step filing instructions",
      "Complete hearing preparation script",
      "Word-for-word opening and closing statements",
      "Anticipated defence arguments and rebuttals",
      "Unlimited AI Q&A about your case",
      "Download all documents",
    ],
    cta: "Start Free — Upgrade After →",
    href: "/onboarding",
  },
] as const;

export function PricingComparison() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {TIERS.map((tier) => (
        <TierCard key={tier.subtitle} tier={tier} />
      ))}
    </div>
  );
}

function TierCard({
  tier,
}: {
  tier: (typeof TIERS)[number];
}) {
  const isPopular = tier.popular;

  return (
    <div
      className="relative rounded-xl p-6 flex flex-col gap-5"
      style={{
        background: isPopular ? "#c8392b" : "#1a1916",
        border: isPopular ? "2px solid #c8392b" : "1px solid #2a2825",
        color: isPopular ? "#f5f1eb" : undefined,
      }}
    >
      {isPopular && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: "#0f0e0c", color: "#f5f1eb" }}
        >
          Most Popular
        </span>
      )}
      <div>
        <p className="text-2xl font-bold">{tier.price}</p>
        <h3 className="text-lg font-semibold mt-1">{tier.subtitle}</h3>
        <p
          className="text-xs mt-2 leading-relaxed"
          style={{ color: isPopular ? "rgba(245,241,235,0.85)" : "#9a9590" }}
        >
          {tier.trustLine}
        </p>
      </div>
      <ul className="flex flex-col gap-2 flex-1 text-sm">
        {tier.features.map((feature) => (
          <li key={feature} className="flex gap-2 leading-relaxed">
            <span style={{ color: isPopular ? "#f5f1eb" : "#c8392b" }}>—</span>
            <span style={{ color: isPopular ? "rgba(245,241,235,0.9)" : "#9a9590" }}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={tier.href}
        className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-center"
        style={{
          background: "#f5f1eb",
          color: "#0f0e0c",
        }}
      >
        {tier.cta}
      </Link>
    </div>
  );
}
