import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isVideoUrl, uploadMedia } from "@/lib/upload-image";

/**
 * Manages the home page "Sarguzashtlaridan namunalar" gallery. Items can be
 * images or videos, added by uploading a file or pasting a URL, in any number
 * and any order.
 */
export function GalleryManager({ gallery, onSave }: { gallery: string[]; onSave: (g: string[]) => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState<string[]>(gallery);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (idx: number, url: string) => setItems(items.map((v, i) => (i === idx ? url : v)));
  const remove = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadMedia(file));
      setItems((prev) => [...prev, ...urls]);
    } catch (e) {
      toast({ title: "Yuklashda xatolik", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(items.map((s) => s.trim()).filter(Boolean));
      toast({ title: "Tasdiqlandi", description: "Galereya saytda chiqdi." });
    } catch {
      toast({ title: "Xatolik", description: "Galereyani saqlab bo'lmadi.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Galereya
            {items.length > 0 && (
              <span className="ml-2 align-middle text-sm font-medium text-slate-400">({items.length} ta)</span>
            )}
          </h2>
          <p className="text-slate-500">
            Bosh sahifadagi "Sarguzashtlaridan namunalar" — shu tartibda ko'rinadi.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="shrink-0">
          {isSaving ? "Tasdiqlanmoqda..." : "Tasdiqlash"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Rasm / video qo'shish</CardTitle>
          <CardDescription>Fayl yuklang (rasm yoki video, 50MB gacha) yoki havola qo'shing. Istalgancha element.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Fayl yuklash
            </Button>
            <Button variant="outline" onClick={() => setItems([...items, ""])}>
              <ImagePlus className="mr-2 h-4 w-4" /> Havola qo'shish
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
              Hali element yo'q. Fayl yuklang yoki havola qo'shing.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((url, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-600">
                    {idx + 1}
                  </span>
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md border bg-slate-100">
                    {url ? (
                      isVideoUrl(url) ? (
                        <video src={url} muted className="h-full w-full object-cover" />
                      ) : (
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      )
                    ) : null}
                    {url && (
                      <span className="absolute bottom-0 right-0 rounded-tl-md bg-slate-900/70 px-1 text-[10px] font-medium text-white">
                        {isVideoUrl(url) ? "Video" : "Rasm"}
                      </span>
                    )}
                  </div>
                  <Input
                    value={url}
                    onChange={(e) => update(idx, e.target.value)}
                    placeholder="https://... rasm yoki video havolasi"
                    className="flex-1 bg-white text-slate-900 border-slate-300"
                  />
                  <div className="flex shrink-0 items-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={idx === 0} onClick={() => move(idx, -1)} aria-label="Yuqoriga">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={idx === items.length - 1} onClick={() => move(idx, 1)} aria-label="Pastga">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(idx)} aria-label="O'chirish">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
