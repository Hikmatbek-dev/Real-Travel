import { Plus, Trash2 } from "lucide-react";
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
          <h2 className="text-2xl font-semibold text-slate-900">Sharhlar</h2>
          <p className="text-sm text-slate-500">Bosh sahifada ko'rinadi. Faqat ism va sharх yozing.</p>
        </div>
        <Button onClick={add}>
          <Plus className="mr-2 h-4 w-4" /> Sharh qo'shish
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
          Hali sharh yo'q. Birinchi sharhni qo'shing.
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((review) => (
            <div key={review.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-2">
                <Label className="text-slate-700">Ism</Label>
                <Input
                  value={review.author}
                  placeholder="Masalan: Sarvar"
                  onChange={(e) => update(review.id, { author: e.target.value })}
                  className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-700">Sharh</Label>
                <Textarea
                  rows={3}
                  value={review.text}
                  placeholder="Sayohat haqida fikr..."
                  onChange={(e) => update(review.id, { text: e.target.value })}
                  className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => remove(review.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> O'chirish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
