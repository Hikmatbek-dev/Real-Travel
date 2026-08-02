import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Quote, Trash2 } from "lucide-react";
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

  const move = (idx: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sharhlar</h2>
          <p className="text-sm text-slate-500">
            Bosh sahifada shu tartibda ko'rinadi. Yozib bo'lgach "Saqlash"ni bosing.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
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
          {items.map((review, idx) => (
            <div
              key={review.id}
              className="relative rounded-2xl border border-slate-200 bg-white p-5 pl-14 shadow-sm"
            >
              {/* Order badge */}
              <div className="absolute left-4 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sm font-semibold text-sky-600">
                {idx + 1}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Ism</Label>
                    <Input
                      value={review.author}
                      placeholder="Masalan: Sarvar"
                      onChange={(e) => update(review.id, { author: e.target.value })}
                      className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Sharh</Label>
                    <div className="relative">
                      <Quote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-300" />
                      <Textarea
                        rows={3}
                        value={review.text}
                        placeholder="Sayohat haqida fikr..."
                        onChange={(e) => update(review.id, { text: e.target.value })}
                        className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 pl-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Reorder + delete */}
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={idx === 0}
                    onClick={() => move(idx, -1)}
                    aria-label="Yuqoriga"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={idx === items.length - 1}
                    onClick={() => move(idx, 1)}
                    aria-label="Pastga"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => remove(review.id)}
                    aria-label="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
