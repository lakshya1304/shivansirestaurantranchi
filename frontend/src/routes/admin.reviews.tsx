import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { allReviewsQuery, fetchAPI } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { Review } from "@/lib/types";

export const Route = createFileRoute("/admin/reviews")({
  component: ReviewsManager,
});

function ReviewsManager() {
  const { data: reviews = [], isLoading } = useQuery(allReviewsQuery);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  async function togglePublish(review: Review) {
    setBusy(review.id);
    try {
      await fetchAPI(`/reviews/${review.id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ is_published: !review.is_published }),
        headers: { "Content-Type": "application/json" },
      });
      toast.success(review.is_published ? "Review hidden from homepage" : "Review published to homepage ✓");
      void qc.invalidateQueries({ queryKey: ["reviews"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update review");
    } finally {
      setBusy(null);
    }
  }

  async function deleteReview(review: Review) {
    if (!confirm(`Delete this review by "${review.customer_name}"? This cannot be undone.`)) return;
    setBusy(review.id);
    try {
      await fetchAPI(`/crud/reviews/${review.id}`, { method: "DELETE" });
      toast.success("Review deleted");
      void qc.invalidateQueries({ queryKey: ["reviews"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not delete review");
    } finally {
      setBusy(null);
    }
  }

  const published = reviews.filter((r) => r.is_published);
  const pending = reviews.filter((r) => !r.is_published);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h2 className="font-display text-xl font-bold">Customer Reviews</h2>
        <p className="text-sm text-muted-foreground">
          Published reviews appear on the homepage. Toggle visibility or delete reviews below.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Badge variant="gold">{published.length} published</Badge>
          <Badge variant="glass">{pending.length} pending</Badge>
        </div>
      </header>

      {isLoading ? (
        <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground animate-pulse">
          Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">
          No reviews yet. They'll appear here once customers submit them.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className={`glass animate-rise rounded-3xl p-5 transition-opacity ${
                review.is_published ? "" : "opacity-70"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Stars */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3.5 ${i < review.rating ? "fill-current" : "opacity-20"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{review.customer_name}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(review.created_at)}</span>
                    {review.is_published ? (
                      <Badge variant="gold" className="ml-1 text-[10px] px-1.5 py-0">Live</Badge>
                    ) : (
                      <Badge variant="glass" className="ml-1 text-[10px] px-1.5 py-0">Hidden</Badge>
                    )}
                  </div>

                  {/* Comment */}
                  {review.comment ? (
                    <p className="mt-2 text-sm text-foreground leading-relaxed">"{review.comment}"</p>
                  ) : (
                    <p className="mt-2 text-xs italic text-muted-foreground">No written comment.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant={review.is_published ? "glass" : "hero"}
                    className="rounded-full gap-1.5"
                    disabled={busy === review.id}
                    onClick={() => togglePublish(review)}
                  >
                    {review.is_published ? (
                      <>
                        <EyeOff className="size-3.5" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" /> Publish
                      </>
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="glass"
                    className="size-8 rounded-full"
                    disabled={busy === review.id}
                    onClick={() => deleteReview(review)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
