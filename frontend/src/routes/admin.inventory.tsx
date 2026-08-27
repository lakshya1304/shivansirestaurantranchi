import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { inventoryQuery } from "@/lib/db";
import { useDeleteRow, useSaveRow } from "@/lib/admin";
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin/inventory")({
  component: InventoryManager,
});

function InventoryManager() {
  const { data: items = [] } = useQuery(inventoryQuery);
  const save = useSaveRow("inventory_items", "inventory", "Stock updated");
  const remove = useDeleteRow("inventory_items", "inventory");
  const [draft, setDraft] = useState({ name: "", unit: "kg", quantity: 0, low_stock_threshold: 5, cost_per_unit: 0 });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-xl font-bold">Inventory</h2>
        <p className="text-sm text-muted-foreground">Track raw materials and get low-stock alerts.</p>
      </header>

      <div className="glass grid gap-3 rounded-3xl p-5 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <Label>Item</Label>
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <Label>Unit</Label>
          <Input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
        </div>
        <div>
          <Label>Quantity</Label>
          <Input
            type="number"
            value={draft.quantity}
            onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Low at</Label>
          <Input
            type="number"
            value={draft.low_stock_threshold}
            onChange={(e) => setDraft({ ...draft, low_stock_threshold: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-end">
          <Button
            variant="hero"
            className="w-full rounded-full"
            onClick={() =>
              save.mutate({ ...draft }, { onSuccess: () => setDraft({ ...draft, name: "", quantity: 0 }) })
            }
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      <div className="glass overflow-x-auto rounded-3xl p-4">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2">Item</th>
              <th className="py-2">Quantity</th>
              <th className="py-2">Low-stock at</th>
              <th className="py-2 text-right">Cost / unit</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const low = Number(item.quantity) <= Number(item.low_stock_threshold);
              return (
                <tr key={item.id} className="border-t border-border/60">
                  <td className="py-2">
                    {item.name} {low ? <Badge variant="destructive"><AlertTriangle className="size-3" /> Low</Badge> : null}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue={item.quantity}
                        className="h-8 w-24"
                        onBlur={(e) => save.mutate({ id: item.id, quantity: Number(e.target.value) })}
                      />
                      <span className="text-xs text-muted-foreground">{item.unit}</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <Input
                      type="number"
                      defaultValue={item.low_stock_threshold}
                      className="h-8 w-20"
                      onBlur={(e) => save.mutate({ id: item.id, low_stock_threshold: Number(e.target.value) })}
                    />
                  </td>
                  <td className="py-2 text-right">{money(item.cost_per_unit)}</td>
                  <td className="py-2 text-right">
                    <Button size="icon" variant="glass" className="size-8" onClick={() => remove.mutate(item.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
