import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { useLanguage } from "@/i18n";
import { formatUzs } from "@/lib/format";
import type { SharedTour } from "@/lib/shared-travel-data";

export type Departure = { departureDate: string; seatsLeft: number | null };

/**
 * A journey card. The image carries the price, and the footer carries the two
 * things a buyer actually decides on — when it leaves and whether there is
 * still room.
 */
export function TourCard({
  tour,
  departure,
  index = 0,
  featured = false
}: {
  tour: SharedTour;
  departure?: Departure | null;
  index?: number;
  featured?: boolean;
}) {
  const { t, language } = useLanguage();
  const [imgSrc, setImgSrc] = useState(tour.image || "/images/tour-turkey.jpg");

  useEffect(() => {
    setImgSrc(tour.image || "/images/tour-turkey.jpg");
  }, [tour.image]);

  const dateLabel = new Intl.DateTimeFormat(
    language === "ru" ? "ru-RU" : language === "en" ? "en-GB" : "uz-UZ",
    { day: "numeric", month: "short" }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 4) * 0.07 }}
      className={featured ? "md:col-span-2" : undefined}
    >
      <Link
        href={`/tours/${tour.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-lg border border-border/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-amber-400/50"
      >
        <div className={`relative overflow-hidden ${featured ? "h-80 md:h-[26rem]" : "h-72"}`}>
          <img
            src={imgSrc}
            alt={tour.name}
            onError={() => setImgSrc("/images/tour-turkey.jpg")}
            loading={index > 2 ? "lazy" : undefined}
            className="h-full w-full transform bg-muted object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

          {featured ? (
            <span className="absolute left-5 top-5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-950 shadow-lg">
              {t.collection.featured}
            </span>
          ) : null}

          {/* Price sits on the image with high contrast */}
          <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-white">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-400">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                {t.regions[tour.region]}
              </div>
              <h3 className={`font-serif font-black leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] ${featured ? "text-3xl md:text-4xl" : "text-2xl"}`}>
                {tour.name}
              </h3>
            </div>
            {tour.priceUzs > 0 ? (
              <div className="shrink-0 rounded-2xl bg-slate-950/85 border border-amber-400/40 px-3.5 py-2 text-right backdrop-blur-md shadow-xl transition-all group-hover:border-amber-400 group-hover:scale-105">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">{t.collection.from}</div>
                <div className="text-base font-black text-amber-400 drop-shadow-md">{formatUzs(tour.priceUzs, language)}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 bg-card relative">
          <p className="mb-5 line-clamp-2 font-medium leading-relaxed text-foreground/80">{tour.location} — {tour.description}</p>

          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/80 pt-4 text-sm font-semibold">
            <span className="flex items-center gap-1.5 text-foreground">
              <Clock3 className="h-4 w-4 text-amber-500" />
              {tour.duration} {t.collection.days}
            </span>

            {departure ? (
              <span className="flex items-center gap-1.5 text-foreground">
                <CalendarDays className="h-4 w-4 text-amber-500" />
                {dateLabel.format(new Date(`${departure.departureDate}T00:00:00`))}
              </span>
            ) : (
              <span className="text-muted-foreground">{t.collection.datesSoon}</span>
            )}

            {departure && departure.seatsLeft !== null && departure.seatsLeft <= 5 ? (
              <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <Users className="h-4 w-4" />
                {departure.seatsLeft} {t.collection.seatsLeft}
              </span>
            ) : null}

            <ArrowUpRight className="ml-auto h-5 w-5 text-amber-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
