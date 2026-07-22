import { Link } from "wouter";
import { Instagram, MapPinned, Phone } from "lucide-react";
import { COMPANY, PHONE_HREF } from "@/lib/company";
import { useLanguage } from "@/i18n";

export function SiteFooter() {
  const { t, language } = useLanguage();

  return (
    <footer id="contact" className="border-t border-accent/20 bg-primary pb-12 pt-24 text-white">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
          <div className="md:col-span-2">
            <div className="mb-6 font-serif text-3xl">
              REAL <span className="italic text-accent">Travel</span>
            </div>
            <p className="mb-4 max-w-sm font-light leading-relaxed text-white/60">{t.footer.text}</p>
            <p className="mb-8 text-sm text-white/40">{COMPANY.legalName}</p>
            <a
              href={COMPANY.instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-accent hover:bg-accent"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{t.footer.contact}</h4>
            <ul className="space-y-4 text-sm font-light text-white/80">
              <li>
                <a href={PHONE_HREF} className="flex min-h-11 items-center transition-colors hover:text-accent">
                  <Phone className="mr-3 h-4 w-4 text-accent" />
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex items-start">
                <MapPinned className="mr-3 mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {COMPANY.address[language]}
              </li>
              <li>
                <a
                  href={COMPANY.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center transition-colors hover:text-accent"
                >
                  <Instagram className="mr-3 h-4 w-4 text-accent" />@{COMPANY.instagram}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{t.footer.legal}</h4>
            <ul className="space-y-3 text-sm font-light text-white/80">
              <li>
                <Link href="/order" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                  {t.order.title}
                </Link>
              </li>
              <li>
                <Link href="/legal/oferta" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                  {t.footer.offer}
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                  {t.footer.privacy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-xs font-light tracking-wider text-white/40">
          &copy; {new Date().getFullYear()} {COMPANY.legalName}. {t.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
