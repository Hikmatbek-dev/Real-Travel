import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Review } from "@/lib/shared-travel-data";

export function ReviewsManager({
  reviews,
  onSave
}: {
  reviews: Review[];
  onSave: (next: Review[]) => Promise<void> | void;
}) {
  const { toast } = useToast();
  // Edit locally so typing never triggers a network write on every keystroke —
  // that was remounting the inputs and stealing focus. Persist only on save.
  const [items, setItems] = useState<Review[]>(() =>
    [...reviews].sort((a, b) => a.sortOrder - b.sortOrder)
  );
  const [isSaving, setIsSaving] = useState(false);

  const update = (id: string, patch: Partial<Review>) =>
    setItems((prev) => prev.map((review) => (review.id === id ? { ...review, ...patch } : review)));

  const add = () =>
    setItems((prev) => [
      ...prev,
      {
        id: `r${Date.now()}`,
        author: "",
        location: "",
        text: "",
        rating: 5,
        photo: "",
        tourId: null,
        published: true,
        sortOrder: prev.length
      }
    ]);

  const remove = (id: string) => setItems((prev) => prev.filter((review) => review.id !== id));

  const save = async () => {
    setIsSaving(true);
    try {
      const cleaned = items
        .filter((r) => r.author.trim() || r.text.trim())
        .map((r, idx) => ({ ...r, author: r.author.trim(), text: r.text.trim(), sortOrder: idx }));
      await onSave(cleaned);
      setItems(cleaned);
      toast({ title: "Saqlandi", description: "Sharhlar saytda yangilandi." });
    } catch {
      toast({ title: "Xatolik", description: "Sharhlarni saqlab bo'lmadi.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Sharhlar</h2>
          <p className="text-sm text-slate-500">Faqat ism va sharх. Yozib bo'lgach "Saqlash"ni bosing.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={add}>
            <Plus className="mr-2 h-4 w-4" /> Qo'shish
          </Button>
          <Button onClick={save} disabled={isSaving}>
            {isSaving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
          Hali sharh yo'q. "Qo'shish"ni bosing.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((review) => (
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
