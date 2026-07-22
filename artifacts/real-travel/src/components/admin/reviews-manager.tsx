import { Eye, EyeOff, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Review } from "@/lib/shared-travel-data";

export function ReviewsManager({
  reviews,
  onSave
}: {
  reviews: Review[];
  onSave: (next: Review[]) => Promise<void> | void;
}) {
  const sorted = [...reviews].sort((a, b) => a.sortOrder - b.sortOrder);

  const update = (id: string, patch: Partial<Review>) =>
    onSave(sorted.map((review) => (review.id === id ? { ...review, ...patch } : review)));

  const add = () =>
    onSave([
      ...sorted,
      {
        id: `r${Date.now()}`,
        author: "",
        location: "",
        text: "",
        rating: 5,
        photo: "",
        tourId: null,
        published: true,
        sortOrder: sorted.length
      }
    ]);

  const remove = (id: string) => onSave(sorted.filter((review) => review.id !== id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Reviews</h2>
          <p className="text-sm text-muted-foreground">
            Shown on the home page. Unpublished reviews stay hidden from visitors.
          </p>
        </div>
        <Button onClick={add}>
          <Plus className="mr-2 h-4 w-4" /> Add review
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No reviews yet. The section is hidden on the site until you add one.
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((review) => (
            <div key={review.id} className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={review.author} onChange={(e) => update(review.id, { author: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>City / tour</Label>
                  <Input
                    value={review.location}
                    placeholder="Toshkent — Turkiya"
                    onChange={(e) => update(review.id, { location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Review</Label>
                <Textarea
                  rows={3}
                  value={review.text}
                  onChange={(e) => update(review.id, { text: e.target.value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Photo URL (optional)</Label>
                  <Input
                    value={review.photo}
                    placeholder="/reviews/sarvar.jpg"
                    onChange={(e) => update(review.id, { photo: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Rating</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value} stars`}
                        onClick={() => update(review.id, { rating: value })}
                        className="p-1"
                      >
                        <Star
                          className={`h-5 w-5 ${value <= review.rating ? "fill-accent text-accent" : "text-border"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => update(review.id, { published: !review.published })}
                >
                  {review.published ? (
                    <>
                      <Eye className="mr-2 h-4 w-4" /> Published
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" /> Hidden
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => remove(review.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
