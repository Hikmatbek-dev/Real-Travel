import { Instagram, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";
import { COMPANY, PHONE_HREF } from "@/lib/company";

/**
 * Closing band. Many visitors will not book online at all — they want to talk
 * first — so the page ends with a way to reach a person rather than a footer.
 */
export function CtaBand() {
  const { t } = useLanguage();

  return (
    <section className="bg-accent py-16 text-accent-foreground md:py-20">
      <div className="container mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 md:flex-row md:items-center md:justify-between md:px-12">
        <div className="max-w-xl">
          <h2 className="mb-3 font-serif text-3xl leading-tight md:text-4xl">{t.cta.title}</h2>
          <p className="font-light leading-relaxed text-accent-foreground/85">{t.cta.text}</p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row md:w-auto">
          <a href={PHONE_HREF} className="sm:shrink-0">
            <Button className="h-12 w-full rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/90">
              <Phone className="mr-2 h-4 w-4" />
              {t.cta.call}
            </Button>
          </a>
          <a href={COMPANY.instagramUrl} target="_blank" rel="noreferrer" className="sm:shrink-0">
            <Button
              variant="outline"
              className="h-12 w-full rounded-full border-accent-foreground/30 bg-transparent px-7 text-accent-foreground hover:bg-accent-foreground/10"
            >
              <Instagram className="mr-2 h-4 w-4" />
              {t.cta.write}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
