import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { fetchAPI } from "@/lib/db";

const statusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["pending", "accepted", "preparing", "ready", "served", "completed", "rejected"]),
});

/** Admin-only: change order status and send the customer an automated WhatsApp update. */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => statusSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (!context.mfaSatisfied) {
      throw new Error("Two-step verification required");
    }
    if (!context.isAdmin) {
      throw new Error("Forbidden");
    }

    await fetchAPI(`/orders/${data.orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: data.status }),
    });

    return { ok: true };
  });
