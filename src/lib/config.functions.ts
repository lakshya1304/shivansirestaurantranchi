import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const saveSchema = z.object({
  ownerEmail: z.string().trim().email().max(120),
  whatsappToken: z.string().trim().max(600),
  whatsappPhoneNumberId: z.string().trim().max(60),
});

/** Throws unless the caller is a verified admin. */
async function assertAdmin(context: {
  supabase: { from: (t: string) => any };
  userId: string;
  claims: { aal?: string };
}) {
  if (context.claims.aal !== "aal2") throw new Error("Two-step verification required");
  const { data: role } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Forbidden");
}

/** Admin-only: read owner/WhatsApp config. The token is never returned, only whether it is set. */
export const getAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_config")
      .select("owner_email, whatsapp_phone_number_id, whatsapp_token")
      .limit(1)
      .maybeSingle();
    return {
      ownerEmail: data?.owner_email ?? "",
      whatsappPhoneNumberId: data?.whatsapp_phone_number_id ?? "",
      whatsappTokenSet: Boolean(data?.whatsapp_token),
    };
  });

/** Admin-only: update owner email and WhatsApp bot credentials. Empty token keeps the stored one. */
export const saveAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("app_config").select("id").limit(1).maybeSingle();

    const patch = {
      owner_email: data.ownerEmail,
      whatsapp_phone_number_id: data.whatsappPhoneNumberId,
      updated_at: new Date().toISOString(),
      ...(data.whatsappToken ? { whatsapp_token: data.whatsappToken } : {}),
    };

    const { error } = existing
      ? await supabaseAdmin.from("app_config").update(patch).eq("id", existing.id)
      : await supabaseAdmin.from("app_config").insert({ whatsapp_token: "", ...patch });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(200),
  address: z.string().trim().max(300),
  phone: z.string().trim().max(30),
  gst_number: z.string().trim().max(40),
  upi_id: z.string().trim().max(120),
  opening_time: z.string().trim().max(10),
  closing_time: z.string().trim().max(10),
  tax_percent: z.number().min(0).max(50),
  packing_charge: z.number().min(0).max(10000),
  delivery_charge: z.number().min(0).max(10000),
  currency: z.string().trim().max(4),
});

/** Admin-only: full restaurant settings including payment/tax identifiers. */
export const getOwnerSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("restaurant_settings").select("*").limit(1).maybeSingle();
    return data ?? null;
  });

/** Admin-only: update restaurant settings. */
export const saveOwnerSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("restaurant_settings").select("id").limit(1).maybeSingle();
    const { error } = existing
      ? await supabaseAdmin.from("restaurant_settings").update(data).eq("id", existing.id)
      : await supabaseAdmin.from("restaurant_settings").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
