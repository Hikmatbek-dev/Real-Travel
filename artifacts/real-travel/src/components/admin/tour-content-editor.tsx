import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ItineraryDay, SharedTour } from "@/lib/shared-travel-data";

type Draft = Partial<SharedTour>;

/** Newline-separated text is the quickest way to edit a short list by hand. */
function ListField({
  label,
  hint,
  value,
  onChange
}: {
  label: string;
  hint?: string;
  value: string[] | undefined;
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Textarea
        rows={4}
        value={(value ?? []).join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
          )
        }
      />
      <p className="text-xs text-muted-foreground">{hint ?? "One item per line."}</p>
    </div>
  );
}

export function TourContentEditor({ draft, onChange }: { draft: Draft; onChange: (patch: Draft) => void }) {
  const itinerary = draft.itinerary ?? [];

  const setItinerary = (next: ItineraryDay[]) => onChange({ itinerary: next });

  const updateDay = (index: number, patch: Partial<ItineraryDay>) =>
    setItinerary(itinerary.map((day, i) => (i === index ? { ...day, ...patch } : day)));

  return (
    <div className="space-y-5 border-t border-border pt-5">
      <div className="grid gap-2">
        <Label>Group size (0 = not shown)</Label>
        <Input
          type="number"
          min={0}
          value={draft.groupSize ?? 0}
          onChange={(e) => onChange({ groupSize: Number(e.target.value) || 0 })}
        />
      </div>

      <ListField
        label="Highlights"
        value={draft.highlights}
        onChange={(highlights) => onChange({ highlights })}
      />
      <ListField label="What's included" value={draft.included} onChange={(included) => onChange({ included })} />
      <ListField label="Not included" value={draft.excluded} onChange={(excluded) => onChange({ excluded })} />
      <ListField
        label="Gallery"
        hint="One image URL per line (e.g. /tours/kyoto-2.png)."
        value={draft.gallery}
        onChange={(gallery) => onChange({ gallery })}
      />

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <Label>Day by day</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setItinerary([...itinerary, { day: itinerary.length + 1, title: "", text: "" }])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Day
          </Button>
        </div>

        {itinerary.length === 0 ? (
          <p className="text-xs text-muted-foreground">No days added yet.</p>
        ) : (
          itinerary.map((day, index) => (
            <div key={index} className="grid gap-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  className="h-9 w-16"
                  value={day.day}
                  onChange={(e) => updateDay(index, { day: Number(e.target.value) || index + 1 })}
                  aria-label="Day number"
                />
                <Input
                  className="h-9 flex-1"
                  placeholder="Title"
                  value={day.title}
                  onChange={(e) => updateDay(index, { title: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-destructive"
                  aria-label="Remove day"
                  onClick={() =>
                    setItinerary(
                      itinerary.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }))
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                rows={2}
                placeholder="What happens on this day"
                value={day.text}
                onChange={(e) => updateDay(index, { text: e.target.value })}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
