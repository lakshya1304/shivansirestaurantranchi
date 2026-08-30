import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareWarning, Star, Trash2, ShieldCheck } from "lucide-react";
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

  async function deleteReview(review: Review) {
    if (
      !confirm(
        `Delete this review by "${review.customer_name}"?\n\nThis should only be used for spam or abusive content. This cannot be undone.`,
      )
    )
      return;
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

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  // Reviews from the last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyReviews = reviews.filter(
    (r) => new Date(r.created_at) >= weekAgo,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h2 className="font-display text-xl font-bold">Customer Reviews</h2>
        <p className="text-sm text-muted-foreground">
          All reviews are shown automatically to customers — no manual
          approval. You may only remove spam or abusive content.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Badge variant="gold">{reviews.length} total reviews</Badge>
          <Badge variant="glass">⭐ {avgRating} avg rating</Badge>
          <Badge variant="glass">{weeklyReviews.length} this week</Badge>
        </div>
      </header>

      {/* Transparency notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Genuine Review Policy
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All customer reviews are displayed automatically without admin
            approval to ensure transparency. The delete button should only be
            used for spam, offensive, or clearly fake content.
          </p>
        </div>
      </div>

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
              className="glass animate-rise rounded-3xl p-5"
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
                    <span className="text-xs font-semibold text-foreground">
                      {review.customer_name}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(review.created_at)}
                    </span>
                  </div>

                  {/* Comment */}
                  {review.comment ? (
                    <p className="mt-2 text-sm text-foreground leading-relaxed">
                      "{review.comment}"
                    </p>
                  ) : (
                    <p className="mt-2 text-xs italic text-muted-foreground">
                      Rating only — no written comment.
                    </p>
                  )}
                </div>

                {/* Actions — delete only for spam/abuse */}
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="glass"
                    className="rounded-full gap-1.5 text-destructive hover:bg-destructive/10"
                    disabled={busy === review.id}
                    onClick={() => deleteReview(review)}
                    title="Delete spam or abusive review"
                  >
                    <Trash2 className="size-3.5" />
                    <MessageSquareWarning className="size-3.5" />
                    Remove spam
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
