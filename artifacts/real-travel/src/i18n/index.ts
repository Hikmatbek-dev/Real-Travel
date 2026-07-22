import { createContext, useContext } from "react";
import { DEFAULT_LANGUAGE, LANGUAGES, type Dictionary, type Language } from "./types";
import { uz } from "./uz";
import { ru } from "./ru";
import { en } from "./en";

export { LANGUAGES, DEFAULT_LANGUAGE };
export type { Dictionary, Language };

export const dictionaries: Record<Language, Dictionary> = { uz, ru, en };

/**
 * Language lives in the URL so every page is shareable and indexable:
 *   /            -> uz (canonical, no prefix)
 *   /ru/tours/x  -> ru
 *   /en/tours/x  -> en
 */
export function languageFromPath(pathname: string): { language: Language; base: string } {
  const segment = pathname.split("/")[1];
  if (segment && segment !== DEFAULT_LANGUAGE && (LANGUAGES as string[]).includes(segment)) {
    return { language: segment as Language, base: `/${segment}` };
  }
  return { language: DEFAULT_LANGUAGE, base: "" };
}

/** Rewrites the current URL into another language, keeping the same page. */
export function pathInLanguage(pathname: string, next: Language): string {
  const { base } = languageFromPath(pathname);
  const rest = base ? pathname.slice(base.length) || "/" : pathname;
  return next === DEFAULT_LANGUAGE ? rest : `/${next}${rest === "/" ? "" : rest}`;
}

type LanguageContextValue = {
  language: Language;
  /** Dictionary for the active language. */
  t: Dictionary;
};

export const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  t: dictionaries[DEFAULT_LANGUAGE]
});

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
