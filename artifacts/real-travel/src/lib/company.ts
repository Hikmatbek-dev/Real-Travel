/**
 * Single source of truth for company details shown across the site.
 * Keeping them here avoids the same phone number drifting between pages.
 */
export const COMPANY = {
  brand: "Real Travel",
  legalName: 'OOO "REALGO TRAVEL"',
  phone: "+998 70 227 71 47",
  address: {
    uz: "Xorazm viloyati, Xonqa tumani",
    ru: "Хорезмская область, Хонкинский район",
    en: "Khorezm region, Khonqa district"
  },
  instagram: "realtravel.uz",
  instagramUrl: "https://www.instagram.com/realtravel.uz/"
} as const;

/** tel: link — digits only, so phone apps dial it correctly. */
export const PHONE_HREF = `tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`;
