import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Check, X, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";
import { useSharedTravelData } from "@/lib/shared-travel-data";

export function TourDetailPage() {
  const [, params] = useRoute("/tour/:id");
  const [, setLocation] = useLocation();
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const { tours } = useSharedTravelData();
  const tour = tours.find((t) => t.slug === params?.id);

  if (!tour) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center font-sans gap-4">
        <h1 className="text-3xl font-light text-slate-900">Tur topilmadi</h1>
        <Button onClick={() => setLocation("/tours")} className="bg-[#2298F0] hover:bg-[#1a85d6] text-white">
          Barcha turlarga qaytish
        </Button>
      </div>
    );
  }

  const priceLabel =
    tour.priceUzs > 0
      ? `${Number(tour.priceUzs).toLocaleString("uz-UZ")} so'm`
      : tour.price > 0
        ? `$${tour.price.toLocaleString()}`
        : "";

  // Only real, admin-entered content is shown — no filler placeholders.
  const description = (tour.description || "").trim();
  const included = (tour.included ?? []).filter((s) => s && s.trim());
  const excluded = (tour.excluded ?? []).filter((s) => s && s.trim());
  const itinerary = (tour.itinerary ?? []).filter((it) => it && it.title);

  return (
    <div className="bg-white min-h-screen font-sans pb-32">
      <div className="max-w-[900px] mx-auto px-6 pt-28 md:pt-32">
        {/* Back */}
        <button
          onClick={() => setLocation("/tours")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Barcha turlar
        </button>

        {/* Title block */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            {tour.location && (
              <div className="inline-flex items-center gap-1.5 text-sky-600 font-medium text-sm mb-3">
                <MapPin className="w-4 h-4" /> {tour.location}
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-tight">
              {tour.name}
            </h1>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-slate-500 text-sm">
            <Calendar className="w-4 h-4" /> {tour.duration} kun
          </div>
        </div>

        {/* Big image — lower on the page, larger, not a hero */}
        {tour.image && (
          <div className="rounded-[2rem] overflow-hidden shadow-xl mb-10 aspect-[16/10] bg-slate-100">
            <img src={tour.image} alt={tour.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Price card */}
        {priceLabel && (
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 px-6 py-5 mb-10">
            <span className="text-slate-500 text-sm">Narx (bir kishi uchun)</span>
            <span className="text-2xl md:text-3xl font-medium text-slate-900">{priceLabel}</span>
          </div>
        )}

        {/* Description — only if entered */}
        {description && (
          <div
            className="text-lg text-slate-600 leading-relaxed font-light prose prose-slate max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        {/* Included / excluded — only if admin added them */}
        {(included.length > 0 || excluded.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            {included.length > 0 && (
              <div>
                <h2 className="text-xl font-medium text-slate-900 mb-5">Kiritilgan</h2>
                <ul className="space-y-3">
                  {included.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {excluded.length > 0 && (
              <div>
                <h2 className="text-xl font-medium text-slate-900 mb-5">Kiritilmagan</h2>
                <ul className="space-y-3">
                  {excluded.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-4 h-4" />
                      </div>
                      <span className="text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Itinerary — only if entered */}
        {itinerary.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-light text-slate-900 mb-8 tracking-tight">Sayohat dasturi</h2>
            <div className="space-y-6">
              {itinerary.map((item, idx) => (
                <div key={idx} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center font-medium shrink-0">
                      {item.day || idx + 1}
                    </div>
                    {idx !== itinerary.length - 1 && <div className="w-px flex-1 bg-slate-100 my-2" />}
                  </div>
                  <div className="pb-4 pt-1">
                    <h3 className="text-lg font-medium text-slate-900 mb-1.5">{item.title}</h3>
                    {item.text && <p className="text-slate-600 leading-relaxed">{item.text}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky booking bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 md:p-5 z-40">
        <div className="max-w-[900px] mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <div className="text-sm text-slate-500">{tour.name}</div>
            {priceLabel && <div className="text-xl font-medium text-slate-900">{priceLabel}</div>}
          </div>
          <Button
            onClick={() => setIsBookingOpen(true)}
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-slate-900 px-10 py-6 rounded-2xl text-base font-semibold shadow-sm transition-all"
          >
            Turni band qilish
          </Button>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        tourName={tour.name}
        tourSlug={tour.slug}
        priceUzs={tour.priceUzs}
      />
    </div>
  );
}
