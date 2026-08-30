import { z } from "zod";
import { fetchAPI } from "@/lib/db";

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
      .regex(/^(?:\+?91[\-\s]?)?[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),
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

export const placeOrder = async (input: unknown) => {
  const data = orderSchema.parse(input);
  return fetchAPI<{ id: string; token: string; orderNumber: string }>("/orders/place", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const getPublicOrder = async (input: unknown) => {
  const data = z.object({ id: z.string().uuid(), token: z.string().uuid() }).parse(input);
  return fetchAPI<any>(`/orders/public?id=${data.id}&token=${data.token}`);
};

const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+?91[\-\s]?)?[6-9]\d{9}$/, "Enter a valid 10-digit phone number");

export const requestOrderHistoryCode = async (input: unknown) => {
  const data = z.object({ phone: phoneSchema }).parse(input);
  return fetchAPI<{ ok: boolean; delivered: boolean }>("/orders/history/request-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const getOrdersByPhone = async (input: unknown) => {
  const data = z
    .object({
      phone: phoneSchema,
      code: z
        .string()
        .trim()
        .regex(/^[0-9]{6}$/),
    })
    .parse(input);
  return fetchAPI<any>("/orders/history/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};
