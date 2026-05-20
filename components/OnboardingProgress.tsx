import { m } from "@/lib/marketing-theme";

export function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <p className="text-xs font-medium tracking-wide" style={{ color: m.muted }}>
      Step {step} of 3
    </p>
  );
}
