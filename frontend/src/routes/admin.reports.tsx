import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ordersQuery, productsQuery, settingsQuery } from "@/lib/db";
import { isToday, money } from "@/lib/format";

export const Route = createFileRoute("/admin/reports")({
  component: Reports,
});

function Reports() {
  const { data: orders = [] } = useQuery(ordersQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const { data: settings } = useQuery(settingsQuery);
  const currency = settings?.currency ?? "₹";

  const valid = orders.filter((o) => o.status !== "rejected");
  const today = valid.filter((o) => isToday(o.created_at));
  const revenue = (list: typeof valid) =>
    list.reduce((sum, o) => sum + Number(o.total), 0);
  const week = valid.filter(
    (o) => Date.now() - new Date(o.created_at).getTime() < 7 * 864e5,
  );
  const month = valid.filter(
    (o) => Date.now() - new Date(o.created_at).getTime() < 30 * 864e5,
  );

  const counts = new Map<string, { name: string; qty: number; total: number }>();
  for (const order of valid) {
    for (const item of order.order_items ?? []) {
      const current = counts.get(item.name) ?? { name: item.name, qty: 0, total: 0 };
      current.qty += item.quantity;
      current.total += Number(item.line_total);
      counts.set(item.name, current);
    }
  }
  const top = [...counts.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-xl font-bold">Reports</h2>
        <p className="text-sm text-muted-foreground">
          Sales performance and best sellers.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="Today"
          value={money(revenue(today), currency)}
          hint={`${today.length} orders`}
        />
        <Card
          label="Last 7 days"
          value={money(revenue(week), currency)}
          hint={`${week.length} orders`}
        />
        <Card
          label="Last 30 days"
          value={money(revenue(month), currency)}
          hint={`${month.length} orders`}
        />
        <Card
          label="Average bill"
          value={money(valid.length ? revenue(valid) / valid.length : 0, currency)}
          hint={`${products.length} menu items`}
        />
      </section>

      <section className="glass overflow-x-auto rounded-3xl p-4">
        <h3 className="mb-3 font-display text-lg font-bold">Top sellers</h3>
        <table className="w-full min-w-[480px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty sold</th>
              <th className="py-2 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {top.map((row) => (
              <tr key={row.name} className="border-t border-border/60">
                <td className="py-2">{row.name}</td>
                <td className="py-2 text-center">{row.qty}</td>
                <td className="py-2 text-right">{money(row.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="glass card-3d hover:card-3d-hover rounded-3xl p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
