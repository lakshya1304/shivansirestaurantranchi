/**
 * Sends WhatsApp updates through the official WhatsApp Cloud API business
 * sender (a verified bot sender, not a personal number).
 * Credentials come from Admin → Settings (app_config via backend API) and fall
 * back to WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID env vars.
 * Silently no-ops until credentials are configured.
 */
const API_BASE = process.env["VITE_API_BASE_URL"] ?? "http://localhost:3000/api/v1";

async function loadCredentials(): Promise<{ token: string; phoneNumberId: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/data/settings/owner`);
    if (res.ok) {
      const json = (await res.json()) as {
        whatsappToken?: string;
        whatsappPhoneNumberId?: string;
      };
      if (json.whatsappToken && json.whatsappToken !== "***" && json.whatsappPhoneNumberId) {
        return { token: json.whatsappToken, phoneNumberId: json.whatsappPhoneNumberId };
      }
    }
  } catch (error) {
    console.error("[whatsapp] config read failed", error);
  }
  // Fallback to env vars
  const token = process.env["WHATSAPP_TOKEN"];
  const phoneNumberId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
  return token && phoneNumberId ? { token, phoneNumberId } : null;
}

export async function sendWhatsAppMessage(rawPhone: string, message: string): Promise<boolean> {
  const creds = await loadCredentials();
  if (!creds) return false;

  const digits = rawPhone.replace(/[^0-9]/g, "");
  if (digits.length < 8) return false;
  const to = digits.length === 10 ? `91${digits}` : digits;

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${creds.phoneNumberId}/messages`, {
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
