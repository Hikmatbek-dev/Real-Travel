import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGES, pathInLanguage, useLanguage, type Language } from "@/i18n";
import { PHONE_HREF } from "@/lib/company";

const SECTIONS = ["tours", "about", "contact"] as const;

/**
 * Scrolls to a section when already on the home page, otherwise sends the
 * visitor home with the section in the hash so the target still wins.
 */
function useSectionLink() {
  const [location, navigate] = useLocation();

  return (id: string, onDone?: () => void) => {
    onDone?.();
    if (location === "/") {
      const el = document.getElementById(id);
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
        return;
      }
    }
    navigate(`/#${id}`);
  };
}

function LanguageSwitch({ onPick }: { onPick?: () => void }) {
  const { language } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border border-primary/10 bg-white px-1 py-1">
      <Globe2 className="ml-2 h-4 w-4 text-primary" />
      {LANGUAGES.map((lang: Language) => (
        <a
          key={lang}
          href={pathInLanguage(window.location.pathname, lang)}
          onClick={onPick}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            language === lang ? "bg-accent text-primary" : "text-primary/70 hover:text-primary"
          }`}
        >
          {lang.toUpperCase()}
        </a>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const goToSection = useSectionLink();

  const labels: Record<(typeof SECTIONS)[number], string> = {
    tours: t.nav.tours,
    about: t.nav.about,
    contact: t.nav.contact
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-white/90 py-4 shadow-sm backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between gap-4 px-6 md:px-12">
        <Link href="/" className="relative z-50">
          <img src="/logo.jpg" alt="Real Travel" className="h-12 w-auto rounded-lg object-contain" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <div className="flex space-x-8 text-sm font-medium uppercase tracking-widest text-foreground">
            {SECTIONS.map((id) => (
              <button key={id} onClick={() => goToSection(id)} className="transition-colors hover:text-accent">
                {labels[id]}
              </button>
            ))}
          </div>
          <a href={PHONE_HREF}>
            <Button className="rounded-full px-5">{t.nav.call}</Button>
          </a>
          <LanguageSwitch />
        </div>

        <button
          className="relative z-50 rounded-full p-2 text-primary transition-colors hover:bg-secondary md:hidden"
          aria-label="Menu"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full flex w-full flex-col gap-6 border-t border-border bg-white px-6 py-6 shadow-lg md:hidden"
          >
            <div className="flex flex-col space-y-4 text-sm font-medium uppercase tracking-widest text-foreground">
              {SECTIONS.map((id) => (
                <button
                  key={id}
                  onClick={() => goToSection(id, () => setIsMobileMenuOpen(false))}
                  className="py-2 text-left transition-colors hover:text-accent"
                >
                  {labels[id]}
                </button>
              ))}
            </div>
            <a href={PHONE_HREF} onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full rounded-full">{t.nav.call}</Button>
            </a>
            <LanguageSwitch onPick={() => setIsMobileMenuOpen(false)} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
