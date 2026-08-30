import { FastifyRequest, FastifyReply } from "fastify";
import { prismaApp, prismaAdmin } from "../../core/config/databaseConfig";
import logger from "../../core/config/loggerConfig";
import crypto from "crypto";
import { sendWhatsAppMessage } from "../../core/utils/whatsapp";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET } from "../../core/config/envConfig";

// 7-day profile token for phone-verified customer sessions
const PROFILE_TOKEN_TTL = 7 * 24 * 60 * 60; // seconds

function signProfileToken(phone: string): string {
  return jwt.sign({ phone }, JWT_ACCESS_SECRET, { expiresIn: PROFILE_TOKEN_TTL });
}

function verifyProfileToken(token: string): { phone: string } {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as { phone: string };
  } catch {
    throw Object.assign(
      new Error("Profile session expired. Please verify your number again."),
      { statusCode: 401 },
    );
  }
}

// Helper for phone OTP hashing
async function hashCode(phone: string, code: string) {
  const data = new TextEncoder().encode(`${phone}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const placeOrder = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const data = req.body as any; // We will assume it's validated by a middleware or schema later

    // 1. Fetch related data
    const productIds = [...new Set(data.lines.map((l: any) => l.productId))];
    const products = await prismaApp.product.findMany({
      where: { id: { in: productIds as string[] } },
    });
    const settings = await prismaAdmin.restaurantSettings.findFirst();
    const discounts = await prismaApp.discount.findMany({ where: { is_active: true } });
    const loyaltyRules = await prismaApp.loyaltyRule.findMany({
      where: { is_active: true },
    });

    if (!settings)
      return res.status(400).send({ error: "Restaurant is not configured yet" });

    // 2. Build items and subtotal
    const items = data.lines.map((line: any) => {
      const product = products.find((p) => p.id === line.productId);
      if (!product) throw new Error("An item in your cart is no longer available");
      if (!product.is_available)
        throw new Error(`${product.name} is currently unavailable`);

      const unitPrice = product.sold_by_weight
        ? Math.round(
            ((Number(product.price_per_kg) || 0) * (line.weightGrams || 250)) / 1000,
          )
        : Number(product.offer_price) > 0
          ? Number(product.offer_price)
          : Number(product.price);

      return {
        product_id: product.id,
        name: product.name,
        unit_price: unitPrice,
        quantity: line.quantity,
        weight_label: line.weightLabel,
        instructions: line.instructions?.length ? line.instructions.join(", ") : null,
        line_total: unitPrice * line.quantity,
      };
    });

    const subtotal = items.reduce((s: number, i: any) => s + i.line_total, 0);

    // 3. Customer lookup
    const existingCustomer = await prismaApp.user.findUnique({
      where: { phone: data.customerPhone },
    });

    const today = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours();

    let discount = 0;
    let discountLabel: string | null = null;

    // 4. Coupon/Campaign discounts
    const eligible = discounts.filter((d) => {
      if (d.starts_at && d.starts_at > new Date(today)) return false;
      if (d.ends_at && d.ends_at < new Date(today)) return false;
      if (subtotal < Number(d.min_order_amount)) return false;
      if (
        d.start_hour != null &&
        d.end_hour != null &&
        (hour < d.start_hour || hour >= d.end_hour)
      )
        return false;
      if (d.coupon_code)
        return data.couponCode?.toUpperCase() === d.coupon_code.toUpperCase();
      return true;
    });

    for (const d of eligible) {
      const raw =
        d.type === "flat" ? Number(d.value) : (subtotal * Number(d.value)) / 100;
      const capped = d.max_discount != null ? Math.min(raw, Number(d.max_discount)) : raw;
      if (capped > discount) {
        discount = capped;
        discountLabel = d.name;
      }
    }

    // 5. Loyalty discounts (only on the milestone order, e.g. exactly 25th, 50th visit)
    const visits = existingCustomer?.visits ?? 0;
    const loyaltyTier = loyaltyRules
      .filter((r) => visits + 1 === r.visits_required)
      .sort((a, b) => b.visits_required - a.visits_required)[0];

    if (loyaltyTier) {
      const loyaltyValue = (subtotal * Number(loyaltyTier.discount_percent)) / 100;
      if (loyaltyValue > discount) {
        discount = loyaltyValue;
        discountLabel = `Loyalty reward (${loyaltyTier.discount_percent}% • ${visits} visits)`;
      }
    }

    // Combined discount must never exceed subtotal (prevents negative totals)
    // Also cap percentage-based discounts so they can't logically exceed 100%
    discount = Math.max(0, Math.round(Math.min(discount, subtotal) * 100) / 100);
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.max(
      0,
      Math.round(((taxable * Number(settings.tax_percent)) / 100) * 100) / 100,
    );
    const packing = data.isTakeaway ? Math.max(0, Number(settings.packing_charge)) : 0;
    const delivery = data.isTakeaway ? Math.max(0, Number(settings.delivery_charge)) : 0;
    const total = Math.max(
      0,
      Math.round((taxable + tax + packing + delivery) * 100) / 100,
    );

    const earnedPoints = Math.floor(total / 100) * 10;
    let customerId = existingCustomer?.id;

    // 6. DB Transaction for order creation
    const orderNumber = `SHV-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const billId = `BILL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await prismaApp.$transaction(async (tx) => {
      // Upsert customer
      let customer;
      if (existingCustomer) {
        customer = await tx.user.update({
          where: { id: existingCustomer.id },
          data: {
            name: data.customerName,
            visits: { increment: 1 },
            reward_points: { increment: earnedPoints },
            total_spend: { increment: total },
            last_visit: new Date(),
            favourite_item: items[0]?.name ?? existingCustomer.favourite_item,
          },
        });
      } else {
        customer = await tx.user.create({
          data: {
            name: data.customerName,
            email: `${data.customerPhone}@guest.maatarasweets.com`,
            password: crypto.randomBytes(16).toString("hex"),
            role: "USER",
            phone: data.customerPhone,
            visits: 1,
            reward_points: earnedPoints,
            total_spend: total,
            last_visit: new Date(),
            favourite_item: items[0]?.name ?? null,
          },
        });
        await tx.appNotification.create({
          data: {
            type: "customer",
            title: "New customer registered",
            body: `${data.customerName} (${data.customerPhone}) placed their first order.`,
          },
        });
      }

      customerId = customer.id;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          order_number: orderNumber,
          bill_id: billId,
          table_number: data.tableNumber,
          user_id: customer.id,
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          payment_method: data.paymentMethod,
          status: "PENDING",
          payment_status: "pending",
          session_token: crypto.randomUUID
            ? crypto.randomUUID()
            : crypto.randomBytes(16).toString("hex"),
          subtotal,
          discount,
          discount_label: discountLabel,
          tax,
          packing_charge: packing,
          delivery_charge: delivery,
          total,
          notes: data.notes,
          order_items: {
            create: items.map((i: any) => ({
              product_id: i.product_id,
              name: i.name,
              unit_price: i.unit_price,
              quantity: i.quantity,
              weight_label: i.weight_label,
              instructions: i.instructions,
              line_total: i.line_total,
            })),
          },
        },
      });

      if (discountLabel) {
        await tx.appNotification.create({
          data: {
            type: "offer",
            title: "Offer used",
            body: `${discountLabel} applied on ${orderNumber}.`,
          },
        });
      }

      const serveAt = data.tableNumber
        ? `Serve at table ${data.tableNumber}`
        : "Takeaway / parcel";
      await tx.appNotification.create({
        data: {
          type: "order",
          title: `New order ${orderNumber}`,
          body: `${serveAt} • ${data.customerName} • ₹${total}`,
        },
      });

      return newOrder;
    });

    const serveAt = data.tableNumber
      ? `Serve at table ${data.tableNumber}`
      : "Takeaway / parcel";
    void sendWhatsAppMessage(
      data.customerPhone,
      `🍽 *Shivansi Restaurant & Sweet Shop*\n\nHi ${data.customerName}, your order *${order.order_number}* is confirmed.\n${serveAt}\nItems: ${items
        .map((i: any) => `${i.quantity}× ${i.name}`)
        .join(
          ", ",
        )}\nTotal: ₹${total}\n\nThis is an automated message from our ordering bot — replies are not monitored.`,
    );

    // Notify Admin
    if (settings.phone) {
      void sendWhatsAppMessage(
        settings.phone,
        `*New Order Alert: ${order.order_number}*\n\nCustomer: ${data.customerName}\n${serveAt}\nTotal: ₹${total}\n\nPlease check the admin dashboard to approve this order.`,
      );
    }

    return res.send({
      id: order.id,
      token: order.session_token,
      orderNumber: order.order_number,
      billId: order.bill_id,
    });
  } catch (error: any) {
    logger.error(`Error in placeOrder: ${error.message}`);
    return res.status(400).send({ error: error.message });
  }
};

export const updateOrderStatus = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { id } = req.params as any;
    const { status } = req.body as any;

    const VALID_STATUSES = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "PREPARED",
      "SERVED",
      "COMPLETED",
      "CANCELLED",
    ];
    if (!VALID_STATUSES.includes(status)) {
      return res
        .status(400)
        .send({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    // Fetch current order to validate the transition is forward (or cancellation)
    const current = await prismaApp.order.findUnique({
      where: { id },
      select: {
        status: true,
        customer_phone: true,
        customer_name: true,
        order_number: true,
        table_number: true,
      },
    });
    if (!current) return res.status(404).send({ error: "Order not found" });

    const STATUS_ORDER = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "PREPARED",
      "SERVED",
      "COMPLETED",
    ];
    const currentIdx = STATUS_ORDER.indexOf(current.status);
    const nextIdx = STATUS_ORDER.indexOf(status);
    // Allow only forward transitions (or explicit CANCELLED from any non-completed state)
    if (
      status !== "CANCELLED" &&
      nextIdx !== -1 &&
      currentIdx !== -1 &&
      nextIdx < currentIdx
    ) {
      return res
        .status(400)
        .send({ error: `Cannot move order back from ${current.status} to ${status}` });
    }
    if (current.status === "COMPLETED" || current.status === "CANCELLED") {
      return res
        .status(400)
        .send({ error: `Order is already ${current.status} and cannot be changed` });
    }

    const order = await prismaApp.order.update({
      where: { id },
      data: { status },
    });

    const STATUS_MESSAGE: Record<string, string> = {
      CONFIRMED: "has been accepted by the kitchen",
      PREPARING: "is being prepared right now",
      PREPARED: "is ready to be served",
      SERVED: "has been served — enjoy your meal!",
      COMPLETED: "is complete. Thank you for dining with us",
      CANCELLED: "could not be accepted. Please talk to our staff.",
    };

    const line = STATUS_MESSAGE[status];
    if (line && current.customer_phone) {
      void sendWhatsAppMessage(
        current.customer_phone,
        `🍽 *Maa Tara Sweets*\n\nHi ${current.customer_name}, your order *${current.order_number}* ${line}\n${current.table_number ? `Table ${current.table_number}` : "Takeaway"}\n\nAutomated bot update — replies are not monitored.`,
      );
    }

    return res.send({ ok: true, order });
  } catch (error: any) {
    logger.error(`Error in updateOrderStatus: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const updatePaymentStatus = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { id } = req.params as any;
    const order = await prismaApp.order.update({
      where: { id },
      data: { payment_status: "paid" },
    });
    return res.send({ ok: true, order });
  } catch (error: any) {
    logger.error(`Error in updatePaymentStatus: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getPublicOrder = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { id, token } = req.query as any;
    const order = await prismaApp.order.findFirst({
      where: { id, session_token: token },
      include: { order_items: true },
    });
    if (!order) return res.send(null);
    const settings = await prismaAdmin.restaurantSettings.findFirst();
    return res.send({ order, settings });
  } catch (error: any) {
    logger.error(`Error in getPublicOrder: ${error.message}`);
    return res.status(400).send({ error: error.message });
  }
};

export const requestOrderHistoryCode = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { phone } = req.body as any;
    const code = String(
      crypto.getRandomValues(new Uint32Array(1))[0]! % 1000000,
    ).padStart(6, "0");
    const hash = await hashCode(phone, code);

    await prismaApp.phoneVerification.create({
      data: {
        phone,
        code_hash: hash,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    void sendWhatsAppMessage(
      phone,
      `🔐 *Shivansi Restaurant & Sweet Shop*\n\nYour order history verification code is *${code}*. It expires in 10 minutes.\n\nAutomated message — never share this code with anyone.`,
    );

    return res.send({ ok: true, delivered: true });
  } catch (error: any) {
    logger.error(`Error in requestOrderHistoryCode: ${error.message}`);
    return res.status(400).send({ error: error.message });
  }
};

export const getOrdersByPhone = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { phone, code } = req.body as any;

    const challenge = await prismaApp.phoneVerification.findFirst({
      where: {
        phone,
        used: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    const invalid = new Error("That code is invalid or has expired. Request a new one.");
    if (!challenge || challenge.attempts >= 5) throw invalid;

    const hash = await hashCode(phone, code);
    if (challenge.code_hash !== hash) {
      await prismaApp.phoneVerification.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw invalid;
    }

    await prismaApp.phoneVerification.update({
      where: { id: challenge.id },
      data: { used: true },
    });

    let customer = await prismaApp.user.findUnique({
      where: { phone },
    });

    if (!customer) {
      customer = await prismaApp.user.create({
        data: {
          name: phone, // Provide a default name since it's required
          email: `${phone}@guest.maatarasweets.com`,
          password: crypto.randomBytes(16).toString("hex"),
          role: "USER",
          phone,
          visits: 0,
          reward_points: 0,
          total_spend: 0,
        },
      });
    }

    const orders = await prismaApp.order.findMany({
      where: { user_id: customer.id },
      include: { order_items: true },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    // Issue a signed profile token so the customer can access /customer-profile
    // without a full user account / JWT session.
    const profileToken = signProfileToken(phone);

    return res.send({ customer, orders, profileToken });
  } catch (error: any) {
    logger.error(`Error in getOrdersByPhone: ${error.message}`);
    return res.status(400).send({ error: error.message });
  }
};

// ─── GET /data/customer-profile ─────────────────────────────────────────────
// Query params: phone, token
export const getCustomerProfile = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { phone, token } = req.query as { phone?: string; token?: string };
    if (!phone || !token)
      return res.status(400).send({ error: "phone and token are required" });

    const payload = verifyProfileToken(token);
    if (payload.phone !== phone)
      return res.status(401).send({ error: "Token does not match phone" });

    const customer = await prismaApp.user.findUnique({ where: { phone } });
    if (!customer)
      return res.status(404).send({ error: "No profile found for this number" });

    const orders = await prismaApp.order.findMany({
      where: { user_id: customer.id },
      include: { order_items: true },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    return res.send({ customer, orders });
  } catch (error: any) {
    logger.error(`Error in getCustomerProfile: ${error.message}`);
    return res.status(error.statusCode ?? 400).send({ error: error.message });
  }
};

// ─── PATCH /data/customer-profile ───────────────────────────────────────────
// Body: { phone, token, name?, birthday?, saved_address? }
export const updateCustomerProfile = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { phone, token, name, birthday, saved_address } = req.body as any;
    if (!phone || !token)
      return res.status(400).send({ error: "phone and token are required" });

    const payload = verifyProfileToken(token);
    if (payload.phone !== phone)
      return res.status(401).send({ error: "Token does not match phone" });

    const customer = await prismaApp.user.findUnique({ where: { phone } });
    if (!customer)
      return res.status(404).send({ error: "No profile found for this number" });

    const updated = await prismaApp.user.update({
      where: { phone },
      data: {
        ...(name !== undefined && { name: String(name).trim().slice(0, 80) }),
        ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
        ...(saved_address !== undefined && {
          saved_address: String(saved_address).trim().slice(0, 200) || null,
        }),
      },
    });

    return res.send({ customer: updated });
  } catch (error: any) {
    logger.error(`Error in updateCustomerProfile: ${error.message}`);
    return res.status(error.statusCode ?? 400).send({ error: error.message });
  }
};

export const submitRating = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { orderId, menuItemId, phone, stars, comment } = req.body as any;
    if (!orderId || !menuItemId || !phone || !stars) {
      return res
        .status(400)
        .send({ error: "orderId, menuItemId, phone, and stars are required" });
    }

    // Verify order belongs to phone and contains the product
    const order = await prismaApp.order.findFirst({
      where: {
        id: orderId,
        customer_phone: phone,
        order_items: { some: { product_id: menuItemId } },
      },
    });

    if (!order)
      return res.status(404).send({ error: "Order or item not found for this user" });

    // Check if already rated
    const existing = await prismaApp.rating.findFirst({
      where: { orderId, menuItemId, phone },
    });
    if (existing)
      return res
        .status(400)
        .send({ error: "You already rated this item for this order" });

    const rating = await prismaApp.rating.create({
      data: {
        orderId,
        menuItemId,
        phone,
        stars: Number(stars),
        comment: comment || null,
      },
    });

    // Update product rating aggregate
    const allRatings = await prismaApp.rating.findMany({ where: { menuItemId } });
    const avg =
      allRatings.reduce((acc: number, r: any) => acc + r.stars, 0) / allRatings.length;

    await prismaApp.product.update({
      where: { id: menuItemId },
      data: {
        rating: avg,
        review_count: allRatings.length,
      },
    });

    return res.send({ ok: true, rating });
  } catch (error: any) {
    logger.error(`Error in submitRating: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};
