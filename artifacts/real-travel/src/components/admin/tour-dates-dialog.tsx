import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SharedTour, TourDate } from "@/lib/shared-travel-data";

export function TourDatesDialog({
  tour,
  tourDates,
  onSave,
  onOpenChange
}: {
  tour: SharedTour | null;
  tourDates: TourDate[];
  onSave: (tourId: string, dates: TourDate[]) => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
}) {
  const [newDate, setNewDate] = useState("");
  const [newSeats, setNewSeats] = useState(10);
  const [error, setError] = useState("");

  const dates = useMemo(
    () =>
      tourDates
        .filter((date) => date.tourId === tour?.id)
        .sort((a, b) => a.departureDate.localeCompare(b.departureDate)),
    [tourDates, tour?.id]
  );

  if (!tour) return null;

  const addDate = async () => {
    setError("");
    if (!newDate) return;
    if (dates.some((date) => date.departureDate === newDate)) {
      setError("This departure date already exists.");
      return;
    }
    await onSave(tour.id, [
      ...dates,
      { id: `d${Date.now()}`, tourId: tour.id, departureDate: newDate, seatsTotal: Math.max(0, newSeats) }
    ]);
    setNewDate("");
  };

  const removeDate = (id: string) => onSave(tour.id, dates.filter((date) => date.id !== id));

  const updateSeats = (id: string, seats: number) =>
    onSave(
      tour.id,
      dates.map((date) => (date.id === id ? { ...date, seatsTotal: Math.max(0, seats) } : date))
    );

  return (
    <Dialog open={!!tour} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Departure dates</DialogTitle>
          <DialogDescription>
            {tour.name} — customers pick one of these when booking. Set seats to 0 for no limit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <div className="flex items-end gap-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="newDate">Date</Label>
              <Input
                id="newDate"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="grid w-24 gap-2">
              <Label htmlFor="newSeats">Seats</Label>
              <Input
                id="newSeats"
                type="number"
                min={0}
                value={newSeats}
                onChange={(e) => setNewSeats(Number(e.target.value) || 0)}
              />
            </div>
            <Button type="button" onClick={addDate} disabled={!newDate}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {dates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No departure dates yet.</p>
            ) : (
              dates.map((date) => (
                <div key={date.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <span className="flex-1 text-sm font-medium">{date.departureDate}</span>
                  <Input
                    type="number"
                    min={0}
                    value={date.seatsTotal}
                    onChange={(e) => updateSeats(date.id, Number(e.target.value) || 0)}
                    className="h-8 w-20"
                    aria-label="Seats"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeDate(date.id)}
                    aria-label="Remove date"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
