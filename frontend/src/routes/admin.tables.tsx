import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { tablesQuery } from "@/lib/db";
import { useDeleteRow, useSaveRow } from "@/lib/admin";

export const Route = createFileRoute("/admin/tables")({
  component: TablesManager,
});

function TablesManager() {
  const { data: tables = [] } = useQuery(tablesQuery);
  const save = useSaveRow("restaurant_tables", "tables", "Table saved");
  const remove = useDeleteRow("restaurant_tables", "tables");
  const [draft, setDraft] = useState({ table_number: 1, seats: 4 });
  const [codes, setCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    Promise.all(
      tables.map(async (t) => {
        const url = `${window.location.origin}/table/${t.table_number}`;
        return [t.id, await QRCode.toDataURL(url, { width: 320, margin: 1 })] as const;
      }),
    ).then((entries) => {
      if (active) setCodes(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, [tables]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-xl font-bold">Tables & QR codes</h2>
        <p className="text-sm text-muted-foreground">
          Print a QR per table — scanning opens the menu with that table pre-selected.
        </p>
      </header>

      <div className="glass grid gap-3 rounded-3xl p-5 sm:grid-cols-4">
        <div>
          <Label>Table number</Label>
          <Input
            type="number"
            value={draft.table_number}
            onChange={(e) => setDraft({ ...draft, table_number: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Seats</Label>
          <Input
            type="number"
            value={draft.seats}
            onChange={(e) => setDraft({ ...draft, seats: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-end">
          <Button
            variant="hero"
            className="w-full rounded-full"
            onClick={() => save.mutate({ ...draft, is_active: true })}
          >
            <Plus className="size-4" /> Add table
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tables.map((t) => (
          <div key={t.id} className="glass rounded-3xl p-4 text-center">
            {codes[t.id] ? (
              <img
                src={codes[t.id]}
                alt={`QR code for table ${t.table_number}`}
                className="mx-auto size-40 rounded-2xl bg-white p-2"
              />
            ) : (
              <div className="mx-auto size-40 animate-pulse rounded-2xl bg-muted" />
            )}
            <p className="mt-3 font-display text-lg font-bold">Table {t.table_number}</p>
            <p className="text-xs text-muted-foreground">{t.seats} seats</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Switch
                checked={t.is_active}
                onCheckedChange={(v) => save.mutate({ id: t.id, is_active: v })}
              />
              <Button
                size="icon"
                variant="glass"
                className="size-8"
                onClick={() => remove.mutate(t.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="glass"
        className="rounded-full print:hidden"
        onClick={() => window.print()}
      >
        Print all QR codes
      </Button>
    </div>
  );
}
