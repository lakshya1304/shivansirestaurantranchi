import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

async function unwrap<T>(promise: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

/** Public display-only settings. Payment (UPI) and tax identifiers are owner-only. */
const PUBLIC_SETTINGS_COLUMNS =
  "id, name, tagline, logo_url, banner_url, address, phone, opening_time, closing_time, tax_percent, packing_charge, delivery_charge, currency, theme";

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const rows = await unwrap<RestaurantSettings[]>(
      supabase.from("restaurant_settings").select(PUBLIC_SETTINGS_COLUMNS).limit(1),
    );
    return rows[0] ?? null;
  },
  staleTime: 30_000,
});


export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () =>
    unwrap<Category[]>(supabase.from("categories").select("*").order("sort_order", { ascending: true })),
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () =>
    unwrap<Product[]>(
      supabase.from("products").select("*").order("sort_order", { ascending: true }).order("name"),
    ),
});

export const offersQuery = queryOptions({
  queryKey: ["offers"],
  queryFn: () => unwrap<Offer[]>(supabase.from("offers").select("*").order("created_at", { ascending: false })),
});

export const discountsQuery = queryOptions({
  queryKey: ["discounts"],
  queryFn: () =>
    unwrap<Discount[]>(supabase.from("discounts").select("*").order("created_at", { ascending: false })),
});

export const loyaltyQuery = queryOptions({
  queryKey: ["loyalty"],
  queryFn: () =>
    unwrap<LoyaltyRule[]>(
      supabase.from("loyalty_rules").select("*").order("visits_required", { ascending: true }),
    ),
});

export const tablesQuery = queryOptions({
  queryKey: ["tables"],
  queryFn: () =>
    unwrap<RestaurantTable[]>(
      supabase.from("restaurant_tables").select("*").order("table_number", { ascending: true }),
    ),
});

export const reviewsQuery = queryOptions({
  queryKey: ["reviews"],
  queryFn: () =>
    unwrap<Review[]>(supabase.from("reviews").select("*").order("created_at", { ascending: false })),
});

export const inventoryQuery = queryOptions({
  queryKey: ["inventory"],
  queryFn: () => unwrap<InventoryItem[]>(supabase.from("inventory_items").select("*").order("name")),
});

export const customersQuery = queryOptions({
  queryKey: ["customers"],
  queryFn: () =>
    unwrap<Customer[]>(supabase.from("customers").select("*").order("total_spend", { ascending: false })),
});

export const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: () =>
    unwrap<Order[]>(
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(300),
    ),
});

export const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: () =>
    unwrap<AppNotification[]>(
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(60),
    ),
});

export function activeOffers(offers: Offer[]) {
  const today = new Date().toISOString().slice(0, 10);
  return offers.filter(
    (o) => o.is_active && (!o.starts_at || o.starts_at <= today) && (!o.ends_at || o.ends_at >= today),
  );
}
