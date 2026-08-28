import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye, EyeOff, Gift, LogOut, Loader2,
  MessageCircle, ShieldCheck, UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Invoice } from "@/components/invoice";
import { SiteFooter } from "@/components/site-footer";
import { STATUS_LABEL, type Order } from "@/lib/types";
import { formatDateTime, money } from "@/lib/format";
import { saveCustomerSession, getCustomerSession, clearCustomerSession } from "./login";
import { fetchAPI } from "@/lib/db";
import { WhatsAppLoginForm } from "@/components/whatsapp-login-form";

export const Route = createFileRoute("/my-orders")({
  head: () => ({
    meta: [
      { title: "My orders & loyalty — Maa Tara Sweets" },
      {
        name: "description",
        content: "Look up your past Maa Tara Sweets orders, download invoices and check your loyalty points.",
      },
      { property: "og:title", content: "My orders & loyalty — Maa Tara Sweets" },
      { property: "og:description", content: "Past orders, invoices and loyalty points at Maa Tara Sweets." },
    ],
  }),
  component: MyOrders,
});

// ── Shared login success type ──────────────────────────────────────────────
type LoginSuccessPayload = {
  customer: any;
  profileToken: string;
  phone: string;
};

// ── Email/Password login form ──────────────────────────────────────────────
function EmailLoginForm({ onSuccess }: { onSuccess: (data: LoginSuccessPayload) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetchAPI<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        headers: { "Content-Type": "application/json" },
      });
      const user = res?.data ?? res;
      const phone = user?.phone ?? email;
      const profileToken = user?.profileToken ?? user?.token ?? "";
      const customer = {
        name: user?.name ?? user?.email ?? email,
        visits: user?.visits ?? 0,
        reward_points: user?.reward_points ?? 0,
        ...user,
      };
      onSuccess({ customer, profileToken, phone });
    } catch (error: any) {
      toast.error(error?.message ?? error?.toString() ?? "Sign in failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="orders-email">Email</Label>
        <Input
          id="orders-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label htmlFor="orders-password">Password</Label>
        <div className="relative">
          <Input
            id="orders-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex h-full items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" variant="hero" className="w-full rounded-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} View my orders
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        For staff and registered email accounts.
      </p>
    </form>
  );
}

// ── Tabbed login panel (WhatsApp + Email) ──────────────────────────────────
function OrdersLoginPanel({ onSuccess }: { onSuccess: (data: LoginSuccessPayload) => void }) {
  const [tab, setTab] = useState<"whatsapp" | "email">("whatsapp");

  return (
    <div className="glass rounded-3xl p-6 space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-2xl bg-background/40 p-1">
        <button
          type="button"
          id="orders-tab-whatsapp"
          onClick={() => setTab("whatsapp")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors ${tab === "whatsapp"
              ? "bg-(image:--gradient-primary) text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </button>
        <button
          type="button"
          id="orders-tab-email"
          onClick={() => setTab("email")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors ${tab === "email"
              ? "bg-(image:--gradient-primary)text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <ShieldCheck className="size-4" />
          Email
        </button>
      </div>

      {/* Tab content */}
      {tab === "whatsapp" && (
        <WhatsAppLoginForm onSuccess={onSuccess} submitLabel="Verify & view my orders" />
      )}
      {tab === "email" && (
        <EmailLoginForm onSuccess={onSuccess} />
      )}
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────────────
function MyOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const customerSession = getCustomerSession();

  const { data: result, isLoading } = useQuery({
    queryKey: ["customer-profile", customerSession?.phone],
    queryFn: async () => {
      if (!customerSession) return null;
      const res = await fetchAPI<any>(
        `/customer-profile?phone=${encodeURIComponent(customerSession.phone)}&token=${encodeURIComponent(customerSession.profileToken)}`,
      );
      return res as { customer: any; orders: Order[] };
    },
    enabled: !!customerSession,
    retry: false,
  });

  function handleLoginSuccess({ customer, profileToken, phone }: LoginSuccessPayload) {
    saveCustomerSession({ phone, name: customer.name ?? phone, profileToken });
    toast.success(`Welcome back, ${customer.name ?? ""}!`);
    void queryClient.invalidateQueries({ queryKey: ["customer-profile", phone] });
  }

  function handleSignOut() {
    clearCustomerSession();
    navigate({ to: "/login", replace: true });
    toast.success("Signed out");
  }

  return (
    <main className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">My orders</h1>
            {!customerSession && (
              <p className="text-sm text-muted-foreground">
                Sign in to view your order history, invoices and loyalty rewards.
              </p>
            )}
          </div>
          {customerSession && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">📱 {customerSession.phone}</span>
              <Button variant="glass" size="sm" className="rounded-full" onClick={handleSignOut}>
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          )}
        </header>

        {/* Unauthenticated: WhatsApp / Email tabbed login */}
        {!customerSession && (
          <OrdersLoginPanel onSuccess={handleLoginSuccess} />
        )}

        {/* Loading state */}
        {customerSession && isLoading && (
          <div className="glass flex items-center justify-center gap-3 rounded-3xl p-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading your orders…</p>
          </div>
        )}

        {/* Authenticated: order results */}
        {result ? (
          <>
            {/* Profile banner */}
            <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-3xl px-5 py-4">
              <div className="flex items-center gap-3">
                <UserCircle2 className="size-5 text-accent shrink-0" />
                <p className="text-sm">
                  <span className="font-medium">View your full profile</span>{" "}
                  <span className="text-muted-foreground">— edit your name, birthday & address.</span>
                </p>
              </div>
              <Link to="/profile">
                <Button variant="hero" size="sm" className="rounded-full">
                  My profile →
                </Button>
              </Link>
            </div>

            {/* Loyalty stats */}
            <section className="glass grid gap-4 rounded-3xl p-6 sm:grid-cols-3">
              <Stat label="Guest" value={result.customer.name} />
              <Stat label="Visits" value={String(result.customer.visits)} />
              <Stat
                label="Loyalty points"
                value={String(result.customer.reward_points)}
                hint={<Gift className="size-4 text-accent" />}
              />
            </section>

            {/* Empty state */}
            {result.orders.length === 0 && (
              <p className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
                No orders found yet.{" "}
                <Link to="/menu" search={{ category: undefined }} className="text-accent underline">
                  Start an order
                </Link>
                .
              </p>
            )}

            {/* Order list */}
            <section className="space-y-3">
              {result.orders.map((order: any) => (
                <article key={order.id} className="glass rounded-3xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.created_at)} •{" "}
                        {order.table_number == null ? "Takeaway" : `Table ${order.table_number}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={order.status === "rejected" ? "destructive" : "glass"}>
                        {STATUS_LABEL[order.status as keyof typeof STATUS_LABEL]}
                      </Badge>
                      <span className="font-display font-bold">{money(order.total)}</span>
                      <Button
                        variant="glass"
                        size="sm"
                        className="rounded-full"
                        onClick={() => setOpenId(openId === order.id ? null : order.id)}
                      >
                        {openId === order.id ? "Hide bill" : "View bill"}
                      </Button>
                    </div>
                  </div>
                  {openId === order.id && (
                    <div className="mt-4">
                      <Invoice order={order} settings={null} />
                    </div>
                  )}
                </article>
              ))}
            </section>
          </>
        ) : null}

      </div>
      <SiteFooter />
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {label} {hint}
      </p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
