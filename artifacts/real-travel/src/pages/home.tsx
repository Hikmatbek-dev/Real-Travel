import { useEffect, useMemo, useState } from "react";
import { MapPinned, Search, UserCheck, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TourCard, type Departure } from "@/components/tour-card";
import { HeroSearch, type HeroQuery } from "@/components/hero-search";
import { ReviewsSection } from "@/components/reviews-section";
import { CtaBand } from "@/components/cta-band";
import { useLanguage } from "@/i18n";
import { formatUzs } from "@/lib/format";
import { useSharedTravelData } from "@/lib/shared-travel-data";

type AvailabilityRow = {
  tourId: string;
  departureDate: string;
  seatsLeft: number | null;
};

const scrollToTours = () => {
  const el = document.getElementById("tours");
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
};

export function HomePage() {
  const { t, language } = useLanguage();
  const { tours, reviews, isLoaded } = useSharedTravelData();

  const [query, setQuery] = useState<HeroQuery>({ region: "all", month: "", travelers: 2 });
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(0);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);

  // One request for every upcoming departure, so each card can show its next
  // date and remaining seats without a call per tour.
  useEffect(() => {
    let active = true;
    fetch("/api/availability")
      .then((r) => r.json())
      .then((data) => active && setAvailability(data.dates ?? []))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const ceiling = useMemo(() => tours.reduce((max, tour) => Math.max(max, tour.priceUzs), 0), [tours]);

  useEffect(() => {
    setMaxPrice(ceiling);
  }, [ceiling]);

  /** Soonest upcoming departure per tour. */
  const nextDeparture = useMemo(() => {
    const map = new Map<string, Departure>();
    for (const row of [...availability].sort((a, b) => a.departureDate.localeCompare(b.departureDate))) {
      if (!map.has(row.tourId)) map.set(row.tourId, { departureDate: row.departureDate, seatsLeft: row.seatsLeft });
    }
    return map;
  }, [availability]);

  const filtered = useMemo(
    () =>
      tours.filter((tour) => {
        const haystack = `${tour.name} ${tour.location} ${tour.description}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
        if (query.region !== "all" && tour.region !== query.region) return false;
        if (maxPrice > 0 && tour.priceUzs > maxPrice) return false;
        if (query.month) {
          const hasMonth = availability.some(
            (row) => row.tourId === tour.id && row.departureDate.slice(0, 7) === query.month
          );
          if (!hasMonth) return false;
        }
        return true;
      }),
    [availability, maxPrice, query.month, query.region, search, tours]
  );

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section id="hero" className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden pb-10 pt-32">
        <img src="/hero.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/45 to-primary/85" />

        <div className="container relative mx-auto px-6 md:px-12">
          {/* Left-aligned editorial block rather than a centred poster. */}
          <div className="mb-12 max-w-3xl text-primary-foreground">
            <p className="mb-5 text-xs uppercase tracking-[0.35em] text-primary-foreground/75">{t.hero.eyebrow}</p>
            <h1 className="mb-6 font-serif text-5xl leading-[1.05] md:text-7xl lg:text-8xl">
              {t.hero.titleBefore} <span className="italic text-accent">{t.hero.titleAccent}</span>{" "}
              {t.hero.titleAfter}
            </h1>
            <p className="max-w-xl text-base font-light leading-relaxed text-primary-foreground/85">{t.hero.text}</p>
          </div>

          <HeroSearch value={query} onChange={setQuery} onSubmit={scrollToTours} />
        </div>
      </section>

      {/* ---------------------------------------------------------------- trust */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto max-w-6xl px-6 py-14 md:px-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-3 md:gap-12">
            {[
              { icon: MapPinned, title: t.tour.trust1Title, text: t.tour.trust1Text },
              { icon: UserCheck, title: t.tour.trust2Title, text: t.tour.trust2Text },
              { icon: Wallet, title: t.tour.trust3Title, text: t.tour.trust3Text }
            ].map((item) => (
              <div key={item.title}>
                <item.icon className="mb-4 h-6 w-6 text-accent" />
                <h3 className="mb-2 font-serif text-xl text-primary">{item.title}</h3>
                <p className="font-light leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- collection */}
      <section id="tours" className="bg-background py-24 md:py-28">
        <div className="container mx-auto px-6 md:px-12">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="mb-3 font-serif text-4xl text-primary md:text-5xl">{t.collection.title}</h2>
              <p className="font-light leading-relaxed text-muted-foreground">{t.collection.subtitle}</p>
            </div>

            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end md:w-auto">
              <div className="space-y-2 sm:w-56">
                <Label htmlFor="search" className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {t.collection.searchLabel}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    className="h-11 pl-9"
                    placeholder={t.collection.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 sm:w-56">
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {t.collection.maxPrice}: {maxPrice > 0 ? formatUzs(maxPrice, language) : "—"}
                </Label>
                <Slider
                  min={0}
                  max={ceiling || 1}
                  step={Math.max(1, Math.round((ceiling || 1) / 50))}
                  value={[maxPrice]}
                  onValueChange={([value]) => setMaxPrice(value)}
                  className="h-11 pt-5"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {!isLoaded
              ? Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-sm">
                    <div className="h-72 animate-pulse bg-muted" />
                    <div className="space-y-4 p-6">
                      <div className="h-4 w-2/3 animate-pulse rounded-lg bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
                    </div>
                  </div>
                ))
              : filtered.map((tour, index) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    index={index}
                    departure={nextDeparture.get(tour.id) ?? null}
                    // The first card runs wide, so the grid has a focal point
                    // instead of three identical boxes.
                    featured={index === 0 && filtered.length > 2}
                  />
                ))}
          </div>

          {isLoaded && filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-xl text-muted-foreground">{t.collection.noTours}</p>
            </div>
          ) : null}
        </div>
      </section>

      <ReviewsSection reviews={reviews} />

      {/* --------------------------------------------------------------- about */}
      <section id="about" className="bg-secondary/40 py-24 md:py-32">
        <div className="container mx-auto max-w-5xl px-6 md:px-12">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-xs uppercase tracking-[0.35em] text-accent">{t.about.eyebrow}</h2>
              <h3 className="mb-8 font-serif text-4xl leading-tight text-primary md:text-5xl">
                {t.about.titleA} <br />
                <span className="italic">{t.about.titleB}</span>
              </h3>
              <div className="space-y-5 font-light leading-relaxed text-muted-foreground">
                {t.about.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="relative h-[520px] overflow-hidden rounded-2xl">
              <img src={tours[0]?.image || "/hero.png"} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
