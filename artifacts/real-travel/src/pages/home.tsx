import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { TourCard } from "@/components/tour-card";
import { useLanguage } from "@/i18n";
import { formatUzs } from "@/lib/format";
import { useSharedTravelData, type RegionKey } from "@/lib/shared-travel-data";

type RegionFilter = "all" | RegionKey;

const REGIONS: RegionFilter[] = ["all", "europe", "asia", "americas", "africa"];

export function HomePage() {
  const { t, language } = useLanguage();
  const { tours, isLoaded } = useSharedTravelData();

  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<RegionFilter>("all");
  const [maxPrice, setMaxPrice] = useState(0);

  // Highest price in the catalogue — the slider ceiling has to follow the data,
  // otherwise newly added (pricier) tours are filtered out by default.
  const ceiling = useMemo(
    () => tours.reduce((max, tour) => Math.max(max, tour.priceUzs), 0),
    [tours]
  );

  useEffect(() => {
    setMaxPrice(ceiling);
  }, [ceiling]);

  const filtered = useMemo(
    () =>
      tours.filter((tour) => {
        const haystack = `${tour.name} ${tour.location} ${tour.description}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesRegion = region === "all" || tour.region === region;
        const matchesPrice = maxPrice <= 0 || tour.priceUzs <= maxPrice;
        return matchesSearch && matchesRegion && matchesPrice;
      }),
    [maxPrice, region, search, tours]
  );

  return (
    <>
      <section id="hero" className="relative flex h-[90vh] min-h-[560px] items-center justify-center overflow-hidden">
        <img src="/hero.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-primary/35" />
        <div className="container relative mx-auto max-w-4xl px-6 text-center text-white">
          <p className="mb-6 text-sm uppercase tracking-[0.3em] text-white/80">{t.hero.eyebrow}</p>
          <h1 className="mb-8 font-serif text-5xl leading-tight md:text-7xl">
            {t.hero.titleBefore} <span className="italic">{t.hero.titleAccent}</span> {t.hero.titleAfter}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl font-light leading-relaxed text-white/85">{t.hero.text}</p>
          <Button
            size="lg"
            className="h-12 rounded-full px-8 text-base"
            onClick={() => {
              const el = document.getElementById("tours");
              if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
            }}
          >
            {t.hero.button}
          </Button>
        </div>
      </section>

      <section id="tours" className="bg-secondary/30 py-24 md:py-32">
        <div className="container mx-auto px-6 md:px-12">
          <div className="mb-12 max-w-2xl">
            <h2 className="mb-4 font-serif text-4xl text-primary md:text-5xl">{t.collection.title}</h2>
            <p className="font-light leading-relaxed text-muted-foreground">{t.collection.subtitle}</p>
          </div>

          <div className="mb-12 grid grid-cols-1 gap-6 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-xs uppercase tracking-widest text-muted-foreground">
                {t.collection.searchLabel}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-9"
                  placeholder={t.collection.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">{t.collection.regionLabel}</Label>
              <Select value={region} onValueChange={(value) => setRegion(value as RegionFilter)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t.collection.regionPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t.regions[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                {t.collection.maxPrice}: {maxPrice > 0 ? formatUzs(maxPrice, language) : "—"}
              </Label>
              <Slider
                min={0}
                max={ceiling || 1}
                step={Math.max(1, Math.round((ceiling || 1) / 50))}
                value={[maxPrice]}
                onValueChange={([value]) => setMaxPrice(value)}
                className="pt-4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((tour, index) => (
                <TourCard key={tour.id} tour={tour} index={index} />
              ))}
            </AnimatePresence>
          </div>

          {isLoaded && filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-xl text-muted-foreground">{t.collection.noTours}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section id="about" className="bg-white py-24 md:py-32">
        <div className="container mx-auto max-w-5xl px-6 md:px-12">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-accent">{t.about.eyebrow}</h2>
              <h3 className="mb-8 font-serif text-4xl leading-tight text-primary md:text-5xl">
                {t.about.titleA} <br />
                <span className="italic">{t.about.titleB}</span>
              </h3>
              <div className="space-y-6 font-light leading-relaxed text-muted-foreground">
                {t.about.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="relative h-[520px] overflow-hidden rounded-2xl">
              <img
                src={tours[0]?.image || "/hero.png"}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
