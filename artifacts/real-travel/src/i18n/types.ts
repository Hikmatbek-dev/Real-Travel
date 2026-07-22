export type Language = "uz" | "ru" | "en";

export const LANGUAGES: Language[] = ["uz", "ru", "en"];
export const DEFAULT_LANGUAGE: Language = "uz";

export type Dictionary = {
  nav: { tours: string; about: string; contact: string; call: string };
  hero: {
    eyebrow: string;
    titleBefore: string;
    titleAccent: string;
    titleAfter: string;
    text: string;
    button: string;
  };
  collection: {
    title: string;
    subtitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    regionLabel: string;
    regionPlaceholder: string;
    maxPrice: string;
    noTours: string;
    cardButton: string;
    perPerson: string;
    days: string;
    from: string;
  };
  tour: {
    back: string;
    eyebrow: string;
    duration: string;
    highlights: string;
    included: string;
    notFound: string;
    notFoundText: string;
  };
  booking: {
    title: string;
    text: string;
    fullName: string;
    phone: string;
    travelers: string;
    note: string;
    notePlaceholder: string;
    departure: string;
    selectDate: string;
    noDates: string;
    seatsLeft: string;
    soldOut: string;
    travelerDetails: string;
    traveler: string;
    travelerName: string;
    travelerNameHint: string;
    birthDate: string;
    paymentMode: string;
    payFull: string;
    payDeposit: string;
    depositNote: string;
    payNow: string;
    remaining: string;
    paymentLabel: string;
    payButton: string;
    payError: string;
    totalLabel: string;
    noPrice: string;
    processing: string;
    successTitle: string;
    successText: string;
    returnButton: string;
  };
  about: { eyebrow: string; titleA: string; titleB: string; paragraphs: string[] };
  footer: {
    text: string;
    contact: string;
    legal: string;
    terms: string;
    privacy: string;
    offer: string;
    copyright: string;
  };
  regions: { all: string; europe: string; asia: string; americas: string; africa: string };
};
