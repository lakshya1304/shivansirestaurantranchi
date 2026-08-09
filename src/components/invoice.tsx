import { money, formatDateTime } from "@/lib/format";

type InvoiceOrder = {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  table_number: number | null;
  is_takeaway: boolean;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  discount_amount: number;
  loyalty_discount: number;
  tax_amount: number;
  packing_charge: number;
  delivery_charge: number;
  total: number;
  coupon_code: string | null;
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    weight_label: string | null;
  }>;
};

type InvoiceSettings = {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  gst_number?: string | null;
  currency?: string | null;
  tax_percent?: number | null;
} | null;

export function Invoice({ order, settings }: { order: InvoiceOrder; settings: InvoiceSettings }) {
  const currency = settings?.currency ?? "₹";

  return (
    <div id="invoice" className="glass rounded-3xl p-6 print:bg-white print:text-black">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="font-display text-xl font-bold">{settings?.name ?? "Shivansi"}</h2>
          <p className="text-xs text-muted-foreground">{settings?.address}</p>
          <p className="text-xs text-muted-foreground">{settings?.phone}</p>
          {settings?.gst_number ? (
            <p className="text-xs text-muted-foreground">GSTIN {settings.gst_number}</p>
          ) : null}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="font-mono text-sm text-foreground">{order.order_number}</p>
          <p>{formatDateTime(order.created_at)}</p>
          <p>{order.is_takeaway ? "Takeaway" : `Table ${order.table_number ?? "-"}`}</p>
          <p>
            {order.payment_method} • {order.payment_status}
          </p>
        </div>
      </header>

      <div className="py-3 text-xs text-muted-foreground">
        Billed to <span className="text-foreground">{order.customer_name}</span> • {order.customer_phone}
      </div>

      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="py-2">Item</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item) => (
            <tr key={item.id} className="border-t border-border/60">
              <td className="py-2">
                {item.product_name}
                {item.weight_label ? (
                  <span className="text-xs text-muted-foreground"> ({item.weight_label})</span>
                ) : null}
              </td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right">{money(item.unit_price, currency)}</td>
              <td className="py-2 text-right">{money(item.line_total, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
        <Line label="Subtotal" value={money(order.subtotal, currency)} />
        {order.discount_amount > 0 ? (
          <Line
            label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
            value={`-${money(order.discount_amount, currency)}`}
          />
        ) : null}
        {order.loyalty_discount > 0 ? (
          <Line label="Loyalty reward" value={`-${money(order.loyalty_discount, currency)}`} />
        ) : null}
        <Line label={`GST (${settings?.tax_percent ?? 0}%)`} value={money(order.tax_amount, currency)} />
        {order.packing_charge > 0 ? (
          <Line label="Packing" value={money(order.packing_charge, currency)} />
        ) : null}
        {order.delivery_charge > 0 ? (
          <Line label="Delivery" value={money(order.delivery_charge, currency)} />
        ) : null}
        <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-bold">
          <span>Total</span>
          <span>{money(order.total, currency)}</span>
        </div>
      </dl>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Thank you for dining with us. Please visit again!
      </p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
