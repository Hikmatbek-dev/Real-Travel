import type { Language } from "@/i18n";

const LOCALES: Record<Language, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

/**
 * Prices are shown in so'm everywhere, because so'm is what Paylov actually
 * charges. Showing a USD figure next to a so'm charge is how customers end up
 * disputing the amount.
 */
export function formatUzs(amount: number, language: Language): string {
  const value = new Intl.NumberFormat(LOCALES[language], { maximumFractionDigits: 0 }).format(amount);
  const suffix = language === "ru" ? "сум" : language === "en" ? "UZS" : "so'm";
  return `${value} ${suffix}`;
}
