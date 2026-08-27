import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Phone, ChefHat } from "lucide-react";
import { settingsQuery } from "@/lib/db";

// Instant fallback — never blocks paint
const BUSINESS_NAME = import.meta.env.VITE_BUSINESS_NAME ?? "Maa Tara Sweets";
const BUSINESS_PHONE = import.meta.env.VITE_BUSINESS_PHONE ?? "+91 99990 12031";

/** Pre-filled placeholder shown immediately on first render.
 *  Replaced transparently once the real API data arrives. */
const PLACEHOLDER_SETTINGS = {
  name: "Maa Tara Sweets",
  tagline: "Freshly made sweets & Indian classics, served right at your seat.",
  address: "Opposite ICFAI University, Near Dhoni Farmhouse, Daladali Chowk, Ranchi – 835 222, Jharkhand",
  phone: BUSINESS_PHONE,
  opening_time: "07:00 AM",
  closing_time: "09:30 PM",
} as const;

export function SiteFooter() {
  const { data: settings } = useQuery({
    ...settingsQuery,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Merge: real data wins, placeholder fills any missing field instantly
  const s = { ...PLACEHOLDER_SETTINGS, ...settings };

  return (
    <footer className="mt-20 border-t border-border/40 bg-background/50 relative overflow-hidden">
      {/* Top gradient glow — decorative, doesn't affect render */}
      <div
        className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 h-64 w-[800px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "var(--gradient-aurora)", opacity: 0.15 }}
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-12 pb-6 sm:px-6 md:grid-cols-3 relative z-10">
        {/* Brand column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-2xl"
              style={{ background: "var(--gradient-primary)" }}
              aria-hidden="true"
            >
              <ChefHat className="size-5 text-primary-foreground" />
            </span>
            <h2 className="font-display text-xl font-bold gradient-text">{s.name}</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.tagline}</p>
        </div>

        {/* Contact column */}
        <div className="space-y-3 text-sm text-muted-foreground">
          <h3 className="font-display text-base font-bold text-foreground">Contact & Location</h3>
          <p className="flex items-start gap-2 hover:text-foreground transition-colors">
            <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            {s.address}
          </p>
          <p className="flex items-center gap-2 hover:text-foreground transition-colors">
            <Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />
            {s.phone}
          </p>
          <p className="flex items-center gap-2 hover:text-foreground transition-colors">
            <Clock className="size-4 shrink-0 text-accent" aria-hidden="true" />
            {s.opening_time} – {s.closing_time}
          </p>
        </div>

        {/* Quick links column */}
        <div className="flex flex-col gap-3 text-sm">
          <h3 className="font-display text-base font-bold text-foreground">Quick Links</h3>
          <Link to="/menu" search={{ category: undefined }} className="w-fit text-muted-foreground hover:text-primary transition-colors">
            Full menu
          </Link>
          <Link to="/my-orders" className="w-fit text-muted-foreground hover:text-primary transition-colors">
            My orders & invoices
          </Link>
          <Link to="/settings" className="w-fit text-muted-foreground hover:text-primary transition-colors">
            Display settings
          </Link>
          <Link to="/auth" className="w-fit text-muted-foreground hover:text-primary transition-colors">
            Owner login
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-6 py-5 border-t border-border/40 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {s.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
