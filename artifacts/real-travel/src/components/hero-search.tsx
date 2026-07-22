import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";
import type { RegionKey } from "@/lib/shared-travel-data";

export type HeroQuery = {
  region: "all" | RegionKey;
  /** "YYYY-MM", or "" for any month. */
  month: string;
  travelers: number;
};

const REGIONS: ("all" | RegionKey)[] = ["all", "europe", "asia", "americas", "africa"];

/** Next 12 months, so the picker never offers a departure window in the past. */
function upcomingMonths(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

/**
 * Docked into the hero: turns the opening screen from a poster into the
 * primary way to start a search, which is how every booking site works.
 */
export function HeroSearch({
  value,
  onChange,
  onSubmit
}: {
  value: HeroQuery;
  onChange: (next: HeroQuery) => void;
  onSubmit: () => void;
}) {
  const { t, language } = useLanguage();

  const monthLabel = new Intl.DateTimeFormat(
    language === "ru" ? "ru-RU" : language === "en" ? "en-GB" : "uz-UZ",
    { month: "long", year: "numeric" }
  );

  const field = "flex-1 min-w-0 px-4 py-3 sm:py-4";
  const label = "block text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground";
  const control =
    "mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-foreground outline-none focus:ring-0";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="mx-auto flex w-full max-w-4xl flex-col gap-2 rounded-2xl bg-card p-2 shadow-xl sm:flex-row sm:items-stretch sm:gap-0 sm:rounded-full sm:p-1.5"
    >
      <div className={field}>
        <label htmlFor="heroRegion" className={label}>
          {t.hero.searchWhere}
        </label>
        <select
          id="heroRegion"
          className={control}
          value={value.region}
          onChange={(e) => onChange({ ...value, region: e.target.value as HeroQuery["region"] })}
        >
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region === "all" ? t.hero.anyDestination : t.regions[region]}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden w-px shrink-0 self-center bg-border sm:block sm:h-8" />

      <div className={field}>
        <label htmlFor="heroMonth" className={label}>
          {t.hero.searchWhen}
        </label>
        <select
          id="heroMonth"
          className={control}
          value={value.month}
          onChange={(e) => onChange({ ...value, month: e.target.value })}
        >
          <option value="">{t.hero.anyMonth}</option>
          {upcomingMonths().map((month) => (
            <option key={month} value={month}>
              {monthLabel.format(new Date(`${month}-01T00:00:00`))}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden w-px shrink-0 self-center bg-border sm:block sm:h-8" />

      <div className={`${field} sm:max-w-[8rem]`}>
        <label htmlFor="heroTravelers" className={label}>
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

      <Button type="submit" className="h-12 shrink-0 rounded-full px-6 sm:h-auto sm:px-8">
        <Search className="mr-2 h-4 w-4" />
        {t.hero.searchButton}
      </Button>
    </form>
  );
}
