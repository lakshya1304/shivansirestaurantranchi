import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutGrid,
  Loader2,
  LogOut,
  Settings,
  Tag,
  Users,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/auth";
import { fetchAPI } from "@/lib/db";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner dashboard — Maa Tara Sweets" },
      { name: "description", content: "Manage live orders, menu, inventory, offers and reports." },
      { property: "og:title", content: "Owner dashboard — Maa Tara Sweets" },
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
  { to: "/admin/staff", label: "Staff", icon: ShieldCheck },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

/** Short synthesized chime so the kitchen hears every incoming order. */
function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
    setTimeout(() => void ctx.close(), 1500);
  } catch {
    /* audio unavailable */
  }
}

function AdminLayout() {
  const { isAdmin, mfaSatisfied, checking, user } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (checking) return;
    if (!user || !isAdmin || !mfaSatisfied) {
      navigate({ to: "/auth", search: { redir: pathname }, replace: true });
    }
  }, [checking, user, isAdmin, mfaSatisfied, navigate]);

  useEffect(() => {
    if (!isAdmin || !mfaSatisfied) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    // Poll for new orders every 30 s (Supabase realtime removed; backend is Fastify/Postgres)
    const interval = setInterval(() => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    }, 30_000);
    return () => clearInterval(interval);
  }, [isAdmin, mfaSatisfied, qc]);

  async function handleSignOut() {
    await qc.cancelQueries();
    try {
      await fetchAPI("/auth/logout", { method: "POST" });
    } catch { /* ignore network errors */ }
    // Wipe all cached data — especially the auth_me session — before navigating
    // so the admin guard doesn't see a stale "isAdmin:true" and redirect back.
    qc.clear();
    await qc.invalidateQueries({ queryKey: ["auth_me"] });
    navigate({ to: "/auth", replace: true });
  }

  if (checking) {
    return (
      <main className="grid min-h-[70vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!user || !isAdmin || !mfaSatisfied) {
    return <main className="min-h-[70vh]" aria-label="Checking owner access" />;
  }

  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <nav className="glass flex flex-nowrap gap-1 overflow-x-auto rounded-2xl p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto shrink-0"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </nav>
        <Outlet />
      </div>
    </main>
  );
}
