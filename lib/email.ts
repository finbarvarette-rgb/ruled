/**
 * @deprecated Import from `@/lib/email-service` for new code.
 * Re-exports preserve existing import paths.
 */
export {
  formatAssessmentPlainText as formatAssessmentEmailBody,
  sendCaseAssessmentDeliveryEmail as sendAssessmentEmail,
  sendContactFormEmail,
  sendDemandLetterDeliveryEmail,
  sendFullCasePackDeliveryEmail,
} from "@/lib/email-service";

/** @deprecated Use tier-specific delivery emails from email-service */
export async function sendPaymentConfirmationEmail(
  to: string,
  tier: string
): Promise<boolean> {
  const { sendDemandLetterDeliveryEmail, sendFullCasePackDeliveryEmail } =
    await import("@/lib/email-service");
  if (tier === "full") {
    return sendFullCasePackDeliveryEmail(to);
  }
  return sendDemandLetterDeliveryEmail(to);
}
