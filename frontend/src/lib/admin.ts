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
      return await fetchAPI(`/crud/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
    },
    onMutate: async (newRow: Record<string, any>) => {
      await qc.cancelQueries({ queryKey: [queryKey] });
      const previousData = qc.getQueryData([queryKey]);
      qc.setQueryData([queryKey], (old: any) => {
        if (!old) return old;
        const index = old.findIndex((item: any) => item.id === newRow["id"]);
        if (index !== -1) {
          const updated = [...old];
          updated[index] = { ...updated[index], ...newRow };
          return updated;
        } else if (newRow["id"]) {
          return [...old, newRow];
        }
        return old;
      });
      return { previousData };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        qc.setQueryData([queryKey], context.previousData);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: [queryKey] });
    },
    onSuccess: () => {
      toast.success(successMessage);
    },
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
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: [queryKey] });
      const previousData = qc.getQueryData([queryKey]);
      qc.setQueryData([queryKey], (old: any) => {
        if (!old) return old;
        return old.filter((item: any) => item.id !== id);
      });
      return { previousData };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        qc.setQueryData([queryKey], context.previousData);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: [queryKey] });
    },
    onSuccess: () => {
      toast.success("Deleted");
    },
  });
}
