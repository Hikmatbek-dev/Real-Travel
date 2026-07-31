import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, CalendarDays, Check, Clock3, Loader2, MapPin, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/booking-form";
import { BookingBar } from "@/components/booking-bar";
import { useLanguage } from "@/i18n";
import { formatUzs } from "@/lib/format";
import { COMPANY } from "@/lib/company";
import { useSharedTravelData, type SharedTour } from "@/lib/shared-travel-data";

/** Keeps the tab title and share preview in step with the tour being viewed. */
function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    if (!title) return;
    const previousTitle = document.title;
    document.title = title;

    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? "";
    meta?.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      meta?.setAttribute("content", previousDescription);
    };
  }, [title, description]);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-10">
      <h2 className="mb-6 font-serif text-3xl text-primary">{title}</h2>
      {children}
    </section>
  );
}

function Gallery({ tour }: { tour: SharedTour }) {
  const [active, setActive] = useState<string | null>(null);
  const images = tour.gallery.filter(Boolean);
  if (!images.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setActive(src)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 p-6"
          onClick={() => setActive(null)}
        >
          <img src={active} alt="" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
          <button
            type="button"
            aria-label="Close"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-card/20 text-primary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </>
  );
}

export function TourDetailPage() {
  const [, params] = useRoute("/tours/:slug");
  const { t, language } = useLanguage();
  const { tours, isLoaded } = useSharedTravelData();

  const tour = tours.find((item) => item.slug === params?.slug);

  const [imgSrc, setImgSrc] = useState("https://wsrv.nl/?url=https://www.royalcaribbean.com/media-assets/pmc/content/dam/excalibur/digital-stock/royalty-free/shutterstock/2023/01/stock-photo-galata-tower-and-the-street-in-the-old-town-of-istanbul-turkey-554343394.jpg?w=1024");

  useEffect(() => {
    if (tour?.image) setImgSrc(tour.image);
  }, [tour?.image]);

  useDocumentMeta(
    tour ? `${tour.name} — ${COMPANY.brand}` : "",
    tour ? `${tour.location}. ${tour.description}` : ""
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [params?.slug]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-4 font-serif text-4xl text-primary">{t.tour.notFound}</h1>
        <p className="mb-8 font-light text-muted-foreground">{t.tour.notFoundText}</p>
        <Link href="/">
          <Button className="rounded-full px-6">{t.tour.back}</Button>
        </Link>
      </div>
    );
  }

  const facts = [
    { icon: Clock3, label: t.tour.duration, value: `${tour.duration} ${t.collection.days}` },
    { icon: MapPin, label: t.collection.regionLabel, value: t.regions[tour.region] },
    tour.groupSize > 0
      ? { icon: Users, label: t.tour.groupSize, value: `${tour.groupSize} ${t.tour.people}` }
      : null,
    tour.priceUzs > 0
      ? { icon: CalendarDays, label: t.collection.from, value: formatUzs(tour.priceUzs, language) }
      : null
  ].filter(Boolean) as { icon: typeof Clock3; label: string; value: string }[];

  return (
    <article>
      {/* ------------------------------------------------------------- hero */}
      <header className="relative h-[70vh] min-h-[460px] overflow-hidden">
        <img
          src={imgSrc}
          onError={() => setImgSrc("https://wsrv.nl/?url=https://www.royalcaribbean.com/media-assets/pmc/content/dam/excalibur/digital-stock/royalty-free/shutterstock/2023/01/stock-photo-galata-tower-and-the-street-in-the-old-town-of-istanbul-turkey-554343394.jpg?w=1024")}
          alt={tour.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/45 to-primary/15" />

        <div className="container relative mx-auto flex h-full max-w-5xl flex-col justify-end px-6 pb-14 text-primary-foreground md:px-12">
          <Link
            href="/"
            className="mb-8 inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary-foreground/80 transition-colors hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.tour.back}
          </Link>

          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-accent">{tour.location}</p>
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">{tour.name}</h1>
        </div>
      </header>

      {/* ------------------------------------------------------- quick facts */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto max-w-5xl px-6 md:px-12">
          <dl className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-center gap-3 px-1 py-6 md:justify-center md:px-4">
                <fact.icon className="h-5 w-5 shrink-0 text-accent" />
                <div className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{fact.label}</dt>
                  <dd className="truncate font-medium text-primary">{fact.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-6 pb-32 pt-14 md:px-12 lg:pb-20">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-12">
            <p className="text-lg font-light leading-relaxed text-foreground/80">{tour.description}</p>

            {tour.highlights.length ? (
              <Section title={t.tour.highlights}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {tour.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-muted-foreground">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {tour.itinerary.length ? (
              <Section title={t.tour.itinerary}>
                <ol className="space-y-0">
                  {tour.itinerary.map((day, i) => (
                    <li key={`${day.day}-${i}`} className="relative flex gap-5 pb-8 last:pb-0">
                      {/* Timeline rail — the line stops at the last day. */}
                      <div className="flex flex-col items-center">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {day.day}
                        </span>
                        {i < tour.itinerary.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
                      </div>
                      <div className="pt-2">
                        <h3 className="mb-1 font-medium text-primary">{day.title}</h3>
                        <p className="font-light leading-relaxed text-muted-foreground">{day.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            ) : null}

            {tour.included.length || tour.excluded.length ? (
              <Section title={t.tour.included}>
                <div className="grid gap-8 sm:grid-cols-2">
                  {tour.included.length ? (
                    <ul className="space-y-2.5">
                      {tour.included.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-muted-foreground">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {tour.excluded.length ? (
                    <div>
                      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        {t.tour.excluded}
                      </h3>
                      <ul className="space-y-2.5">
                        {tour.excluded.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-muted-foreground/80">
                            <X className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/50" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </Section>
            ) : null}

            {tour.gallery.length ? (
              <Section title={t.tour.gallery}>
                <Gallery tour={tour} />
              </Section>
            ) : null}
          </div>

          <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-2 font-serif text-2xl text-primary">{t.booking.title}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{t.booking.text}</p>
              <BookingForm tour={tour} />
            </div>
          </aside>
        </div>
      </div>

      <BookingBar tour={tour} />
    </article>
  );
}
