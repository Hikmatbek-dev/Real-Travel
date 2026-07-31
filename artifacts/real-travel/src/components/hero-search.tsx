import { Search, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";
import type { SharedTour } from "@/lib/shared-travel-data";

export type HeroQuery = {
  tourId: string;
  month: string;
  travelers: number;
};

/** Next 12 months for departure windows */
function upcomingMonths(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

export function HeroSearch({
  value,
  onChange,
  onSubmit,
  tours = []
}: {
  value: HeroQuery;
  onChange: (next: HeroQuery) => void;
  onSubmit: () => void;
  tours?: SharedTour[];
}) {
  const { t, language } = useLanguage();

  const monthLabel = new Intl.DateTimeFormat(
    language === "ru" ? "ru-RU" : language === "en" ? "en-GB" : "uz-UZ",
    { month: "long", year: "numeric" }
  );

  const field = "flex-1 min-w-0 px-4 py-3 sm:py-3.5 rounded-2xl transition-all hover:bg-white/10 flex flex-col justify-center";
  const label = "flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-300 drop-shadow mb-1";
  const control =
    "w-full border-0 bg-transparent p-0 text-sm sm:text-base font-bold text-white outline-none focus:ring-0 [&>option]:text-slate-900 [&>option]:bg-white cursor-pointer";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-2 rounded-[2.5rem] bg-slate-950/70 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/20 sm:flex-row sm:items-center sm:gap-2 sm:p-2.5"
    >
      {/* Tour Selector (Qayerga / Available tours) */}
      <div className={field}>
        <label htmlFor="heroTour" className={label}>
          <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          {t.hero.searchWhere}
        </label>
        <select
          id="heroTour"
          className={control}
          value={value.tourId}
          onChange={(e) => onChange({ ...value, tourId: e.target.value })}
        >
          <option value="all">🌟 Barcha mavjud tur paketlar</option>
          {tours.map((tour) => (
            <option key={tour.id} value={tour.id}>
              ✈️ {tour.name} ({tour.duration} kun)
            </option>
          ))}
        </select>
      </div>

      <div className="hidden w-px shrink-0 self-stretch bg-white/20 sm:block my-2" />

      {/* Departure Month (Qachon) */}
      <div className={field}>
        <label htmlFor="heroMonth" className={label}>
          <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          {t.hero.searchWhen}
        </label>
        <select
          id="heroMonth"
          className={control}
          value={value.month}
          onChange={(e) => onChange({ ...value, month: e.target.value })}
        >
          <option value="">🗓 Doimiy bor (Istalgan vaqt)</option>
          {upcomingMonths().map((month) => (
            <option key={month} value={month}>
              📅 {monthLabel.format(new Date(`${month}-01T00:00:00`))}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden w-px shrink-0 self-stretch bg-white/20 sm:block my-2" />

      {/* Travelers (Necha kishi) */}
      <div className={`${field} sm:max-w-[9.5rem]`}>
        <label htmlFor="heroTravelers" className={label}>
          <Users className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          {t.hero.searchWho}
        </label>
        <input
          id="heroTravelers"
          type="number"
          min={1}
          max={30}
          className={control}
          value={value.travelers}
          onChange={(e) => onChange({ ...value, travelers: Math.max(1, Number(e.target.value) || 1) })}
        />
      </div>

      <Button
        type="submit"
        className="h-14 shrink-0 rounded-[1.8rem] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black tracking-wider text-base shadow-xl transition-all duration-300 hover:scale-105 sm:ml-2 border border-amber-300/40"
      >
        <Search className="mr-2 h-5 w-5 stroke-[2.5]" />
        {t.hero.searchButton}
      </Button>
    </form>
  );
}
