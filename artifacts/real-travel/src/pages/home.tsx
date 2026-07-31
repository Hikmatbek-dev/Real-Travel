import { useEffect, useMemo, useState } from "react";
import { MapPinned, Search, UserCheck, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TourCard, type Departure } from "@/components/tour-card";
import { HeroSearch, type HeroQuery } from "@/components/hero-search";
import { ReviewsSection } from "@/components/reviews-section";
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
      <section id="hero" className="relative flex min-h-[85vh] flex-col justify-center overflow-hidden pb-10 pt-20 font-sans">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero-bg.jpg" alt="Sayohat manzarasi" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-[#1E3A8A]/60" />
        </div>

        <div className="container relative mx-auto px-6 md:px-12 z-10 text-center">
          <div className="mb-12 mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg">
                Dunyoni Biz Bilan <span className="text-[#00E5FF]">KASHF ETING!</span>
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-gray-200 mb-12 font-light">
                Eng unutilmas lahzalar sizni kutmoqda.
            </p>
          </div>

          <HeroSearch value={query} onChange={setQuery} onSubmit={scrollToTours} />
        </div>
      </section>

      {/* ---------------------------------------------------------------- ticker */}
      <div className="bg-primary text-primary-foreground overflow-hidden py-3 shadow-inner relative flex items-center">
        <div className="px-4 font-bold whitespace-nowrap bg-primary z-10 flex items-center shadow-[10px_0_15px_-5px_hsl(var(--primary))]">
            <span className="text-accent mr-2">⚡️ Ayni muddao:</span>
        </div>
        <div className="overflow-hidden w-full relative">
            <div className="whitespace-nowrap inline-block animate-marquee font-sans">
                {isLoaded && tours.length > 0 ? (
                    <>
                        {tours.map(tour => (
                            <span key={`ticker1-${tour.id}`} className="mx-8">
                                🔥 {tour.name} - {formatUzs(tour.priceUzs, language)}
                            </span>
                        ))}
                        {tours.map(tour => (
                            <span key={`ticker2-${tour.id}`} className="mx-8">
                                🔥 {tour.name} - {formatUzs(tour.priceUzs, language)}
                            </span>
                        ))}
                    </>
                ) : (
                    <span className="mx-8">Yuklanmoqda...</span>
                )}
            </div>
        </div>
        <div className="px-4 font-bold bg-primary z-10 right-0 shadow-[-10px_0_15px_-5px_hsl(var(--primary))] hidden sm:block">
            <a href="#tours" className="text-accent hover:text-primary-foreground transition-colors underline text-sm whitespace-nowrap">Hammasi</a>
        </div>
      </div>

      {/* ---------------------------------------------------------------- categories */}
      <section className="py-16 bg-background font-sans border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2 uppercase tracking-wide">Kategoriyalar bo'yicha izlash</h2>
              <div className="w-24 h-1 bg-accent mx-auto mb-10 rounded-full"></div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Category 1 */}
                  <a href="#tours" className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer aspect-square flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Plyaj" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
                      <div className="relative z-10 text-white font-bold text-xl flex flex-col items-center">
                          <span className="text-4xl mb-2">🏝</span>
                          Plyaj
                      </div>
                  </a>
                  {/* Category 2 */}
                  <a href="#tours" className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer aspect-square flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Tog'" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
                      <div className="relative z-10 text-white font-bold text-xl flex flex-col items-center">
                          <span className="text-4xl mb-2">🏔</span>
                          Tog'
                      </div>
                  </a>
                  {/* Category 3 */}
                  <a href="#tours" className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer aspect-square flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Ekskursiya" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
                      <div className="relative z-10 text-white font-bold text-xl flex flex-col items-center">
                          <span className="text-4xl mb-2">🏛</span>
                          Ekskursiya
                      </div>
                  </a>
                  {/* Category 4 */}
                  <a href="#tours" className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer aspect-square flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1533240332313-0db49b459ad6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Ekstremal" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
                      <div className="relative z-10 text-white font-bold text-xl flex flex-col items-center">
                          <span className="text-4xl mb-2">🎒</span>
                          Ekstremal
                      </div>
                  </a>
              </div>
          </div>
      </section>

      {/* ---------------------------------------------------------------- trust */}
      <section className="py-20 bg-primary text-primary-foreground font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">Nega minglab mijozlar aynan bizni tanlashadi?</h2>
                <p className="text-primary-foreground/80 text-lg">Bizning ustuvorligimiz - sizning xavfsizligingiz va qulayligingiz.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { emoji: "🛡️", title: t.tour.trust1Title, text: t.tour.trust1Text },
                { emoji: "✈️", title: t.tour.trust2Title, text: t.tour.trust2Text },
                { emoji: "💰", title: t.tour.trust3Title, text: t.tour.trust3Text }
              ].map((item) => (
                <div key={item.title} className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-20 h-20 mx-auto bg-accent/20 rounded-full flex items-center justify-center mb-6">
                        <span className="text-4xl">{item.emoji}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-primary-foreground/80 text-sm leading-relaxed">{item.text}</p>
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

    </>
  );
}
