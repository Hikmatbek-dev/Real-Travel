import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, CheckCircle2, Clock3, Loader2, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/booking-form";
import { useLanguage } from "@/i18n";
import { formatUzs } from "@/lib/format";
import { COMPANY } from "@/lib/company";
import { useSharedTravelData } from "@/lib/shared-travel-data";

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

export function TourDetailPage() {
  const [, params] = useRoute("/tours/:slug");
  const { t, language } = useLanguage();
  const { tours, isLoaded } = useSharedTravelData();

  const tour = tours.find((item) => item.slug === params?.slug);

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

  return (
    <article>
      <header className="relative h-[60vh] min-h-[420px] overflow-hidden">
        <img src={tour.image} alt={tour.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/10" />

        <div className="container relative mx-auto flex h-full max-w-5xl flex-col justify-end px-6 pb-12 text-white md:px-12">
          <Link
            href="/"
            className="mb-6 inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.tour.back}
          </Link>

          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/75">{t.tour.eyebrow}</p>
          <h1 className="font-serif text-4xl md:text-6xl">{tour.name}</h1>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-card/15 px-3 py-1 backdrop-blur">
              <MapPin className="h-4 w-4" />
              {tour.location}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-card/15 px-3 py-1 backdrop-blur">
              <Clock3 className="h-4 w-4" />
              {tour.duration} {t.collection.days}
            </span>
            {tour.priceUzs > 0 ? (
              <span className="rounded-full bg-card/15 px-3 py-1 backdrop-blur">
                {formatUzs(tour.priceUzs, language)} / {t.collection.perPerson}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl px-6 py-16 md:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-10">
            <p className="font-light leading-relaxed text-muted-foreground">{tour.description}</p>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4 text-accent" />
                {t.tour.highlights}
              </h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{tour.location}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    {tour.duration} {t.collection.days}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{t.regions[tour.region]}</span>
                </li>
              </ul>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-2 font-serif text-2xl text-primary">{t.booking.title}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{t.booking.text}</p>
              <BookingForm tour={tour} />
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
