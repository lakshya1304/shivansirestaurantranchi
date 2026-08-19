/**
 * Sends WhatsApp updates through the official WhatsApp Cloud API business
 * sender (a verified bot sender, not a personal number).
 * Silently no-ops until WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID are configured.
 */
export async function sendWhatsAppMessage(rawPhone: string, message: string): Promise<boolean> {
  const token = process.env['WHATSAPP_TOKEN'];
  const phoneNumberId = process.env['WHATSAPP_PHONE_NUMBER_ID'];
  if (!token || !phoneNumberId) return false;

  const digits = rawPhone.replace(/[^0-9]/g, "");
  if (digits.length < 8) return false;
  const to = digits.length === 10 ? `91${digits}` : digits;

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    });
    if (!res.ok) {
      console.error("[whatsapp] send failed", res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[whatsapp] send error", error);
    return false;
  }
}
