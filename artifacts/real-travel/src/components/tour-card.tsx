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
 * still room — instead of a third repetition of the description.
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
  const [imgSrc, setImgSrc] = useState(tour.image || "https://www.royalcaribbean.com/media-assets/pmc/content/dam/excalibur/digital-stock/royalty-free/shutterstock/2023/01/stock-photo-galata-tower-and-the-street-in-the-old-town-of-istanbul-turkey-554343394.jpg?w=1024");

  useEffect(() => {
    setImgSrc(tour.image || "https://www.royalcaribbean.com/media-assets/pmc/content/dam/excalibur/digital-stock/royalty-free/shutterstock/2023/01/stock-photo-galata-tower-and-the-street-in-the-old-town-of-istanbul-turkey-554343394.jpg?w=1024");
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
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
      >
        <div className={`relative overflow-hidden ${featured ? "h-80 md:h-[26rem]" : "h-72"}`}>
          <img
            src={imgSrc}
            alt={tour.name}
            onError={() => setImgSrc("https://www.royalcaribbean.com/media-assets/pmc/content/dam/excalibur/digital-stock/royalty-free/shutterstock/2023/01/stock-photo-galata-tower-and-the-street-in-the-old-town-of-istanbul-turkey-554343394.jpg?w=1024")}
            loading={index > 2 ? "lazy" : undefined}
            className="h-full w-full transform bg-muted object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-80" />

          {featured ? (
            <span className="absolute left-5 top-5 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-accent-foreground shadow-[0_0_15px_hsl(var(--accent)/0.6)]">
              {t.collection.featured}
            </span>
          ) : null}

          {/* Price sits on the image so it is visible before any scrolling. */}
          <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-white">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-accent font-medium">
                <MapPin className="h-3.5 w-3.5" />
                {t.regions[tour.region]}
              </div>
              <h3 className={`font-serif font-bold leading-tight drop-shadow-md ${featured ? "text-3xl md:text-4xl" : "text-2xl"}`}>
                {tour.name}
              </h3>
            </div>
            {tour.priceUzs > 0 ? (
              <div className="shrink-0 rounded-xl bg-white/10 border border-white/20 px-3 py-1.5 text-right backdrop-blur-md shadow-lg transition-colors group-hover:bg-accent/20 group-hover:border-accent/50">
                <div className="text-[10px] uppercase tracking-wider text-white/70">{t.collection.from}</div>
                <div className="text-sm font-bold text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.8)]">{formatUzs(tour.priceUzs, language)}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 bg-card relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <p className="mb-5 line-clamp-2 font-light leading-relaxed text-muted-foreground">{tour.location}</p>

          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock3 className="h-4 w-4 text-accent" />
              {tour.duration} {t.collection.days}
            </span>

            {departure ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-accent" />
                {dateLabel.format(new Date(`${departure.departureDate}T00:00:00`))}
              </span>
            ) : (
              <span className="text-muted-foreground/70">{t.collection.datesSoon}</span>
            )}

            {departure && departure.seatsLeft !== null && departure.seatsLeft <= 5 ? (
              <span className="flex items-center gap-1.5 font-medium text-accent">
                <Users className="h-4 w-4" />
                {departure.seatsLeft} {t.collection.seatsLeft}
              </span>
            ) : null}

            <ArrowUpRight className="ml-auto h-5 w-5 text-primary transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
