/**
 * Dashboard main column only — dark sidebar keeps its own inline styles.
 * Do not import from marketing routes.
 */
export const dash = {
  blue: "#2563EB",
  amber: "#F59E0B",
  navy: "#0F172A",
  mainBg: "#FAFAFA",
  mainText: "#0F172A",
  /** Secondary copy on light panels */
  mainMuted: "#64748B",
  panel: {
    background: "#ffffff",
    border: "1px solid #E2E8F0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  },
  nested: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
  },
  topBar: {
    background: "#ffffff",
    borderBottom: "1px solid #E2E8F0",
  },
  input: {
    background: "#ffffff",
    color: "#0F172A",
    border: "1px solid #E2E8F0",
  },
  chromeBorder: "1px solid #E2E8F0",
  rowDivider: "#E2E8F0",
  /** Inactive pipeline / UI chrome on light cards */
  trackMuted: "#CBD5E1",
  /** Primary CTA buttons */
  primaryBtn: {
    background: "#2563EB",
    color: "#ffffff",
  },
  /** Status badges (replaces former red badge styling) */
  statusBadge: {
    background: "rgba(245, 158, 11, 0.12)",
    color: "#B45309",
    border: "1px solid rgba(245, 158, 11, 0.35)",
  },
  /** Accent highlight blocks (next step, etc.) */
  accentPanel: {
    border: "1px solid rgba(37, 99, 235, 0.35)",
  },
  accentLabel: {
    color: "#2563EB",
  },
  /** Form / inline errors (was red) */
  errorText: "#B45309",
  /** Danger zone panel */
  dangerPanel: {
    border: "1px solid #F59E0B",
  },
  dangerText: "#B45309",
  dangerBtn: {
    color: "#B45309",
    border: "1px solid #F59E0B",
  },
  pipelineActive: "#2563EB",
  pipelineActiveGlow: "0 0 0 4px rgba(37, 99, 235, 0.25)",
  pipelineConnector: "rgba(37, 99, 235, 0.5)",
} as const;
