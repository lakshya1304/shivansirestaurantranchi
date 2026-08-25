import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const statusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["pending", "accepted", "preparing", "ready", "served", "completed", "rejected"]),
});

const STATUS_MESSAGE: Record<string, string> = {
  accepted: "has been accepted by the kitchen 👨‍🍳",
  preparing: "is being prepared right now 🔥",
  ready: "is ready to be served ✅",
  served: "has been served — enjoy your meal! 😋",
  completed: "is complete. Thank you for dining with us 🙏",
  rejected: "could not be accepted. Please talk to our staff.",
};

/** Admin-only: change order status and send the customer an automated WhatsApp update. */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => statusSchema.parse(data))
  .handler(async ({ data, context }) => {
    if ((context.claims as { aal?: string }).aal !== "aal2") {
      throw new Error("Two-step verification required");
    }
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId)
      .select("order_number, customer_name, customer_phone, table_number")
      .single();
    if (error) throw new Error(error.message);

    const line = STATUS_MESSAGE[data.status];
    if (line) {
      const { sendWhatsAppMessage } = await import("@/lib/whatsapp.server");
      void sendWhatsAppMessage(
        order.customer_phone,
        `🍽 *Shivansi Restaurant & Sweet Shop*\n\nHi ${order.customer_name}, your order *${order.order_number}* ${line}\n${
          order.table_number ? `Table ${order.table_number}` : "Takeaway"
        }\n\nAutomated bot update — replies are not monitored.`,
      );
    }

    return { ok: true };
  });
