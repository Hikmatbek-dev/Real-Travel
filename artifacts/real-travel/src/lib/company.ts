/**
 * Single source of truth for company details shown across the site.
 * Keeping them here avoids the same phone number drifting between pages.
 */
export const COMPANY = {
  brand: "Real Travel",
  legalName: 'OOO "REALGO TRAVEL"',
  phone: "+998 95 008 71 47",
  address: {
    uz: "Xorazm viloyati Xonqa shaxarchasi Putin to'yxona ko'chasi",
    ru: "Хорезмская область, город Хонка, улица Путина",
    en: "Khorezm region, Khonqa city, Putin wedding hall street"
  },
  instagram: "realtravel.uz",
  instagramUrl: "https://www.instagram.com/realtravel.uz/"
} as const;

export const COMPANY_NAME = COMPANY.brand;
export const COMPANY_LEGAL = COMPANY.legalName;

/** tel: link — digits only, so phone apps dial it correctly. */
export const PHONE_HREF = `tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`;
