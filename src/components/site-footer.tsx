import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Phone } from "lucide-react";
import { settingsQuery } from "@/lib/db";

export function SiteFooter() {
  const { data: settings } = useQuery(settingsQuery);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-20 border-t border-border/60 py-10">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3">
        <div>
          <h2 className="font-display text-lg font-bold">{settings?.name ?? "Shivansi"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{settings?.tagline}</p>
          {settings?.gst_number ? (
            <p className="mt-3 text-xs text-muted-foreground">GSTIN {settings.gst_number}</p>
          ) : null}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" /> {settings?.address}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-4 shrink-0" /> {settings?.phone}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" /> {settings?.opening_time} – {settings?.closing_time}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/menu" className="text-muted-foreground transition-colors hover:text-foreground">
            Full menu
          </Link>
          <Link to="/my-orders" className="text-muted-foreground transition-colors hover:text-foreground">
            My orders & invoices
          </Link>
          <Link to="/auth" className="text-muted-foreground transition-colors hover:text-foreground">
            Owner login
          </Link>
        </div>
      </div>
    </footer>
  );
}
