import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { customersQuery, reviewsQuery } from "@/lib/db";
import { useDeleteRow, useSaveRow } from "@/lib/admin";
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersManager,
});

function CustomersManager() {
  const { data: customers = [] } = useQuery(customersQuery);
  const { data: reviews = [] } = useQuery(reviewsQuery);
  const saveReview = useSaveRow("reviews", "reviews", "Review updated");
  const deleteReview = useDeleteRow("reviews", "reviews");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">Customers & loyalty</h2>
        <div className="glass overflow-x-auto rounded-3xl p-4">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Phone</th>
                <th className="py-2 text-center">Visits</th>
                <th className="py-2 text-center">Points</th>
                <th className="py-2 text-right">Total spend</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2 text-muted-foreground">{c.phone}</td>
                  <td className="py-2 text-center">{c.visits}</td>
                  <td className="py-2 text-center">{c.reward_points}</td>
                  <td className="py-2 text-right">{money(c.total_spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">Reviews</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {r.customer_name} • {r.rating}★
                  </p>
                  <p className="text-sm text-muted-foreground">{r.comment}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={r.is_published}
                    onCheckedChange={(v) =>
                      saveReview.mutate({ id: r.id, is_published: v })
                    }
                  />
                  <Button
                    size="icon"
                    variant="glass"
                    className="size-8 rounded-full"
                    onClick={() => deleteReview.mutate(r.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
