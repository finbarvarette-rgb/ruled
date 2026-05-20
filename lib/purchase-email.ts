import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getAppUrl,
  sendPurchaseConfirmationEmail,
} from "@/lib/email-service";

const PRODUCT_NAMES: Record<string, string> = {
  demand: "Demand Letter",
  full: "Full Case Pack",
};

export async function maybeSendPurchaseConfirmationEmail(options: {
  caseId: string;
  tier: string;
  email: string | null | undefined;
  amountPaidCents: number | null;
}): Promise<void> {
  const to = options.email?.trim();
  if (!to) return;

  const tier = options.tier === "full" ? "full" : "demand";
  const admin = getSupabaseAdmin();

  const { data: caseRow } = await admin
    .from("cases")
    .select("purchase_confirmation_email_sent_at")
    .eq("id", options.caseId)
    .single();

  if (caseRow?.purchase_confirmation_email_sent_at) return;

  const productName = PRODUCT_NAMES[tier] ?? "Ruled purchase";
  const sent = await sendPurchaseConfirmationEmail({
    to,
    productName,
    amountCents: options.amountPaidCents,
    caseId: options.caseId,
    tier,
  });

  if (!sent) return;

  await admin
    .from("cases")
    .update({
      purchase_confirmation_email_sent_at: new Date().toISOString(),
    })
    .eq("id", options.caseId);
}

export function dashboardDocumentsUrl(): string {
  return `${getAppUrl()}/dashboard/documents`;
}
