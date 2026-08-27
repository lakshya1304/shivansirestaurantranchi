/**
 * Sends WhatsApp updates through the official WhatsApp Cloud API business
 * sender (a verified bot sender, not a personal number).
 * Credentials come from Admin → Settings (app_config) and fall back to
 * WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID env vars.
 * Silently no-ops until credentials are configured.
 */
async function loadCredentials(): Promise<{ token: string; phoneNumberId: string } | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_config")
      .select("whatsapp_token, whatsapp_phone_number_id")
      .limit(1)
      .maybeSingle();
    if (data?.whatsapp_token && data.whatsapp_phone_number_id) {
      return { token: data.whatsapp_token, phoneNumberId: data.whatsapp_phone_number_id };
    }
  } catch (error) {
    console.error("[whatsapp] config read failed", error);
  }
  const token = process.env['WHATSAPP_TOKEN'];
  const phoneNumberId = process.env['WHATSAPP_PHONE_NUMBER_ID'];
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
