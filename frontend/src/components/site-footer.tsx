import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Phone, ChefHat } from "lucide-react";
import { settingsQuery, API_BASE_URL } from "@/lib/db";
import { useState, useEffect } from "react";

// Instant fallback — never blocks paint
const BUSINESS_NAME = import.meta.env["VITE_BUSINESS_NAME"] ?? "Maa Tara Sweets";
const BUSINESS_PHONE = import.meta.env["VITE_BUSINESS_PHONE"] ?? "+91 99990 12031";

/** Pre-filled placeholder shown immediately on first render.
 *  Replaced transparently once the real API data arrives. */
const PLACEHOLDER_SETTINGS = {
  name: BUSINESS_NAME,
  tagline: "Freshly made sweets & Indian classics, served right at your seat.",
  address:
    "Opposite ICFAI University, Near Dhoni Farmhouse, Daladali Chowk, Ranchi – 835 222, Jharkhand",
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

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isBackendUp, setIsBackendUp] = useState(true);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    async function ping() {
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        setIsBackendUp(res.ok);
      } catch {
        setIsBackendUp(false);
      }
    }

    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, []);

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
          <h3 className="font-display text-base font-bold text-foreground">
            Contact & Location
          </h3>
          <a
            href="https://maps.app.goo.gl/Wc3uMz7K1z4XcoHL8"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 hover:text-foreground transition-colors"
          >
            <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            {s.address}
          </a>
          <a
            href={`tel:${s.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />
            {s.phone}
          </a>
          <p className="flex items-center gap-2 hover:text-foreground transition-colors">
            <Clock className="size-4 shrink-0 text-accent" aria-hidden="true" />
            {s.opening_time} – {s.closing_time}
          </p>
        </div>

        {/* Quick links column */}
        <div className="space-y-1">
          <h3 className="font-display text-base font-bold text-foreground mb-2">
            Quick Links
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link
              to="/menu"
              search={{ category: undefined }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Full menu
            </Link>
            <Link
              to="/my-orders"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              My orders &amp; invoices
            </Link>
            <Link
              to="/login"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              User login
            </Link>
            <Link
              to="/profile"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              My profile
            </Link>
            <Link
              to="/settings"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Display settings
            </Link>
            <Link
              to="/owner"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              About the owner
            </Link>
            <Link
              to="/scanner"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              QR scanner
            </Link>
            <Link
              to="/admin"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Administration
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-6 py-5 border-t border-border/40 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        {/* Left side: Network status */}
        <div className="flex items-center gap-2" title={isOnline ? "Online" : "Offline"}>
          <span className="relative flex size-2">
            {isOnline && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex size-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
            ></span>
          </span>
        </div>

        <p className="text-center">
          © {new Date().getFullYear()} {s.name}. All rights reserved.
        </p>

        {/* Right side: Backend status */}
        <div
          className="flex items-center gap-2"
          title={isBackendUp ? "Services OK" : "Services degraded"}
        >
          <span className="relative flex size-2">
            {!isBackendUp && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex size-2 rounded-full ${isBackendUp ? "bg-blue-500" : "bg-orange-500"}`}
            ></span>
          </span>
        </div>
      </div>
    </footer>
  );
}
