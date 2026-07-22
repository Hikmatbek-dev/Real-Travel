import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BookingForm } from "@/components/booking-form";
import { useLanguage } from "@/i18n";
import { formatUzs } from "@/lib/format";
import type { SharedTour } from "@/lib/shared-travel-data";

/**
 * Mobile booking bar, pinned to the bottom of the tour page.
 *
 * On a phone the booking panel sits far below a full-height image and a wall
 * of description, so the price and the call to action were only reachable
 * after a long scroll. This keeps both in view the whole time and opens the
 * form in a sheet. Hidden on large screens, where the sidebar already does it.
 */
export function BookingBar({ tour }: { tour: SharedTour }) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (tour.priceUzs <= 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <div className="flex items-center gap-4 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.collection.from}</div>
          <div className="truncate text-lg font-semibold text-primary">{formatUzs(tour.priceUzs, language)}</div>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="h-12 shrink-0 rounded-full px-7">{t.booking.bookNow}</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl">
            <div className="mx-auto w-full max-w-lg pb-6 pt-2">
              <h2 className="mb-1 font-serif text-2xl text-primary">{t.booking.title}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{t.booking.text}</p>
              <BookingForm tour={tour} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
