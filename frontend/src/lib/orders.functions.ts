import { createServerFn } from "@tanstack/react-start";
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
    return fetchAPI<{ id: string; token: string; orderNumber: string }>("/orders/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  });

export const getPublicOrder = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), token: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    return fetchAPI<any>(`/orders/public?id=${data.id}&token=${data.token}`);
  });

const phoneSchema = z.string().trim().regex(/^[0-9+\-\s]{8,16}$/);

export const requestOrderHistoryCode = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ phone: phoneSchema }).parse(data))
  .handler(async ({ data }) => {
    return fetchAPI<{ ok: boolean; delivered: boolean }>("/orders/history/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  });

export const getOrdersByPhone = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ phone: phoneSchema, code: z.string().trim().regex(/^[0-9]{6}$/) }).parse(data),
  )
  .handler(async ({ data }) => {
    return fetchAPI<any>("/orders/history/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  });
