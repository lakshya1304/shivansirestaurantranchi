import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { fetchAPI } from "@/lib/db";

const saveSchema = z.object({
  ownerEmail: z.string().trim().email().max(120),
  whatsappToken: z.string().trim().max(600).optional(),
  whatsappPhoneNumberId: z.string().trim().max(60),
});

async function assertAdmin(context: {
  isAdmin: boolean;
  mfaSatisfied: boolean;
}) {
  if (!context.mfaSatisfied) throw new Error("Two-step verification required");
  if (!context.isAdmin) throw new Error("Forbidden");
}

export const getAppConfig = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const data = await fetchAPI<{ ownerEmail: string, whatsappPhoneNumberId: string, whatsappToken: string }>("/settings/owner");
    return {
      ownerEmail: data.ownerEmail,
      whatsappPhoneNumberId: data.whatsappPhoneNumberId,
      whatsappTokenSet: Boolean(data.whatsappToken),
    };
  });

export const saveAppConfig = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    await fetchAPI("/settings/owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return { ok: true };
  });

const settingsSchema = z.object({
  id: z.string().optional(),
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

export const getOwnerSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const settings = await fetchAPI<any>("/settings");
    return settings;
  });

export const saveOwnerSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    await fetchAPI("/crud/restaurant_settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return { ok: true };
  });
