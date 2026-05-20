"use client";

import { useMemo } from "react";
import type { Case } from "@/lib/supabase";
import { generateCaseTitle, getCaseMeta } from "../case-utils";

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DocumentsClient({ cases }: { cases: Case[] }) {
  const grouped = useMemo(() => {
    return cases
      .map((c) => {
        const meta = getCaseMeta(c);
        const docs = meta.documents.filter((d) => d.available && d.content?.trim());
        return { caseRecord: c, title: generateCaseTitle(c), docs };
      })
      .filter((g) => g.docs.length > 0);
  }, [cases]);

  return (
    <main className="px-4 sm:px-6 py-8 md:py-10">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm" style={{ color: "#9a9590" }}>
            Download your purchased documents across all cases.
          </p>
        </header>

        {grouped.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-sm"
            style={{ background: "#0f0e0c", border: "1px solid #1f1d19", color: "#9a9590" }}
          >
            No documents yet. Complete an assessment and upgrade to generate your documents.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map((g) => (
              <section
                key={g.caseRecord.id}
                className="rounded-2xl p-6 md:p-8 flex flex-col gap-4"
                style={{ background: "#0f0e0c", border: "1px solid #1f1d19" }}
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-semibold">{g.title}</h2>
                  <p className="text-xs" style={{ color: "#9a9590" }}>
                    Created{" "}
                    {new Date(g.caseRecord.created_at).toLocaleDateString("en-CA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <ul className="flex flex-col gap-2">
                  {g.docs.map((doc) => (
                    <li
                      key={doc.id}
                      className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      style={{ background: "#0b0a08", border: "1px solid #1f1d19" }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{doc.title}</p>
                        <p className="text-xs truncate" style={{ color: "#9a9590" }}>
                          {g.title}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadTextFile(`ruled-${doc.id}-${g.caseRecord.id.slice(0, 8)}.txt`, doc.content!)}
                        className="rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer shrink-0"
                        style={{ background: "#c8392b", color: "#f5f1eb" }}
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

