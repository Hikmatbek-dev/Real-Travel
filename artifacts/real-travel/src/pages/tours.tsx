import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useSeo } from "@/lib/use-seo";
import { useLang } from "@/i18n/lang";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";
import { useSharedTravelData } from "@/lib/shared-travel-data";

const ALL = "__all__";

export function ToursPage() {
  const { t } = useLang();
  useSeo({
    title: "Turlar va tur paketlari — Real Travel",
    description:
      "Real Travel tur paketlari: xorijiy va ichki sayohatlar, narxlari va davomiyligi bilan. O'zingizga mos turni tanlang va band qiling.",
    path: "/tours",
  });
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(ALL);
  const [selectedSeason, setSelectedSeason] = useState(ALL);
  const seasons = [
    { key: ALL, label: t.toursPage.all },
    { key: "spring", label: t.toursPage.seasons.spring },
    { key: "summer", label: t.toursPage.seasons.summer },
    { key: "autumn", label: t.toursPage.seasons.autumn },
    { key: "winter", label: t.toursPage.seasons.winter },
  ];

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedTourName, setSelectedTourName] = useState<string | undefined>();
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | undefined>();
  const [selectedTourPrice, setSelectedTourPrice] = useState<number | undefined>();
  const { tours } = useSharedTravelData();

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      if (search && !tour.name.toLowerCase().includes(search.toLowerCase()) && !tour.location.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCountry !== ALL && tour.location !== selectedCountry) return false;
      if (selectedSeason !== ALL && (tour as any).season !== undefined && (tour as any).season !== selectedSeason) return false;
      return true;
    });
  }, [search, selectedCountry, selectedSeason, tours]);

  const handleBook = (tourName: string, tourSlug?: string, priceUzs?: number) => {
    setSelectedTourName(tourName);
    setSelectedTourSlug(tourSlug);
    setSelectedTourPrice(priceUzs);
    setIsBookingOpen(true);
  };

  const countries = [ALL, ...Array.from(new Set(tours.map((tr) => tr.location)))];

  return (
    <div className="font-sans bg-white pb-32">
      {/* HEADER HERO */}
      <section className="relative h-[60vh] flex flex-col justify-center overflow-hidden mb-16">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=80" alt="Real Travel sayohat turlari" fetchPriority="high" className="w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/10 pointer-events-none" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 w-full mt-20 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-[100px] font-bold text-white tracking-tighter mb-6 font-heading drop-shadow-xl">
            {t.toursPage.title1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B400] to-[#ffd043] italic pr-4">{t.toursPage.title2}</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 font-light max-w-2xl mx-auto drop-shadow-md">
            {t.toursPage.subtitle}
          </p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12">

      <div className="flex flex-col lg:flex-row gap-12">
        {/* FILTERS SIDEBAR */}
        <div className="lg:w-72 flex-shrink-0 space-y-10">
          <div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t.toursPage.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-[#2298F0] focus:ring-1 focus:ring-[#2298F0] transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-4">{t.toursPage.countries}</h3>
            <div className="space-y-3">
              {countries.map((c) => (
                <label key={c} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedCountry === c ? 'bg-[#2298F0] border-[#2298F0]' : 'border-slate-300 group-hover:border-[#2298F0]'}`}>
                    {selectedCountry === c && <div className="w-2 h-2 bg-white rounded-sm" />}
                  </div>
                  <span className={`text-sm transition-colors ${selectedCountry === c ? 'text-slate-900 font-medium' : 'text-slate-500 group-hover:text-slate-900'}`}>{c === ALL ? t.toursPage.all : c}</span>
                  <input type="radio" name="country" value={c} checked={selectedCountry === c} onChange={(e) => setSelectedCountry(e.target.value)} className="hidden" />
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-4">{t.toursPage.season}</h3>
            <div className="space-y-3">
              {seasons.map((s) => (
                <label key={s.key} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedSeason === s.key ? 'bg-[#2298F0] border-[#2298F0]' : 'border-slate-300 group-hover:border-[#2298F0]'}`}>
                    {selectedSeason === s.key && <div className="w-2 h-2 bg-white rounded-sm" />}
                  </div>
                  <span className={`text-sm transition-colors ${selectedSeason === s.key ? 'text-slate-900 font-medium' : 'text-slate-500 group-hover:text-slate-900'}`}>{s.label}</span>
                  <input type="radio" name="season" value={s.key} checked={selectedSeason === s.key} onChange={(e) => setSelectedSeason(e.target.value)} className="hidden" />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* TOURS GRID */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">
              {t.toursPage.found} <span className="text-[#2298F0]">{filteredTours.length}</span> {t.toursPage.count}
            </h2>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span>{t.toursPage.sort}</span>
              <select className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer">
                <option>{t.toursPage.sortPopular}</option>
                <option>{t.toursPage.sortCheap}</option>
                <option>{t.toursPage.sortExpensive}</option>
              </select>
            </div>
          </div>

          {filteredTours.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2 font-heading">{t.toursPage.notFoundTitle}</h3>
              <p className="text-slate-500 max-w-md">{t.toursPage.notFoundText}</p>
              <Button
                onClick={() => {
                  setSearch("");
                  setSelectedCountry(ALL);
                  setSelectedSeason(ALL);
                }}
                className="mt-6 bg-[#2298F0] hover:bg-[#1a85d6] text-white rounded-xl px-8"
              >
                {t.toursPage.showAll}
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredTours.map((tour) => (
                <div 
                  key={tour.id} 
                  onClick={() => setLocation(`/tour/${tour.slug}`)}
                  className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-500 border border-slate-100 cursor-pointer"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img src={tour.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"} alt={tour.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                      {tour.location}
                    </div>
                    <div className="absolute -bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-[#2298F0] group-hover:text-white transition-colors duration-300 z-10 cursor-pointer" onClick={(e) => {
                      e.stopPropagation();
                      handleBook(tour.name, tour.slug, tour.priceUzs);
                    }}>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-[#2298F0] transition-colors">{tour.name}</h3>
                      <div className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">{tour.duration} {t.toursPage.day}</div>
                    </div>
                  
                  <div className="text-slate-500 text-sm mb-6 leading-relaxed flex-1 line-clamp-3 prose prose-sm prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: tour.description }} />
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-1">{t.toursPage.startPrice}</p>
                      <p className="text-lg font-bold text-slate-900">
                        {tour.priceUzs ? `${Number(tour.priceUzs).toLocaleString("uz-UZ")} so'm` : `$${tour.price.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
      </div>
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} tourName={selectedTourName} tourSlug={selectedTourSlug} priceUzs={selectedTourPrice} />
    </div>
  );
}
