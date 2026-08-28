import { queryOptions } from "@tanstack/react-query";
import axios from "axios";
import type {
  AppNotification,
  Category,
  Customer,
  Discount,
  InventoryItem,
  LoyaltyRule,
  Offer,
  Order,
  Product,
  RestaurantSettings,
  RestaurantTable,
  Review,
  StaffUser,
} from "./types";

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] || "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for Fastify httpOnly cookies
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If it's a 401, we haven't already retried, and it's not the login or refresh endpoints itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);



export async function fetchAPI<T>(endpoint: string, options?: any): Promise<T> {
  const isPost = options?.method && options.method !== "GET";
  // Auth endpoints live at /api/v1/auth/*, not under /data.
  // All other endpoints (categories, products, etc.) live under /api/v1/data/*.
  const url = endpoint.startsWith("/auth") || endpoint.startsWith("/data")
    ? endpoint
    : `/data${endpoint}`;
  try {
    const response = await apiClient({
      url,
      method: options?.method || "GET",
      headers: options?.headers,
      data: isPost && options?.body ? JSON.parse(options.body) : undefined,
    });
    return response.data;
  } catch (error: any) {
    // Safely extract a string message regardless of backend response shape:
    // { error: "msg" } | { message: "msg" } | { error: { message: "msg" } }
    const raw = error.response?.data?.error ?? error.response?.data?.message ?? null;
    const msg: string | null =
      raw == null ? null
      : typeof raw === "string" ? raw
      : typeof raw?.message === "string" ? raw.message
      : null;
    if (msg) throw new Error(msg);
    if (error.code === "ERR_NETWORK") {
      throw new Error("Unable to connect to the server. Please check your internet connection.");
    }
    throw new Error(error?.message ?? "Something went wrong. Please try again later.");
  }
}

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const settings = await fetchAPI<RestaurantSettings | null>("/settings");
    return settings;
  },
  staleTime: 30_000,
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => fetchAPI<Category[]>("/categories"),
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => fetchAPI<Product[]>("/products"),
});

export const offersQuery = queryOptions({
  queryKey: ["offers"],
  queryFn: () => fetchAPI<Offer[]>("/offers"),
});

export const discountsQuery = queryOptions({
  queryKey: ["discounts"],
  queryFn: () => fetchAPI<Discount[]>("/discounts"),
});

export const loyaltyQuery = queryOptions({
  queryKey: ["loyalty"],
  queryFn: () => fetchAPI<LoyaltyRule[]>("/loyalty"),
});

export const tablesQuery = queryOptions({
  queryKey: ["tables"],
  queryFn: () => fetchAPI<RestaurantTable[]>("/tables"),
});

export const reviewsQuery = queryOptions({
  queryKey: ["reviews"],
  queryFn: () => fetchAPI<Review[]>("/reviews"),
});

export const inventoryQuery = queryOptions({
  queryKey: ["inventory"],
  queryFn: () => fetchAPI<InventoryItem[]>("/inventory"),
});

export const customersQuery = queryOptions({
  queryKey: ["customers"],
  queryFn: () => fetchAPI<Customer[]>("/customers"),
});

export const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: () => fetchAPI<Order[]>("/orders"),
});

export const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: () => fetchAPI<AppNotification[]>("/notifications"),
});

export function activeOffers(offers: Offer[]) {
  const today = new Date().toISOString().slice(0, 10);
  return offers.filter(
    (o) => o.is_active && (!o.starts_at || o.starts_at <= today) && (!o.ends_at || o.ends_at >= today),
  );
}

export const staffQuery = queryOptions({
  queryKey: ["staff"],
  queryFn: async () => {
    // getAllUsers uses reply.send({success, users}) — no sendSuccess wrapper
    // so response.data is {success: true, users: []}. Access .users directly.
    const data = await fetchAPI<any>("/users");
    // Defensively handle both flat {users:[]} and wrapped {data:{users:[]}} shapes.
    return (data?.users ?? data?.data?.users ?? []) as StaffUser[];
  },
});
