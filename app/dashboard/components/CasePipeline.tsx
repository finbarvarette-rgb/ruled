import { PIPELINE_STEPS } from "../case-utils";

export function CasePipeline({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "#9a9590" }}
      >
        Case progress
      </p>
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <ol className="flex items-start min-w-[32rem] gap-0">
          {PIPELINE_STEPS.map((step, i) => {
            const isComplete = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isLast = i === PIPELINE_STEPS.length - 1;

            return (
              <li
                key={step.id}
                className="flex flex-1 flex-col items-center min-w-0"
                aria-current={isCurrent ? "step" : undefined}
              >
                <div className="flex items-center w-full">
                  <div className="flex flex-col items-center shrink-0 w-full">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 z-10"
                      style={{
                        background:
                          isComplete || isCurrent ? "#c8392b" : "#2a2825",
                        boxShadow: isCurrent
                          ? "0 0 0 4px rgba(200, 57, 43, 0.25)"
                          : undefined,
                      }}
                    />
                  </div>
                  {!isLast && (
                    <div
                      className="h-0.5 flex-1 -mt-1.5 min-w-[0.5rem]"
                      style={{
                        background: isComplete ? "#c8392b" : "#2a2825",
                      }}
                      aria-hidden
                    />
                  )}
                </div>
                <span
                  className="text-[10px] sm:text-xs leading-snug text-center mt-2 px-1 w-full"
                  style={{
                    color: isCurrent
                      ? "#f5f1eb"
                      : isComplete
                        ? "#d4cfc9"
                        : "#6b6560",
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
