import { prismaAdmin } from "../config/databaseConfig";
import logger from "../config/loggerConfig";

async function loadCredentials(): Promise<{
  token: string;
  phoneNumberId: string;
} | null> {
  try {
    const config = await prismaAdmin.appConfig.findFirst({
      select: { whatsapp_token: true, whatsapp_phone_number_id: true },
    });
    if (config?.whatsapp_token && config.whatsapp_phone_number_id) {
      return {
        token: config.whatsapp_token,
        phoneNumberId: config.whatsapp_phone_number_id,
      };
    }
  } catch (error) {
    logger.error(`[whatsapp] config read failed: ${error}`);
  }
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return token && phoneNumberId ? { token, phoneNumberId } : null;
}

export async function sendWhatsAppMessage(
  rawPhone: string,
  message: string,
): Promise<boolean> {
  const creds = await loadCredentials();
  if (!creds) return false;

  const digits = rawPhone.replace(/[^0-9]/g, "");
  if (digits.length < 8) return false;
  const to = digits.length === 10 ? `91${digits}` : digits;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${creds.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      },
    );
    if (!res.ok) {
      logger.error(`[whatsapp] send failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (error) {
    logger.error(`[whatsapp] send error: ${error}`);
    return false;
  }
}
