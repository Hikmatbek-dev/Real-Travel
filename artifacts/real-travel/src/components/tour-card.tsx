import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock3, MapPin } from "lucide-react";
import { useLanguage } from "@/i18n";
import { formatUzs } from "@/lib/format";
import type { SharedTour } from "@/lib/shared-travel-data";

export function TourCard({ tour, index = 0 }: { tour: SharedTour; index?: number }) {
  const { t, language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={`/tours/${tour.slug}`}
        className="group relative block overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
      >
        <div className="relative h-72 overflow-hidden md:h-80">
          <img
            src={tour.image}
            alt={tour.name}
            loading="lazy"
            className="h-full w-full transform bg-muted/10 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {tour.priceUzs > 0 ? (
            <div className="absolute right-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wider backdrop-blur">
              {formatUzs(tour.priceUzs, language)}
            </div>
          ) : null}
        </div>

        <div className="p-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center text-sm font-medium tracking-wider text-accent">
              <MapPin className="mr-1 h-4 w-4" />
              {t.regions[tour.region]}
            </div>
            <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              {tour.duration} {t.collection.days}
            </div>
          </div>

          <h3 className="mb-4 font-serif text-2xl text-primary">{tour.name}</h3>
          <p className="mb-4 font-light leading-relaxed text-muted-foreground">{tour.location}</p>
          <p className="mb-8 line-clamp-3 font-light leading-relaxed text-muted-foreground">{tour.description}</p>

          <div className="inline-flex w-full items-center justify-center rounded-none border border-primary/20 px-4 py-4 text-xs uppercase tracking-widest text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            {t.collection.cardButton}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
