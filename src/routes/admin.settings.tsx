import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settingsQuery } from "@/lib/db";
import { useSaveRow } from "@/lib/admin";
import { getAppConfig, saveAppConfig } from "@/lib/config.functions";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsManager,
});


const FIELDS: Array<{ key: string; label: string; type?: string }> = [
  { key: "name", label: "Restaurant name" },
  { key: "tagline", label: "Tagline" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Phone" },
  { key: "gst_number", label: "GST number" },
  { key: "upi_id", label: "UPI ID" },
  { key: "opening_time", label: "Opening time" },
  { key: "closing_time", label: "Closing time" },
  { key: "tax_percent", label: "GST %", type: "number" },
  { key: "packing_charge", label: "Packing charge", type: "number" },
  { key: "delivery_charge", label: "Delivery charge", type: "number" },
  { key: "currency", label: "Currency symbol" },
];

function SettingsManager() {
  const { data: settings } = useQuery(settingsQuery);
  const save = useSaveRow("restaurant_settings", "settings", "Settings saved");
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-xl font-bold">Restaurant settings</h2>
        <p className="text-sm text-muted-foreground">
          Everything here updates the customer-facing app instantly.
        </p>
      </header>

      <div className="glass grid gap-4 rounded-3xl p-6 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type={field.type ?? "text"}
              value={String(form[field.key] ?? "")}
              onChange={(e) =>
                setForm({
                  ...form,
                  [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                })
              }
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <Button variant="hero" className="rounded-full" onClick={() => save.mutate(form)}>
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
