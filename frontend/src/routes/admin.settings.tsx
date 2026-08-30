import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAppConfig,
  getOwnerSettings,
  saveAppConfig,
  saveOwnerSettings,
} from "@/lib/config.functions";
import { useIsAdmin } from "@/lib/auth";

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
  const qc = useQueryClient();
  const { isSuperAdmin } = useIsAdmin();
  const { data: settings } = useQuery({
    queryKey: ["owner-settings"],
    queryFn: () => getOwnerSettings(),
  });
  const [form, setForm] = useState<Record<string, unknown>>({});

  const save = useMutation({
    mutationFn: () => {
      const data = Object.fromEntries(
        FIELDS.map((f) => [
          f.key,
          f.type === "number" ? Number(form[f.key] ?? 0) : String(form[f.key] ?? ""),
        ]),
      ) as any;
      data.is_suspended = Boolean(form["is_suspended"]);
      return saveOwnerSettings(data);
    },
    onSuccess: () => {
      toast.success("Settings saved");
      void qc.invalidateQueries({ queryKey: ["owner-settings"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: any) =>
      toast.error(e?.message ?? e?.toString() ?? "Could not save settings"),
  });

  const { data: config } = useQuery({
    queryKey: ["app-config"],
    queryFn: () => getAppConfig(),
  });
  const [cfg, setCfg] = useState({
    ownerEmail: "",
    whatsappPhoneNumberId: "",
    whatsappToken: "",
  });

  const saveConfig = useMutation({
    mutationFn: () => saveAppConfig(cfg),
    onSuccess: () => {
      toast.success("Owner & WhatsApp settings saved");
      setCfg((c) => ({ ...c, whatsappToken: "" }));
      void qc.invalidateQueries({ queryKey: ["app-config"] });
    },
    onError: (e: any) =>
      toast.error(e?.message ?? e?.toString() ?? "Could not save config"),
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

  if (!isSuperAdmin) {
    return (
      <div className="glass mt-12 rounded-3xl p-12 text-center">
        <h2 className="font-display text-xl font-bold">Access Denied</h2>
        <p className="mt-2 text-muted-foreground">
          Only Superadmins can access restaurant settings.
        </p>
      </div>
    );
  }

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
              placeholder={`Enter ${field.label.toLowerCase()}`}
              value={String(form[field.key] ?? "")}
              onChange={(e) =>
                setForm({
                  ...form,
                  [field.key]:
                    field.type === "number" ? Number(e.target.value) : e.target.value,
                })
              }
            />
          </div>
        ))}
        <div className="sm:col-span-2 mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-destructive">
                Emergency Shutdown
              </h3>
              <p className="text-sm text-muted-foreground text-destructive/80">
                Turn this on to shut down the app for all customers (e.g., maintenance or
                payment required).
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={Boolean(form["is_suspended"])}
                onChange={(e) => setForm({ ...form, is_suspended: e.target.checked })}
              />
              <div className="peer h-6 w-11 rounded-full bg-border after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-destructive peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-destructive/30 dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
          </div>
        </div>

        <div className="sm:col-span-2 mt-2">
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
          <h3 className="font-display text-lg font-bold">Location & Map View</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Verify your restaurant's location on Google Maps.
          </p>
          <div className="w-full h-[300px] overflow-hidden rounded-xl border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14656.786566418934!2d85.253683!3d23.3639423!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4e04778be81bd%3A0xc3b8a36270b2011b!2sDaladali%20Chowk!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>

      <div className="glass grid gap-4 rounded-3xl p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h3 className="font-display text-lg font-bold">Owner & WhatsApp bot</h3>
          <p className="text-sm text-muted-foreground">
            Add your WhatsApp Cloud API credentials here — order updates start sending
            automatically once saved.
          </p>
        </div>
        <div>
          <Label htmlFor="ownerEmail">Owner email</Label>
          <Input
            id="ownerEmail"
            type="email"
            placeholder="Enter your email address"
            value={cfg.ownerEmail}
            onChange={(e) => setCfg({ ...cfg, ownerEmail: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="waPhoneId">WhatsApp phone number ID</Label>
          <Input
            id="waPhoneId"
            placeholder="Enter WhatsApp phone number ID"
            value={cfg.whatsappPhoneNumberId}
            onChange={(e) => setCfg({ ...cfg, whatsappPhoneNumberId: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="waToken">
            WhatsApp access token{" "}
            {config?.whatsappTokenSet ? "(saved — leave blank to keep)" : ""}
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
