import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gift, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/components/invoice";
import { SiteFooter } from "@/components/site-footer";
import { getOrdersByPhone } from "@/lib/orders.functions";
import { STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { formatDateTime, money } from "@/lib/format";

export const Route = createFileRoute("/my-orders")({
  head: () => ({
    meta: [
      { title: "My orders & loyalty — Shivansi Restaurant & Sweet Shop" },
      {
        name: "description",
        content: "Look up your past Shivansi orders, download invoices and check your loyalty points.",
      },
      { property: "og:title", content: "My orders & loyalty — Shivansi" },
      { property: "og:description", content: "Past orders, invoices and loyalty points at Shivansi." },
    ],
  }),
  component: MyOrders;
});

function MyOrders() {
  const lookup = useServerFn(getOrdersByPhone);
  const [phone, setPhone] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (value: string) => lookup({ data: { phone: value } }),
    onError: () => toast.error("Enter a valid phone number"),
  });

  const result = mutation.data;

  return (
    <main className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">My orders</h1>
          <p className="text-sm text-muted-foreground">
            Enter the phone number you used at checkout to see your history, invoices and rewards.
          </p>
        </header>

        <form
          className="glass flex flex-wrap items-end gap-3 rounded-3xl p-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(phone.trim());
          }}
        >
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              maxLength={16}
            />
          </div>
          <Button type="submit" variant="hero" className="rounded-full" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Find my orders
          </Button>
        </form>

        {mutation.isSuccess && !result ? (
          <p className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
            No orders found for that number yet.{" "}
            <Link to="/menu" className="text-accent underline">
              Start an order
            </Link>
            .
          </p>
        ) : null}

        {result ? (
          <>
            <section className="glass grid gap-4 rounded-3xl p-6 sm:grid-cols-3">
              <Stat label="Guest" value={result.customer.name} />
              <Stat label="Total orders" value={String(result.customer.total_orders)} />
              <Stat
                label="Loyalty points"
                value={String(result.customer.loyalty_points)}
                hint={<Gift className="size-4 text-accent" />}
              />
            </section>

            <section className="space-y-3">
              {result.orders.map((order) => {
                const typed = order as never as Parameters<typeof Invoice>[0]["order"] & {
                  id: string;
                  status: OrderStatus;
                };
                return (
                  <article key={typed.id} className="glass rounded-3xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm">{typed.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(typed.created_at)} •{" "}
                          {typed.is_takeaway ? "Takeaway" : `Table ${typed.table_number ?? "-"}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={typed.status === "rejected" ? "destructive" : "glass"}>
                          {STATUS_LABEL[typed.status]}
                        </Badge>
                        <span className="font-display font-bold">{money(typed.total)}</span>
                        <Button
                          variant="glass"
                          size="sm"
                          className="rounded-full"
                          onClick={() => setOpenId(openId === typed.id ? null : typed.id)}
                        >
                          {openId === typed.id ? "Hide bill" : "View bill"}
                        </Button>
                      </div>
                    </div>
                    {openId === typed.id ? (
                      <div className="mt-4">
                        <Invoice order={typed} settings={null} />
                      </div>
                    ) : null}
                  </article>
                );
              })}
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
