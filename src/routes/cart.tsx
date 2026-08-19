import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { productImage } from "@/lib/images";
import { settingsQuery, tablesQuery } from "@/lib/db";
import { placeOrder } from "@/lib/orders.functions";
import { PAYMENT_METHODS } from "@/lib/types";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Shivansi Restaurant & Sweet Shop" },
      { name: "description", content: "Review your items, apply a coupon and place your order at Shivansi." },
      { property: "og:title", content: "Your cart — Shivansi Restaurant & Sweet Shop" },
      { property: "og:description", content: "Review your order and check out at Shivansi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, increment, decrement, remove, tableNumber, tableSource, setTableNumber, clear } =
    useCart();
  const { data: settings } = useQuery(settingsQuery);
  const { data: tables = [] } = useQuery(tablesQuery);
  const navigate = useNavigate();
  const submitOrder = useServerFn(placeOrder);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState(PAYMENT_METHODS[0]!);
  const [takeaway, setTakeaway] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tableInput, setTableInput] = useState("");

  const scanned = tableSource === "qr" && tableNumber != null;
  const activeTables = tables.filter((t) => t.is_active);
  const effectiveTable = takeaway ? null : (tableNumber ?? (tableInput ? Number(tableInput) : null));

  const currency = settings?.currency ?? "₹";
  const packing = takeaway ? Number(settings?.packing_charge ?? 0) : 0;
  const delivery = takeaway ? Number(settings?.delivery_charge ?? 0) : 0;
  const estTax = ((subtotal * Number(settings?.tax_percent ?? 0)) / 100) | 0;
  const estTotal = subtotal + estTax + packing + delivery;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (lines.length === 0) return;
    if (name.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (!/^[0-9+\-\s]{8,16}$/.test(phone.trim())) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!takeaway && (!effectiveTable || effectiveTable < 1)) {
      toast.error("Please select your table number so we know where to serve");
      return;
    }
    if (!takeaway && effectiveTable && !scanned) setTableNumber(effectiveTable, "manual");

    setSubmitting(true);
    try {
      const result = await submitOrder({
        data: {
          tableNumber: takeaway ? null : effectiveTable,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          paymentMethod: payment,
          couponCode: coupon.trim() ? coupon.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
          isTakeaway: takeaway,
          lines: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            weightLabel: l.weightLabel,
            weightGrams: l.weightGrams,
            instructions: l.instructions,
          })),
        },
      });
      clear();
      toast.success(`Order ${result.orderNumber} sent to the kitchen`);
      navigate({ to: "/order/$orderId", params: { orderId: result.id }, search: { t: result.token } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place the order");
    } finally {
      setSubmitting(false);
    }
  }


  if (lines.length === 0) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <div className="glass rounded-3xl px-10 py-14 text-center">
          <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add something delicious to get started.</p>
          <Button asChild variant="hero" className="mt-6 rounded-full">
            <Link to="/menu" search={{ category: undefined }}>Browse the menu</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-bold">Your cart</h1>
            {tableNumber && !takeaway ? (
              <Badge variant="gold">
                Table {tableNumber} {scanned ? "• QR scanned" : "• entered manually"}
              </Badge>
            ) : null}

          </header>

          {lines.map((line) => (
            <article key={line.key} className="glass flex gap-4 rounded-3xl p-4">
              <img
                src={productImage(line.imageUrl)}
                alt={line.name}
                loading="lazy"
                className="size-20 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{line.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {line.weightLabel ? `${line.weightLabel} • ` : ""}
                      {money(line.unitPrice, currency)} each
                    </p>
                    {line.instructions.length ? (
                      <p className="mt-1 text-[11px] text-accent">{line.instructions.join(", ")}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.key)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${line.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="glass" className="size-8" onClick={() => decrement(line.key)}>
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                    <Button size="icon" variant="glass" className="size-8" onClick={() => increment(line.key)}>
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <span className="font-display font-bold">
                    {money(line.unitPrice * line.quantity, currency)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>

        <form onSubmit={handleSubmit} className="glass h-fit space-y-4 rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold">Checkout</h2>

          <div className="grid gap-3">
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                maxLength={16}
                required
              />
            </div>
            <div>
              <Label htmlFor="coupon">Coupon code (optional)</Label>
              <Input
                id="coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="DIWALI25"
                maxLength={30}
              />
            </div>
            <div>
              <Label htmlFor="notes">Note for the kitchen (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={300}
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border p-3">
            <div>
              <p className="text-sm font-medium">Takeaway / parcel</p>
              <p className="text-xs text-muted-foreground">Adds packing and delivery charges</p>
            </div>
            <Switch checked={takeaway} onCheckedChange={setTakeaway} />
          </div>

          <div>
            <Label>Payment method</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPayment(method)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    payment === method ? "border-primary bg-primary/20" : "border-border text-muted-foreground"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            {payment !== "Cash" && payment !== "Card" && settings?.upi_id ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Pay to UPI ID <span className="font-mono text-accent">{settings.upi_id}</span>
              </p>
            ) : null}
          </div>

          <dl className="space-y-1.5 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={money(subtotal, currency)} />
            <Row label={`GST (${settings?.tax_percent ?? 0}%)`} value={money(estTax, currency)} />
            {packing > 0 ? <Row label="Packing" value={money(packing, currency)} /> : null}
            {delivery > 0 ? <Row label="Delivery" value={money(delivery, currency)} /> : null}
            <div className="flex justify-between pt-2 font-display text-lg font-bold">
              <span>Estimated total</span>
              <span>{money(estTotal, currency)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Discounts and loyalty rewards are applied automatically on the final bill.
            </p>
          </dl>

          <Button type="submit" variant="hero" size="lg" className="w-full rounded-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Place order
          </Button>
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
