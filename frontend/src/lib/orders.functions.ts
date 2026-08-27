import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const lineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  weightLabel: z.string().max(20).nullable(),
  weightGrams: z.number().int().min(1).max(20000).nullable(),
  instructions: z.array(z.string().max(40)).max(8),
});

const orderSchema = z
  .object({
    tableNumber: z.number().int().min(1).max(999).nullable(),
    customerName: z.string().trim().min(2).max(60),
    customerPhone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s]{8,16}$/, "Enter a valid phone number"),
    paymentMethod: z.string().max(30),
    couponCode: z.string().trim().max(30).nullable(),
    notes: z.string().trim().max(300).nullable(),
    isTakeaway: z.boolean(),
    lines: z.array(lineSchema).min(1).max(60),
  })
  .refine((v) => v.isTakeaway || v.tableNumber != null, {
    message: "Table number is required for dine-in orders",
    path: ["tableNumber"],
  });


export const placeOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const productIds = [...new Set(data.lines.map((l) => l.productId))];
    const [{ data: products, error: pErr }, { data: settingsRows }, { data: discountRows }, { data: loyaltyRows }] =
      await Promise.all([
        supabaseAdmin.from("products").select("*").in("id", productIds),
        supabaseAdmin.from("restaurant_settings").select("*").limit(1),
        supabaseAdmin.from("discounts").select("*").eq("is_active", true),
        supabaseAdmin.from("loyalty_rules").select("*").eq("is_active", true),
      ]);

    if (pErr) throw new Error(pErr.message);
    const settings = settingsRows?.[0];
    if (!settings) throw new Error("Restaurant is not configured yet");

    const items = data.lines.map((line) => {
      const product = (products ?? []).find((p) => p.id === line.productId);
      if (!product) throw new Error("An item in your cart is no longer available");
      if (!product.is_available) throw new Error(`${product.name} is currently unavailable`);
      const unitPrice = product.sold_by_weight
        ? Math.round(((product.price_per_kg ?? 0) * (line.weightGrams ?? 250)) / 1000)
        : Number(product.offer_price ?? 0) > 0
          ? Number(product.offer_price)
          : Number(product.price);
      return {
        product_id: product.id,
        name: product.name,
        unit_price: unitPrice,
        quantity: line.quantity,
        weight_label: line.weightLabel,
        instructions: line.instructions.length ? line.instructions.join(", ") : null,
        line_total: unitPrice * line.quantity,
      };
    });

    const subtotal = items.reduce((s, i) => s + i.line_total, 0);

    // customer lookup (guest becomes a registered customer on first order)
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("phone", data.customerPhone)
      .maybeSingle();

    const today = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours();

    let discount = 0;
    let discountLabel: string | null = null;

    // coupon / campaign discounts
    const eligible = (discountRows ?? []).filter((d) => {
      if (d.starts_at && d.starts_at > today) return false;
      if (d.ends_at && d.ends_at < today) return false;
      if (subtotal < Number(d.min_order_amount)) return false;
      if (d.start_hour != null && d.end_hour != null && (hour < d.start_hour || hour >= d.end_hour)) return false;
      if (d.coupon_code) return data.couponCode?.toUpperCase() === d.coupon_code.toUpperCase();
      return true;
    });

    for (const d of eligible) {
      const raw = d.type === "flat" ? Number(d.value) : (subtotal * Number(d.value)) / 100;
      const capped = d.max_discount != null ? Math.min(raw, Number(d.max_discount)) : raw;
      if (capped > discount) {
        discount = capped;
        discountLabel = d.name;
      }
    }

    // loyalty discount based on previous visits
    const visits = existingCustomer?.visits ?? 0;
    const loyaltyTier = (loyaltyRows ?? [])
      .filter((r) => visits >= r.visits_required)
      .sort((a, b) => b.visits_required - a.visits_required)[0];
    if (loyaltyTier) {
      const loyaltyValue = (subtotal * Number(loyaltyTier.discount_percent)) / 100;
      if (loyaltyValue > discount) {
        discount = loyaltyValue;
        discountLabel = `Loyalty reward (${loyaltyTier.discount_percent}% • ${visits} visits)`;
      }
    }

    discount = Math.round(Math.min(discount, subtotal) * 100) / 100;
    const taxable = subtotal - discount;
    const tax = Math.round(((taxable * Number(settings.tax_percent)) / 100) * 100) / 100;
    const packing = data.isTakeaway ? Number(settings.packing_charge) : 0;
    const delivery = data.isTakeaway ? Number(settings.delivery_charge) : 0;
    const total = Math.round((taxable + tax + packing + delivery) * 100) / 100;

    let customerId = existingCustomer?.id ?? null;
    const earnedPoints = Math.floor(total / 100) * 10;
    if (existingCustomer) {
      await supabaseAdmin
        .from("customers")
        .update({
          name: data.customerName,
          visits: existingCustomer.visits + 1,
          reward_points: existingCustomer.reward_points + earnedPoints,
          total_spend: Number(existingCustomer.total_spend) + total,
          last_visit: new Date().toISOString(),
          favourite_item: items[0]?.name ?? existingCustomer.favourite_item,
        })
        .eq("id", existingCustomer.id);
    } else {
      const { data: created, error: cErr } = await supabaseAdmin
        .from("customers")
        .insert({
          name: data.customerName,
          phone: data.customerPhone,
          visits: 1,
          reward_points: earnedPoints,
          total_spend: total,
          last_visit: new Date().toISOString(),
          favourite_item: items[0]?.name ?? null,
        })
        .select("id")
        .single();
      if (cErr) throw new Error(cErr.message);
      customerId = created.id;
      await supabaseAdmin.from("notifications").insert({
        type: "customer",
        title: "New customer registered",
        body: `${data.customerName} (${data.customerPhone}) placed their first order.`,
      });
    }

    const orderNumber = `SHV-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        table_number: data.tableNumber,
        customer_id: customerId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        payment_method: data.paymentMethod,
        subtotal,
        discount,
        discount_label: discountLabel,
        tax,
        packing_charge: packing,
        delivery_charge: delivery,
        total,
        notes: data.notes,
      })
      .select("id, order_number, session_token")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await supabaseAdmin
      .from("order_items")
      .insert(items.map((i) => ({ ...i, order_id: order.id })));
    if (iErr) throw new Error(iErr.message);

    if (discountLabel) {
      await supabaseAdmin.from("notifications").insert({
        type: "offer",
        title: "Offer used",
        body: `${discountLabel} applied on ${orderNumber}.`,
      });
    }

    const serveAt = data.tableNumber ? `Serve at table ${data.tableNumber}` : "Takeaway / parcel";

    await supabaseAdmin.from("notifications").insert({
      type: "order",
      title: `New order ${orderNumber}`,
      body: `${serveAt} • ${data.customerName} • ₹${total}`,
    });

    // WhatsApp confirmation from the verified business bot sender.
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp.server");
    void sendWhatsAppMessage(
      data.customerPhone,
      `🍽 *Shivansi Restaurant & Sweet Shop*\n\nHi ${data.customerName}, your order *${orderNumber}* is confirmed.\n${serveAt}\nItems: ${items
        .map((i) => `${i.quantity}× ${i.name}`)
        .join(", ")}\nTotal: ₹${total}\n\nThis is an automated message from our ordering bot — replies are not monitored.`,
    );

    return { id: order.id as string, token: order.session_token as string, orderNumber };
  });


export const getPublicOrder = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), token: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", data.id)
      .eq("session_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;
    const { data: settingsRows } = await supabaseAdmin.from("restaurant_settings").select("*").limit(1);
    return { order, settings: settingsRows?.[0] ?? null };
  });

const phoneSchema = z.string().trim().regex(/^[0-9+\-\s]{8,16}$/);

async function hashCode(phone: string, code: string) {
  const data = new TextEncoder().encode(`${phone}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Sends a one-time code over the WhatsApp bot so a guest can prove they own the number. */
export const requestOrderHistoryCode = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ phone: phoneSchema }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1000000).padStart(6, "0");
    await supabaseAdmin.from("phone_verifications").insert({
      phone: data.phone,
      code_hash: await hashCode(data.phone, code),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp.server");
    const sent = await sendWhatsAppMessage(
      data.phone,
      `🔐 *Shivansi Restaurant & Sweet Shop*\n\nYour order history verification code is *${code}*. It expires in 10 minutes.\n\nAutomated message — never share this code with anyone.`,
    ).then(
      () => true,
      () => false,
    );
    // Always generic so the endpoint cannot be used to probe which numbers exist.
    return { ok: true, delivered: Boolean(sent) };
  });

export const getOrdersByPhone = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ phone: phoneSchema, code: z.string().trim().regex(/^[0-9]{6}$/) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: challenge } = await supabaseAdmin
      .from("phone_verifications")
      .select("*")
      .eq("phone", data.phone)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const invalid = new Error("That code is invalid or has expired. Request a new one.");
    if (!challenge || challenge.attempts >= 5) throw invalid;

    if (challenge.code_hash !== (await hashCode(data.phone, data.code))) {
      await supabaseAdmin
        .from("phone_verifications")
        .update({ attempts: challenge.attempts + 1 })
        .eq("id", challenge.id);
      throw invalid;
    }

    await supabaseAdmin.from("phone_verifications").update({ used: true }).eq("id", challenge.id);

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id, name, visits, reward_points, last_visit")
      .eq("phone", data.phone)
      .maybeSingle();
    if (!customer) return null;
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50);
    return { customer, orders: orders ?? [] };
  });

