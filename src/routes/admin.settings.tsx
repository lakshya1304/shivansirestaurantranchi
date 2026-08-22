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
  const fetchSettings = useServerFn(getOwnerSettings);
  const persistSettings = useServerFn(saveOwnerSettings);
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["owner-settings"], queryFn: () => fetchSettings({}) });
  const [form, setForm] = useState<Record<string, unknown>>({});

  const save = useMutation({
    mutationFn: () =>
      persistSettings({
        data: Object.fromEntries(
          FIELDS.map((f) => [
            f.key,
            f.type === "number" ? Number(form[f.key] ?? 0) : String(form[f.key] ?? ""),
          ]),
        ) as never,
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      void qc.invalidateQueries({ queryKey: ["owner-settings"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fetchConfig = useServerFn(getAppConfig);
  const persistConfig = useServerFn(saveAppConfig);
  const { data: config } = useQuery({ queryKey: ["app-config"], queryFn: () => fetchConfig({}) });
  const [cfg, setCfg] = useState({ ownerEmail: "", whatsappPhoneNumberId: "", whatsappToken: "" });

  const saveConfig = useMutation({
    mutationFn: () => persistConfig({ data: cfg }),
    onSuccess: () => {
      toast.success("Owner & WhatsApp settings saved");
      setCfg((c) => ({ ...c, whatsappToken: "" }));
      void qc.invalidateQueries({ queryKey: ["app-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  useEffect(() => {
    if (config)
      setCfg({
        ownerEmail: config.ownerEmail,
        whatsappPhoneNumberId: config.whatsappPhoneNumberId,
        whatsappToken: "",
      });
  }, [config]);


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
          <Button
            variant="hero"
            className="rounded-full"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            Save settings
          </Button>
        </div>
      </div>



      <div className="glass grid gap-4 rounded-3xl p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h3 className="font-display text-lg font-bold">Owner & WhatsApp bot</h3>
          <p className="text-sm text-muted-foreground">
            Add your WhatsApp Cloud API credentials here — order updates start sending automatically once saved.
          </p>
        </div>
        <div>
          <Label htmlFor="ownerEmail">Owner email</Label>
          <Input
            id="ownerEmail"
            type="email"
            value={cfg.ownerEmail}
            onChange={(e) => setCfg({ ...cfg, ownerEmail: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="waPhoneId">WhatsApp phone number ID</Label>
          <Input
            id="waPhoneId"
            value={cfg.whatsappPhoneNumberId}
            onChange={(e) => setCfg({ ...cfg, whatsappPhoneNumberId: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="waToken">
            WhatsApp access token {config?.whatsappTokenSet ? "(saved — leave blank to keep)" : ""}
          </Label>
          <Input
            id="waToken"
            type="password"
            autoComplete="new-password"
            placeholder={config?.whatsappTokenSet ? "••••••••••••" : "EAAG..."}
            value={cfg.whatsappToken}
            onChange={(e) => setCfg({ ...cfg, whatsappToken: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Button
            variant="hero"
            className="rounded-full"
            disabled={saveConfig.isPending}
            onClick={() => saveConfig.mutate()}
          >
            Save owner & WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );

}
