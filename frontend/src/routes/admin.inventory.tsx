import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Plus, Trash2, Combine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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
  const [draft, setDraft] = useState({
    name: "",
    unit: "kg",
    quantity: 0,
    low_stock_threshold: 5,
    cost_per_unit: 0,
  });

  const [mergeSource, setMergeSource] = useState<any>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");

  const handleMerge = () => {
    if (!mergeSource || !mergeTargetId) return;
    const target = items.find((i: any) => i.id === mergeTargetId);
    if (!target) return;

    // Add quantities together
    save.mutate(
      {
        id: target.id,
        quantity: Number(target.quantity) + Number(mergeSource.quantity),
      },
      {
        onSuccess: () => {
          // Delete the source item
          remove.mutate(mergeSource.id);
          setMergeSource(null);
          setMergeTargetId("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-xl font-bold">Inventory</h2>
        <p className="text-sm text-muted-foreground">
          Track raw materials, get low-stock alerts, and merge duplicates.
        </p>
      </header>

      {/* Chart Section */}
      {items.length > 0 && (
        <div className="glass rounded-3xl p-5 h-[300px] animate-rise">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Stock Levels</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "hsl(var(--primary)/0.05)" }}
                contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
              />
              <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                {items.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      Number(entry.quantity) <= Number(entry.low_stock_threshold)
                        ? "hsl(var(--destructive))"
                        : "hsl(var(--primary))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass grid gap-3 rounded-3xl p-5 sm:grid-cols-6 animate-rise">
        <div className="sm:col-span-2">
          <Label>Item</Label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>
        <div>
          <Label>Unit</Label>
          <Input
            value={draft.unit}
            onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          />
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
            onChange={(e) =>
              setDraft({ ...draft, low_stock_threshold: Number(e.target.value) })
            }
          />
        </div>
        <div className="flex items-end">
          <Button
            variant="hero"
            className="w-full rounded-full"
            onClick={() =>
              save.mutate(
                { ...draft },
                { onSuccess: () => setDraft({ ...draft, name: "", quantity: 0 }) },
              )
            }
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      <div className="glass overflow-x-auto rounded-3xl p-4 animate-rise">
        <table className="w-full min-w-[720px] text-sm">
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
            {items.map((item: any) => {
              const low = Number(item.quantity) <= Number(item.low_stock_threshold);
              return (
                <tr key={item.id} className="border-t border-border/60">
                  <td className="py-2">
                    {item.name}{" "}
                    {low ? (
                      <Badge variant="destructive">
                        <AlertTriangle className="size-3" /> Low
                      </Badge>
                    ) : null}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue={item.quantity}
                        className="h-8 w-24"
                        onBlur={(e) =>
                          save.mutate({ id: item.id, quantity: Number(e.target.value) })
                        }
                      />
                      <span className="text-xs text-muted-foreground">{item.unit}</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <Input
                      type="number"
                      defaultValue={item.low_stock_threshold}
                      className="h-8 w-20"
                      onBlur={(e) =>
                        save.mutate({
                          id: item.id,
                          low_stock_threshold: Number(e.target.value),
                        })
                      }
                    />
                  </td>
                  <td className="py-2 text-right">{money(item.cost_per_unit)}</td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="glass"
                            className="size-8 rounded-full"
                            title="Merge into another item"
                            onClick={() => setMergeSource(item)}
                          >
                            <Combine className="size-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Merge Duplicates</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                              Merge <strong>{mergeSource?.name}</strong> into another item. This will add the quantities together and delete <strong>{mergeSource?.name}</strong>.
                            </p>
                            <div className="space-y-2">
                              <Label>Select target item</Label>
                              <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={mergeTargetId}
                                onChange={(e) => setMergeTargetId(e.target.value)}
                              >
                                <option value="">Select an item...</option>
                                {items
                                  .filter((i: any) => i.id !== mergeSource?.id)
                                  .map((i: any) => (
                                    <option key={i.id} value={i.id}>
                                      {i.name} ({i.quantity} {i.unit})
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <Button
                              variant="hero"
                              className="w-full rounded-full"
                              disabled={!mergeTargetId}
                              onClick={handleMerge}
                            >
                              Confirm Merge
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="icon"
                        variant="glass"
                        className="size-8 rounded-full"
                        onClick={() => remove.mutate(item.id)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
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
