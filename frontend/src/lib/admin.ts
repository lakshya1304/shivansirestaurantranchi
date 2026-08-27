import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchAPI } from "@/lib/db";

type TableName =
  | "products"
  | "categories"
  | "offers"
  | "discounts"
  | "loyalty_rules"
  | "inventory_items"
  | "restaurant_tables"
  | "restaurant_settings"
  | "orders"
  | "reviews"
  | "notifications"
  | "customers";

export function useSaveRow(table: TableName, queryKey: string, successMessage = "Saved") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      await fetchAPI(`/crud/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
    },
    onSuccess: () => {
      toast.success(successMessage);
      void qc.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteRow(table: TableName, queryKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchAPI(`/crud/${table}/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Deleted");
      void qc.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
