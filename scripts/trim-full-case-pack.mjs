import fs from "fs";
import path from "path";

const pagePath = path.join(
  import.meta.dirname,
  "../app/success/full-case-pack/page.tsx"
);
const lines = fs.readFileSync(pagePath, "utf8").split(/\r?\n/);

const importBlock = `import {
  buildDayOfCourtChecklist,
  buildHowToFileText,
  getProvinceFiling,
  inferClaimantName,
} from "@/lib/case-pack";
import { downloadBrandedPdf } from "@/lib/pdf-generator";`;

let out = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  if (line.startsWith('import { restoreSessionFromPayment')) {
    out.push(line);
    out.push(importBlock);
    i++;
    continue;
  }
  if (line.startsWith('import { supabase }')) {
    i++;
    continue;
  }
  if (line.startsWith('import { downloadBrandedPdf')) {
    i++;
    continue;
  }
  if (line === 'type TabId = "file" | "documents" | "hearing" | "checklist";') {
    while (i < lines.length && !lines[i].startsWith('const PREVIEW_DEMAND_LETTER')) {
      i++;
    }
    continue;
  }
  if (lines[i].startsWith('function getProvinceFiling')) {
    while (i < lines.length && !lines[i].startsWith('async function generateDemandLetter')) {
      i++;
    }
    continue;
  }
  if (lines[i].startsWith('function buildDayOfCourtChecklist')) {
    while (i < lines.length && !lines[i].startsWith('function buildDocuments')) {
      i++;
    }
    continue;
  }
  if (lines[i].startsWith('function buildDocuments')) {
    while (i < lines.length && !lines[i].startsWith('function downloadPdf')) {
      i++;
    }
    continue;
  }
  if (lines[i].startsWith('async function downloadAllPdf')) {
    while (i < lines.length && !lines[i].startsWith('function parseHearingSections')) {
      i++;
    }
    continue;
  }
  out.push(line);
  i++;
}

fs.writeFileSync(pagePath, out.join("\n"));
console.log("Trimmed", pagePath);
