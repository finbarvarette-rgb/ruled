import { jsPDF } from "jspdf";
import JSZip from "jszip";

const NAVY = { r: 15, g: 23, b: 42 };
const BODY_COLOR = { r: 15, g: 23, b: 42 };
const MUTED = { r: 100, g: 116, b: 139 };

const FONT = "helvetica";
const MARGIN = 54;
const HEADER_HEIGHT = 40;
const FOOTER_HEIGHT = 32;
const BODY_FONT_SIZE = 11;
const LINE_HEIGHT = 16;
const PARA_GAP = 10;
const SECTION_GAP = 20;
const BULLET_INDENT = 20;
const BULLET_CHAR = "\u25CF"; // ●

const OLD_SECTION_HEADERS = [
  "CASE STRENGTH",
  "LEGAL BASIS",
  "KEY EVIDENCE IN YOUR FAVOUR",
  "WEAKNESSES",
  "WHAT THE OTHER SIDE WILL ARGUE",
  "RECOMMENDED NEXT STEP",
  "ESTIMATED CLAIM AMOUNT",
  "PROVINCE RULES",
];

const NEW_SECTION_HEADERS = [
  "Summary of Your Situation",
  "What Evidence You Have",
  "What the Other Side May Argue",
  "Strengths of Your Case",
  "Weaknesses / Risks to Consider",
  "Overall Conclusion",
];

export type PdfSection = { title: string; content: string };

type PdfBuildOptions = {
  documentTitle?: string;
  sections?: PdfSection[];
  body?: string;
};

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "\u2013",
  mdash: "\u2014",
  hellip: "\u2026",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
  bull: "\u2022",
  copy: "\u00A9",
  reg: "\u00AE",
  trade: "\u2122",
};

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

/** Decode HTML entities and normalize text before PDF layout. */
export function sanitizePdfText(text: string): string {
  if (!text) return "";

  let decoded = normalizeNewlines(text);

  for (let pass = 0; pass < 6; pass++) {
    const before = decoded;
    decoded = decoded
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
        const n = Number.parseInt(hex, 16);
        return Number.isFinite(n) && n > 0 && n <= 0x10ffff
          ? String.fromCodePoint(n)
          : "";
      })
      .replace(/&#(\d+);/g, (_, code) => {
        const n = Number.parseInt(code, 10);
        return Number.isFinite(n) && n > 0 && n <= 0x10ffff
          ? String.fromCodePoint(n)
          : "";
      })
      .replace(/&([a-z][a-z0-9]*);/gi, (entity, name) => {
        const key = name.toLowerCase();
        return NAMED_HTML_ENTITIES[key] ?? entity;
      })
      .replace(/&nbsp;/gi, " ")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&");
    if (decoded === before) break;
  }

  return decoded
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHashAndRuleLines(text: string): string {
  return sanitizePdfText(text)
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^[#\s]+$/.test(trimmed)) return false;
      if (/^[-*_]{3,}\s*$/.test(trimmed)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Checklist-style ALL CAPS headings (e.g. WHAT TO BRING). */
function isInlineHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 4 || t.length > 72) return false;
  if (!/^[A-Z0-9]/.test(t)) return false;
  const letters = t.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  const upperRatio =
    letters.replace(/[^A-Z]/g, "").length / letters.length;
  return upperRatio >= 0.85;
}

function parseBulletLine(line: string): string | null {
  const trimmed = line.trim();
  const checkbox = trimmed.match(/^[\s]*[☐☑□✓✔]\s*(.*)$/);
  if (checkbox) return checkbox[1].trim();

  const dash = trimmed.match(/^[\s]*[-•*]\s+(.+)$/);
  if (dash) return dash[1].trim();

  const amp = trimmed.match(/^[\s]*&\s+(.+)$/);
  if (amp) return amp[1].trim();

  const bareAmp = trimmed.match(/^[\s]*&([A-Za-z].*)$/);
  if (bareAmp) return bareAmp[1].trim();

  return null;
}

function findSectionContent(
  text: string,
  header: string,
  allHeaders: string[]
): string {
  const cleaned = stripHashAndRuleLines(text);
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:^|\\n)\\s*(?:#{1,6}\\s+)?(${escaped})\\s*(?:\\n|$)`,
    "i"
  );
  const match = cleaned.match(re);
  if (!match || match.index === undefined) return "";

  const contentStart = match.index + match[0].length;
  let contentEnd = cleaned.length;

  for (const other of allHeaders) {
    if (other.toUpperCase() === header.toUpperCase()) continue;
    const otherEscaped = other.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const otherRe = new RegExp(
      `(?:^|\\n)\\s*(?:#{1,6}\\s+)?(${otherEscaped})\\s*(?:\\n|$)`,
      "i"
    );
    const otherMatch = cleaned.slice(contentStart).match(otherRe);
    if (otherMatch && otherMatch.index !== undefined) {
      const end = contentStart + otherMatch.index;
      if (end < contentEnd) contentEnd = end;
    }
  }

  return cleaned.slice(contentStart, contentEnd).trim();
}

function extractCaseStrengthDetail(text: string): string {
  const block = findSectionContent(text, "CASE STRENGTH", OLD_SECTION_HEADERS);
  if (!block) return "";
  return block.replace(/^(Strong|Moderate|Weak)[.\s]*/i, "").trim();
}

function parseLegacySections(text: string) {
  return {
    caseStrength: findSectionContent(text, "CASE STRENGTH", OLD_SECTION_HEADERS),
    legalBasis: findSectionContent(text, "LEGAL BASIS", OLD_SECTION_HEADERS),
    evidence: findSectionContent(
      text,
      "KEY EVIDENCE IN YOUR FAVOUR",
      OLD_SECTION_HEADERS
    ),
    weaknesses: findSectionContent(text, "WEAKNESSES", OLD_SECTION_HEADERS),
    otherSide: findSectionContent(
      text,
      "WHAT THE OTHER SIDE WILL ARGUE",
      OLD_SECTION_HEADERS
    ),
    nextStep: findSectionContent(
      text,
      "RECOMMENDED NEXT STEP",
      OLD_SECTION_HEADERS
    ),
    claimAmount: findSectionContent(
      text,
      "ESTIMATED CLAIM AMOUNT",
      OLD_SECTION_HEADERS
    ),
    provinceRules: findSectionContent(text, "PROVINCE RULES", OLD_SECTION_HEADERS),
    strengthDetail: extractCaseStrengthDetail(text),
    newFormat: {
      summary: findSectionContent(
        text,
        "Summary of Your Situation",
        NEW_SECTION_HEADERS
      ),
      evidence: findSectionContent(
        text,
        "What Evidence You Have",
        NEW_SECTION_HEADERS
      ),
      otherSide: findSectionContent(
        text,
        "What the Other Side May Argue",
        NEW_SECTION_HEADERS
      ),
      strengths: findSectionContent(
        text,
        "Strengths of Your Case",
        NEW_SECTION_HEADERS
      ),
      weaknesses: findSectionContent(
        text,
        "Weaknesses / Risks to Consider",
        NEW_SECTION_HEADERS
      ),
      conclusion: findSectionContent(
        text,
        "Overall Conclusion",
        NEW_SECTION_HEADERS
      ),
    },
  };
}

export function buildAssessmentSections(
  assessment: string,
  intake: string,
  province: string
): PdfSection[] {
  const legacy = parseLegacySections(assessment);
  const hasNewFormat = Boolean(legacy.newFormat.summary);
  const applicableLawHeader = `Applicable Law in ${province || "Your Province"}`;

  if (hasNewFormat) {
    const applicableFromLegacy = [legacy.legalBasis, legacy.provinceRules]
      .filter(Boolean)
      .join("\n\n");
    return [
      { title: "Summary", content: legacy.newFormat.summary || intake },
      { title: "Evidence", content: legacy.newFormat.evidence || legacy.evidence },
      {
        title: "Other Side",
        content: legacy.newFormat.otherSide || legacy.otherSide,
      },
      { title: "Applicable Law", content: applicableFromLegacy },
      {
        title: "Strengths",
        content: legacy.newFormat.strengths || legacy.evidence,
      },
      {
        title: "Weaknesses",
        content: legacy.newFormat.weaknesses || legacy.weaknesses,
      },
      {
        title: "Conclusion",
        content:
          legacy.newFormat.conclusion ||
          [legacy.nextStep, legacy.claimAmount].filter(Boolean).join("\n\n"),
      },
    ].filter((s) => s.content.trim());
  }

  const summaryParts = [intake.trim(), legacy.strengthDetail || legacy.caseStrength].filter(
    Boolean
  );
  const applicableLaw = [legacy.legalBasis, legacy.provinceRules]
    .filter(Boolean)
    .join("\n\n");
  const conclusionParts = [legacy.strengthDetail, legacy.nextStep, legacy.claimAmount]
    .filter(Boolean)
    .join("\n\n");

  return [
    { title: "Summary", content: summaryParts.join("\n\n") },
    { title: "Evidence", content: legacy.evidence },
    { title: "Other Side", content: legacy.otherSide },
    { title: "Applicable Law", content: applicableLaw },
    { title: "Strengths", content: legacy.evidence || legacy.legalBasis },
    { title: "Weaknesses", content: legacy.weaknesses },
    { title: "Conclusion", content: conclusionParts },
  ].filter((s) => s.content.trim());
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function triggerBlobDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

class BrandedPdfBuilder {
  private doc: jsPDF;
  private y: number;
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private readonly contentWidth: number;
  private readonly bodyTop: number;
  private readonly bodyBottom: number;

  constructor() {
    this.doc = new jsPDF({ unit: "pt", format: "letter" });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - MARGIN * 2;
    this.bodyTop = HEADER_HEIGHT + 32;
    this.bodyBottom = this.pageHeight - FOOTER_HEIGHT - 20;
    this.y = this.bodyTop;
    this.drawPageChrome();
  }

  private drawHeader() {
    this.doc.setFillColor(NAVY.r, NAVY.g, NAVY.b);
    this.doc.rect(0, 0, this.pageWidth, HEADER_HEIGHT, "F");
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont(FONT, "bold");
    this.doc.setFontSize(14);
    this.doc.text("ruled.ca", MARGIN, 26);
    this.doc.setFont(FONT, "normal");
    this.doc.setFontSize(10);
    this.doc.text(formatDate(), this.pageWidth - MARGIN, 26, { align: "right" });
  }

  private drawFooter(pageNum: number, totalPages: number) {
    const footerY = this.pageHeight - 18;
    this.doc.setFont(FONT, "italic");
    this.doc.setFontSize(9);
    this.doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    this.doc.text(
      "Ruled.ca — Fight back. Get what you're owed.",
      this.pageWidth / 2,
      footerY,
      { align: "center" }
    );
    this.doc.setFont(FONT, "normal");
    this.doc.text(`Page ${pageNum} of ${totalPages}`, this.pageWidth - MARGIN, footerY, {
      align: "right",
    });
  }

  private setBodyStyle() {
    this.doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
    this.doc.setFont(FONT, "normal");
    this.doc.setFontSize(BODY_FONT_SIZE);
  }

  private drawPageChrome() {
    this.drawHeader();
    this.setBodyStyle();
  }

  private newPage() {
    this.doc.addPage();
    this.y = this.bodyTop;
    this.drawPageChrome();
  }

  private ensureSpace(height: number) {
    if (this.y + height > this.bodyBottom) {
      this.newPage();
    }
  }

  private renderWrappedLines(
    lines: string[],
    x: number,
    maxWidth: number,
    lineHeight = LINE_HEIGHT
  ) {
    const blockHeight = lines.length * lineHeight;
    this.ensureSpace(blockHeight);
    for (const line of lines) {
      this.doc.text(line, x, this.y, { maxWidth });
      this.y += lineHeight;
    }
  }

  addDocumentTitle(title: string) {
    this.ensureSpace(34);
    this.doc.setFont(FONT, "bold");
    this.doc.setFontSize(18);
    this.doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
    const lines = this.doc.splitTextToSize(title, this.contentWidth);
    this.renderWrappedLines(lines, MARGIN, this.contentWidth, 20);
    this.y += 6;
    this.setBodyStyle();
  }

  addSectionTitle(title: string) {
    this.ensureSpace(26);
    this.y += SECTION_GAP * 0.4;
    this.doc.setFont(FONT, "bold");
    this.doc.setFontSize(14);
    this.doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
    const lines = this.doc.splitTextToSize(title, this.contentWidth);
    this.renderWrappedLines(lines, MARGIN, this.contentWidth, 18);
    this.y += 4;
    this.setBodyStyle();
  }

  private addInlineHeading(text: string) {
    this.ensureSpace(22);
    this.y += 8;
    this.doc.setFont(FONT, "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
    const lines = this.doc.splitTextToSize(text, this.contentWidth);
    this.renderWrappedLines(lines, MARGIN, this.contentWidth, 17);
    this.y += 2;
    this.setBodyStyle();
  }

  private addBulletItem(text: string) {
    const bulletX = MARGIN;
    const textX = MARGIN + BULLET_INDENT;
    const textWidth = this.contentWidth - BULLET_INDENT;
    const bodyLines = this.doc.splitTextToSize(text, textWidth);
    const blockHeight = bodyLines.length * LINE_HEIGHT;
    this.ensureSpace(blockHeight);

    this.setBodyStyle();
    this.doc.setFont(FONT, "normal");
    this.doc.setFontSize(BODY_FONT_SIZE);
    this.doc.text(BULLET_CHAR, bulletX, this.y);

    for (let i = 0; i < bodyLines.length; i++) {
      this.doc.text(bodyLines[i], textX, this.y, { maxWidth: textWidth });
      this.y += LINE_HEIGHT;
    }
  }

  private addTextParagraph(text: string) {
    const lines = this.doc.splitTextToSize(text, this.contentWidth);
    this.setBodyStyle();
    this.renderWrappedLines(lines, MARGIN, this.contentWidth);
    this.y += PARA_GAP;
  }

  addParagraph(text: string, extraGap = 0) {
    const normalized = stripHashAndRuleLines(text);
    if (!normalized) return;

    const lines = normalized.split("\n");
    let textBuffer: string[] = [];

    const flushTextBuffer = () => {
      if (textBuffer.length === 0) return;
      const block = textBuffer.join(" ").replace(/\s+/g, " ").trim();
      textBuffer = [];
      if (block) this.addTextParagraph(block);
    };

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();

      if (!trimmed) {
        flushTextBuffer();
        this.y += 6 + extraGap * 0.25;
        continue;
      }

      const bulletText = parseBulletLine(rawLine);
      if (bulletText !== null) {
        flushTextBuffer();
        this.addBulletItem(bulletText);
        continue;
      }

      if (isInlineHeading(trimmed)) {
        flushTextBuffer();
        this.addInlineHeading(trimmed);
        continue;
      }

      textBuffer.push(trimmed);
    }

    flushTextBuffer();
    if (extraGap > 0) {
      this.y += extraGap;
    }
  }

  addBody(text: string) {
    this.addParagraph(text);
  }

  build(): Blob {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.drawFooter(i, totalPages);
    }
    return this.doc.output("blob");
  }
}

function buildPdfBlob(options: PdfBuildOptions): Blob {
  const builder = new BrandedPdfBuilder();
  if (options.documentTitle) {
    builder.addDocumentTitle(options.documentTitle);
  }
  if (options.sections?.length) {
    for (const section of options.sections) {
      builder.addSectionTitle(section.title);
      builder.addParagraph(section.content);
    }
  } else if (options.body) {
    builder.addBody(options.body);
  }
  return builder.build();
}

export function downloadBrandedPdf(
  filename: string,
  options: PdfBuildOptions
): void {
  const blob = buildPdfBlob(options);
  triggerBlobDownload(filename.endsWith(".pdf") ? filename : `${filename}.pdf`, blob);
}

export function downloadAssessmentPdf(params: {
  assessment: string;
  intake: string;
  province: string;
  filename?: string;
}): void {
  const sections = buildAssessmentSections(
    params.assessment,
    params.intake,
    params.province
  );
  downloadBrandedPdf(params.filename ?? "ruled-case-assessment.pdf", {
    documentTitle: "Case Assessment",
    sections,
  });
}

/** Legal letter layout with preserved line breaks and block spacing */
function isDateLine(line: string): boolean {
  return /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i.test(
    line.trim()
  );
}

function isReLine(line: string): boolean {
  return /^RE:\s/i.test(line.trim());
}

export function downloadDemandLetterPdf(
  letter: string,
  filename = "ruled-demand-letter.pdf"
): void {
  const builder = new BrandedPdfBuilder();
  builder.addDocumentTitle("Demand Letter");

  const lines = sanitizePdfText(letter).split("\n");
  let buffer: string[] = [];
  let blockIndex = 0;

  const flushBuffer = (gap: number) => {
    if (buffer.length === 0) return;
    const text = buffer.join("\n");
    const joined = buffer.join(" ");
    if (isReLine(joined)) {
      builder.addSectionTitle(text.trim());
    } else if (isDateLine(text)) {
      builder.addParagraph(text, 12);
    } else if (blockIndex === 0) {
      builder.addParagraph(text, 6);
    } else {
      builder.addParagraph(text, gap);
    }
    buffer = [];
    blockIndex += 1;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      const gap =
        blockIndex < 2 ? 6 : blockIndex < 4 ? 10 : i > lines.length - 8 ? 8 : 12;
      flushBuffer(gap);
      continue;
    }
    buffer.push(line);
  }
  flushBuffer(0);

  const blob = builder.build();
  triggerBlobDownload(filename, blob);
}

export type PdfZipEntry = PdfBuildOptions & { filename: string };

export async function downloadPdfZip(files: PdfZipEntry[]): Promise<void> {
  const zip = new JSZip();
  for (const file of files) {
    const { filename, ...opts } = file;
    const blob = buildPdfBlob(opts);
    zip.file(filename.endsWith(".pdf") ? filename : `${filename}.pdf`, blob);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  triggerBlobDownload("ruled-full-case-pack.zip", zipBlob);
}
