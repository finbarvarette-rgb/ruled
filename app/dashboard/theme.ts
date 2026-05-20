/**
 * Dashboard main column only — dark sidebar keeps its own inline styles.
 * Do not import from marketing routes.
 */
export const dash = {
  mainBg: "#f8f7f4",
  mainText: "#1a1916",
  /** Secondary copy (still dark, readable on light panels) */
  mainMuted: "#534f4a",
  panel: {
    background: "#ffffff",
    border: "1px solid #e8e6e1",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
  },
  /** Slightly tinted surface inside white cards */
  nested: {
    background: "#f8f7f4",
    border: "1px solid #e8e6e1",
  },
  topBar: {
    background: "#ffffff",
    borderBottom: "1px solid #e8e6e1",
  },
  input: {
    background: "#ffffff",
    color: "#1a1916",
    border: "1px solid #e0ddd6",
  },
  chromeBorder: "1px solid #e0ddd6",
  rowDivider: "#e8e6e1",
  /** Inactive pipeline / UI chrome on light cards */
  trackMuted: "#d4cfc9",
} as const;
