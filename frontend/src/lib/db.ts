import { queryOptions } from "@tanstack/react-query";
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
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/data${endpoint}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }
  return response.json();
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
