import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const saveSchema = z.object({
  ownerEmail: z.string().trim().email().max(120),
  whatsappToken: z.string().trim().max(600),
  whatsappPhoneNumberId: z.string().trim().max(60),
});

/** Throws unless the caller is a verified admin. */
async function assertAdmin(context: { supabase: { from: (t: string) => any }; userId: string }) {
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
