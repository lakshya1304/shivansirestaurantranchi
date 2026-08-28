import { BrevoClient } from "@getbrevo/brevo";
import env from "../config/envConfig";

export const brevoConfigured = !!env.BREVO_API_KEY;

export const brevoClient = brevoConfigured
  ? new BrevoClient({ apiKey: env.BREVO_API_KEY as string })
  : null;

export async function sendViaBrevo(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  if (!brevoConfigured || !brevoClient) {
    throw new Error("Brevo is not configured. Missing BREVO_API_KEY.");
  }

  // Extract sender details, default to BUSINESS_NAME and SMTP_USER/ADMIN_EMAIL if possible.
  // Brevo requires a valid email format for sender.
  const senderName = env.BUSINESS_NAME || "MaaTaraSweets";
  let senderEmail = env.SMTP_USER || env.GMAIL_USER || env.ADMIN_EMAIL;

  if (!senderEmail) {
    // Attempt to extract from SMTP_FROM if it looks like "Name <email>"
    const emailMatch = env.SMTP_FROM?.match(/<([^>]+)>/);
    if (emailMatch) {
      senderEmail = emailMatch[1];
    } else {
      senderEmail = "no-reply@maatarasweets.com"; // Fallback to a default format to prevent errors
    }
  }

  await brevoClient.transactionalEmails.sendTransacEmail({
    subject,
    htmlContent: html,
    textContent: text,
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
  });
}
