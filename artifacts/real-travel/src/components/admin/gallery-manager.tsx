import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, GripVertical, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function GalleryManager({ gallery, onSave }: { gallery: string[]; onSave: (g: string[]) => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState<string[]>(gallery);
  const [isSaving, setIsSaving] = useState(false);

  const addImage = () => {
    setItems([...items, ""]);
  };

  const removeImage = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateImage = (idx: number, url: string) => {
    const next = [...items];
    next[idx] = url;
    setItems(next);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const valid = items.map(s => s.trim()).filter(Boolean);
      await onSave(valid);
      toast({ title: "Gallery saved", description: "Home page gallery has been updated." });
    } catch (e) {
      toast({ title: "Error saving", description: "Could not save gallery.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gallery</h2>
          <p className="text-muted-foreground">Manage the 4 main images shown on the Home Page ("Sarguzashtlaridan namunalar").</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Gallery"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Home Page Gallery Images</CardTitle>
          <CardDescription>Enter valid image URLs. We recommend 4 high quality images.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No images</h3>
              <p className="text-sm text-slate-500 mb-6">You haven't added any images to the home gallery yet.</p>
              <Button variant="outline" onClick={addImage}>
                <Plus className="mr-2 h-4 w-4" /> Add Image
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((url, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <GripVertical className="h-5 w-5 text-slate-400 cursor-grab active:cursor-grabbing shrink-0" />
                  <div className="flex-1">
                    <Label className="sr-only">Image URL {idx + 1}</Label>
                    <Input 
                      placeholder="https://..." 
                      value={url} 
                      onChange={(e) => updateImage(idx, e.target.value)} 
                      className="bg-white"
                    />
                  </div>
                  {url ? (
                    <div className="h-10 w-10 shrink-0 rounded border bg-slate-100 overflow-hidden">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeImage(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="pt-4">
                <Button variant="outline" onClick={addImage} className="w-full border-dashed">
                  <Plus className="mr-2 h-4 w-4" /> Add Another Image
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
