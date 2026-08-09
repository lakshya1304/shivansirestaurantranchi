import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutGrid,
  Loader2,
  Settings,
  Tag,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner dashboard — Shivansi Restaurant & Sweet Shop" },
      { name: "description", content: "Manage live orders, menu, inventory, offers and reports." },
      { property: "og:title", content: "Owner dashboard — Shivansi" },
      { property: "og:description", content: "Manage the restaurant from one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Live orders", icon: ClipboardList },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/offers", label: "Offers & loyalty", icon: Tag },
  { to: "/admin/tables", label: "Tables & QR", icon: LayoutGrid },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { isAdmin, checking } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void qc.invalidateQueries({ queryKey: ["orders"] });
        void qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, qc]);

  if (checking) {
    return (
      <main className="grid min-h-[70vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <div className="glass rounded-3xl p-10 text-center">
          <h1 className="font-display text-2xl font-bold">Owner access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your owner account to open the dashboard.
          </p>
          <Button asChild variant="hero" className="mt-6 rounded-full">
            <Link to="/auth">Go to owner login</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <nav className="glass flex gap-1 overflow-x-auto rounded-2xl p-1.5">
          {NAV.map((item) => {
            const active = item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Outlet />
      </div>
    </main>
  );
}
