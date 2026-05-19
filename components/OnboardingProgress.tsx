export function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <p className="text-xs font-medium tracking-wide" style={{ color: "#9a9590" }}>
      Step {step} of 3
    </p>
  );
}
