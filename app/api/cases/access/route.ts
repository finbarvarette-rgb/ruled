import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

const LOG = "[api/cases/access]";

function jsonResponse(
  body: Record<string, unknown>,
  status: number
): NextResponse {
  return NextResponse.json(body, { status, headers: JSON_HEADERS });
}

/** Same filter as dashboard/documents page */
function userCasesOrFilter(user: { id: string; email?: string | null }): string {
  return user.email
    ? `user_id.eq.${user.id},email.eq.${user.email}`
    : `user_id.eq.${user.id}`;
}

/** Link orphan cases by email — same as dashboard/documents page */
async function syncUserCases(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined
) {
  if (!email) return;

  const linkRes = await supabase
    .from("cases")
    .update({ user_id: userId })
    .eq("email", email)
    .is("user_id", null);

  const fillRes = await supabase
    .from("cases")
    .update({ email })
    .eq("user_id", userId)
    .is("email", null);

  console.log(`${LOG} syncUserCases updates`, {
    linkError: linkRes.error?.message ?? null,
    fillError: fillRes.error?.message ?? null,
  });
}

function parseCaseId(req: NextRequest): string | null {
  const raw =
    req.nextUrl.searchParams.get("caseId") ??
    req.nextUrl.searchParams.get("id");
  if (!raw) return null;
  const caseId = decodeURIComponent(raw).trim();
  return UUID_RE.test(caseId) ? caseId : null;
}

type CaseRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  paid: boolean | null;
  tier_purchased: string | null;
  case_assessment: string;
  intake_text: string;
  province: string;
  demand_letter?: string | null;
  court_docs?: string | null;
  hearing_prep?: string | null;
};

export async function GET(req: NextRequest) {
  const caseId = parseCaseId(req);

  console.log(`${LOG} GET`, {
    pathname: req.nextUrl.pathname,
    search: req.nextUrl.search,
    caseId: caseId ?? "(invalid or missing)",
  });

  try {
    if (!caseId) {
      console.log(`${LOG} rejected: invalid caseId param`);
      return jsonResponse({ error: "Invalid or missing caseId query parameter" }, 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log(`${LOG} auth`, {
      userId: user?.id ?? null,
      email: user?.email ?? null,
      authError: authError?.message ?? null,
    });

    if (!user) {
      return jsonResponse({ error: "Sign in required" }, 401);
    }

    await syncUserCases(supabase, user.id, user.email ?? undefined);

    const orFilter = userCasesOrFilter(user);
    console.log(`${LOG} query`, { caseId, orFilter });

    // select(*) matches dashboard/documents — avoids failing on optional columns
    // (e.g. court_docs) when migrations have not been applied yet
    const { data: caseRow, error, status, statusText } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .or(orFilter)
      .maybeSingle();

    console.log(`${LOG} supabase result`, {
      status,
      statusText,
      error: error
        ? { message: error.message, code: error.code, details: error.details }
        : null,
      found: !!caseRow,
      row: caseRow
        ? {
            id: caseRow.id,
            user_id: caseRow.user_id,
            email: caseRow.email,
            paid: caseRow.paid,
            tier_purchased: caseRow.tier_purchased,
            hasAssessment: !!caseRow.case_assessment?.trim(),
            hasDemandLetter: !!caseRow.demand_letter?.trim(),
            hasCourtDocs: !!(caseRow as CaseRow).court_docs?.trim(),
            hasHearingPrep: !!(caseRow as CaseRow).hearing_prep?.trim(),
          }
        : null,
    });

    if (error) {
      return jsonResponse({ error: "Failed to load case" }, 500);
    }

    if (!caseRow) {
      const { data: dashboardCases } = await supabase
        .from("cases")
        .select("id")
        .or(orFilter);

      console.log(`${LOG} case not found for user`, {
        requestedCaseId: caseId,
        userVisibleCaseIds: (dashboardCases ?? []).map((c) => c.id),
        idInUserList: (dashboardCases ?? []).some((c) => c.id === caseId),
      });

      return jsonResponse({ error: "Case not found" }, 404);
    }

    const row = caseRow as CaseRow;

    if (!row.paid) {
      console.log(`${LOG} denied: not paid`, { caseId: row.id });
      return jsonResponse(
        { error: "Purchase required to access documents" },
        403
      );
    }

    const tier = row.tier_purchased ?? "demand";
    if (tier !== "demand" && tier !== "full") {
      console.log(`${LOG} denied: invalid tier`, { tier });
      return jsonResponse({ error: "Invalid purchase tier" }, 403);
    }

    console.log(`${LOG} success`, { caseId: row.id, tier });

    return jsonResponse(
      {
        tier,
        caseId: row.id,
        assessment: row.case_assessment,
        intake: row.intake_text,
        province: row.province,
        email: row.email,
        demandLetter: row.demand_letter ?? null,
        courtDocs: row.court_docs ?? null,
        hearingPrep: row.hearing_prep ?? null,
      },
      200
    );
  } catch (err) {
    console.error(`${LOG} unhandled error`, err);
    return jsonResponse({ error: "Failed to load case" }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { caseId?: string };
    const raw = body.caseId?.trim();
    if (!raw || !UUID_RE.test(raw)) {
      return jsonResponse({ error: "Invalid or missing caseId" }, 400);
    }
    const url = new URL(req.url);
    url.searchParams.set("caseId", raw);
    return GET(new NextRequest(url, { method: "GET", headers: req.headers }));
  } catch (err) {
    console.error(`${LOG} POST error`, err);
    return jsonResponse({ error: "Failed to load case" }, 500);
  }
}
