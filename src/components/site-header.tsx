import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, LayoutDashboard, Receipt, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { settingsQuery } from "@/lib/db";
import { useIsAdmin } from "@/lib/auth";

export function SiteHeader() {
  const { count, tableNumber } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const { isAdmin } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:justify-between sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <ChefHat className="size-5 text-primary-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold sm:text-lg">
              {settings?.name ?? "Shivansi"}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {tableNumber ? `Table ${tableNumber} • dine-in` : (settings?.tagline ?? "Restaurant & Sweet Shop")}
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/menu" search={{ category: undefined }}>
              <UtensilsCrossed className="size-4" /> Menu
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/my-orders">
              <Receipt className="size-4" /> My orders
            </Link>
          </Button>
          {isAdmin ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <LayoutDashboard className="size-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="hero" size="sm" className="relative">
            <Link to="/cart">
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 ? (
                <Badge variant="gold" className="absolute -right-2 -top-2 px-1.5 py-0 text-[10px]">
                  {count}
                </Badge>
              ) : null}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
