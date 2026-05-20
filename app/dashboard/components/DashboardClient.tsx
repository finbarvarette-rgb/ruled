"use client";

import Link from "next/link";
import type { Case } from "@/lib/supabase";
import { DashboardNav } from "@/components/DashboardNav";
import { CaseCard } from "./CaseCard";
import { EmptyState } from "./EmptyState";
import { getCaseMeta, generateCaseTitle } from "../case-utils";
import { downloadTextFile } from "./dashboard-session";
import { dash } from "../theme";

export function DashboardClient({
  cases,
  userEmail,
}: {
  cases: Case[];
  userEmail: string;
}) {
  const hasCases = cases.length > 0;

  const allDocuments = cases.flatMap((caseRecord) => {
    const meta = getCaseMeta(caseRecord);
    const title = generateCaseTitle(caseRecord);
    return meta.documents
      .filter((d) => d.available && d.content?.trim())
      .map((d) => ({
        key: `${caseRecord.id}-${d.id}`,
        caseTitle: title,
        docTitle: d.title,
        content: d.content!,
        filename: `ruled-${d.id}-${caseRecord.id.slice(0, 8)}.txt`,
      }));
  });

  return (
    <main className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16">
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-10">
        <DashboardNav active="dashboard" />

        <header className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Your cases
          </h1>
          <p className="text-sm" style={{ color: dash.mainMuted }}>
            Welcome back, {userEmail}
          </p>
        </header>

        {!hasCases ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex flex-col gap-8">
              {cases.map((caseRecord) => (
                <CaseCard key={caseRecord.id} caseRecord={caseRecord} />
              ))}
            </div>

            {allDocuments.length > 0 && (
              <section className="rounded-xl p-6 md:p-8 flex flex-col gap-5" style={{ ...dash.panel }}>
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">My documents</h2>
                  <p className="text-sm" style={{ color: dash.mainMuted }}>
                    All documents from your cases — download anytime.
                  </p>
                </div>
                <ul className="flex flex-col gap-2">
                  {allDocuments.map((doc) => (
                    <li
                      key={doc.key}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg px-4 py-3"
                      style={{ ...dash.nested }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{doc.docTitle}</p>
                        <p
                          className="text-xs truncate"
                          style={{ color: dash.mainMuted }}
                        >
                          {doc.caseTitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          downloadTextFile(doc.filename, doc.content)
                        }
                        className="text-xs font-semibold rounded-md px-3 py-1.5 cursor-pointer shrink-0"
                        style={dash.primaryBtn}
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <Link
          href="/onboarding"
          className="text-sm w-fit"
          style={{ color: dash.blue }}
        >
          &larr; New assessment
        </Link>
      </div>
    </main>
  );
}
