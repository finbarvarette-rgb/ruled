import { jsPDF } from "jspdf";
import JSZip from "jszip";

const NAVY = { r: 15, g: 23, b: 42 };
const BODY_COLOR = { r: 15, g: 23, b: 42 };
const MUTED = { r: 100, g: 116, b: 139 };

const MARGIN = 54;
const HEADER_HEIGHT = 40;
const FOOTER_HEIGHT = 32;
const LINE_HEIGHT = 14;
const SECTION_GAP = 18;
const TITLE_GAP = 10;

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

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

/** Decode HTML entities and normalize text before PDF layout. */
export function sanitizePdfText(text: string): string {
  if (!text) return "";

  let decoded = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number.parseInt(code, 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const n = Number.parseInt(hex, 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : "";
    });

  for (let i = 0; i < 3; i++) {
    const next = decoded.replace(/&amp;/g, "&");
    if (next === decoded) break;
    decoded = next;
  }

  return normalizeNewlines(decoded)
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[ \t]+\n/g, "\n")
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
    this.bodyTop = HEADER_HEIGHT + 28;
    this.bodyBottom = this.pageHeight - FOOTER_HEIGHT - 16;
    this.y = this.bodyTop;
    this.drawPageChrome();
  }

  private drawHeader() {
    this.doc.setFillColor(NAVY.r, NAVY.g, NAVY.b);
    this.doc.rect(0, 0, this.pageWidth, HEADER_HEIGHT, "F");
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont("times", "bold");
    this.doc.setFontSize(14);
    this.doc.text("ruled.ca", MARGIN, 26);
    this.doc.setFont("times", "normal");
    this.doc.setFontSize(10);
    this.doc.text(formatDate(), this.pageWidth - MARGIN, 26, { align: "right" });
  }

  private drawFooter(pageNum: number, totalPages: number) {
    const footerY = this.pageHeight - 18;
    this.doc.setFont("times", "italic");
    this.doc.setFontSize(9);
    this.doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    this.doc.text(
      "Ruled.ca — Fight back. Get what you're owed.",
      this.pageWidth / 2,
      footerY,
      { align: "center" }
    );
    this.doc.setFont("times", "normal");
    this.doc.text(`Page ${pageNum} of ${totalPages}`, this.pageWidth - MARGIN, footerY, {
      align: "right",
    });
  }

  private drawPageChrome() {
    this.drawHeader();
    this.doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
    this.doc.setFont("times", "normal");
    this.doc.setFontSize(11);
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

  addDocumentTitle(title: string) {
    this.ensureSpace(28);
    this.doc.setFont("times", "bold");
    this.doc.setFontSize(18);
    this.doc.text(title, MARGIN, this.y);
    this.y += 28;
    this.doc.setFont("times", "normal");
    this.doc.setFontSize(11);
  }

  addSectionTitle(title: string) {
    this.ensureSpace(22);
    this.y += SECTION_GAP * 0.5;
    this.doc.setFont("times", "bold");
    this.doc.setFontSize(13);
    this.doc.text(title, MARGIN, this.y);
    this.y += TITLE_GAP + 4;
    this.doc.setFont("times", "normal");
    this.doc.setFontSize(11);
  }

  addParagraph(text: string, extraGap = 0) {
    const normalized = stripHashAndRuleLines(text);
    if (!normalized) return;

    const paragraphs = normalized.split(/\n\n+/);
    for (const para of paragraphs) {
      const lines = this.doc.splitTextToSize(para.trim(), this.contentWidth);
      const blockHeight = lines.length * LINE_HEIGHT + extraGap;
      this.ensureSpace(blockHeight);
      for (const line of lines) {
        this.doc.text(line, MARGIN, this.y);
        this.y += LINE_HEIGHT;
      }
      this.y += 8 + extraGap;
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
      builder.addParagraph(text, 14);
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
