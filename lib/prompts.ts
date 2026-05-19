export const FORMATTING_RULE = `CRITICAL FORMATTING RULE: Output plain text only. Never use asterisks, hashes, pound signs, or any markdown formatting. No bold, no italic, no headers with # symbols. Write every section in clean plain prose and bullet points using only a dash and space (- ) for list items. Never start a line with * or # or ## or ###.

`;

/**
 * Strip residual markdown artifacts from Claude output.
 * Removes bold/italic markers, ATX headings, horizontal rules,
 * and collapses excess blank lines.
 */
export function sanitizeText(text: string): string {
  return text
    // Remove bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    // Remove ATX heading markers (## Heading → Heading)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Normalize bullet points to "- " style
    .replace(/^[\s]*[•*]\s+/gm, "- ")
    // Collapse 3+ blank lines to 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
