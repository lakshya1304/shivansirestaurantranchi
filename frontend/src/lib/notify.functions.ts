import { z } from "zod";
import { fetchAPI } from "@/lib/db";

const statusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "PREPARED",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ]),
});

/** Admin-only: change order status and send the customer an automated WhatsApp update. */
export const updateOrderStatus = async (input: unknown) => {
  const data = statusSchema.parse(input);
  await fetchAPI(`/orders/${data.orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: data.status }),
  });
  return { ok: true };
};
