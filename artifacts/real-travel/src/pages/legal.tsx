import { useEffect } from "react";
import { useRoute } from "wouter";
import { Info, Instagram, MapPinned, Phone } from "lucide-react";
import { useLanguage } from "@/i18n";
import { COMPANY, PHONE_HREF } from "@/lib/company";

type LegalDoc = "oferta" | "terms" | "privacy";

/**
 * Legal pages.
 *
 * The site takes payments, so these links have to resolve to something real
 * rather than "#". The binding terms — cancellation windows, whether the
 * deposit is refundable — are the operator's to write, so the page states
 * plainly that the text is being prepared and gives the company details and a
 * way to reach a person, instead of inventing conditions.
 */
export function LegalPage() {
  const [, params] = useRoute("/legal/:doc");
  const { t, language } = useLanguage();

  const doc = (params?.doc ?? "oferta") as LegalDoc;

  const title =
    doc === "terms" ? t.legal.termsTitle : doc === "privacy" ? t.legal.privacyTitle : t.legal.offerTitle;

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — ${COMPANY.brand}`;
    window.scrollTo({ top: 0 });
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <div className="container mx-auto max-w-3xl px-6 pb-24 pt-32 md:px-12">
      <h1 className="mb-8 font-serif text-4xl text-primary md:text-5xl">{title}</h1>

      <div className="mb-10 flex gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <p className="font-light leading-relaxed text-muted-foreground">{t.legal.draftNotice}</p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">{t.legal.company}</h2>
        <dl className="space-y-3 border-t border-border pt-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">{COMPANY.brand}</dt>
            <dd className="font-medium text-primary">{COMPANY.legalName}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">{t.legal.contacts}</h2>
        <ul className="space-y-3 border-t border-border pt-4 text-sm">
          <li>
            <a href={PHONE_HREF} className="flex min-h-11 items-center gap-3 transition-colors hover:text-accent">
              <Phone className="h-4 w-4 text-accent" />
              {COMPANY.phone}
            </a>
          </li>
          <li className="flex min-h-11 items-center gap-3">
            <MapPinned className="h-4 w-4 shrink-0 text-accent" />
            {COMPANY.address[language]}
          </li>
          <li>
            <a
              href={COMPANY.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center gap-3 transition-colors hover:text-accent"
            >
              <Instagram className="h-4 w-4 text-accent" />@{COMPANY.instagram}
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
