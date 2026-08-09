import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

/** Insert or update a row and refresh the matching query cache. */
export function useSaveRow(table: TableName, queryKey: string, successMessage = "Saved") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const client = supabase.from(table as never);
      const { error } = row["id"]
        ? await client.update(row as never).eq("id", row["id"] as string)
        : await client.insert(row as never);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(successMessage);
      void qc.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Delete a row by id and refresh the matching query cache. */
export function useDeleteRow(table: TableName, queryKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table as never)
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Deleted");
      void qc.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
