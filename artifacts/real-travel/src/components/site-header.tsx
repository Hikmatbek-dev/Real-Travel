import { useState, useEffect } from "react";
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

function LanguageSwitch({ onPick, isScrolled = false }: { onPick?: () => void, isScrolled?: boolean }) {
  const { language } = useLanguage();

  return (
    <div className={`flex items-center gap-1 rounded-full border px-1 py-1 shadow-sm transition-colors ${isScrolled ? "bg-gray-100 border-gray-200" : "bg-white/20 border-white/20 backdrop-blur-md"}`}>
      <Globe2 className={`ml-2 h-4 w-4 ${isScrolled ? "text-gray-600" : "text-white"}`} />
      {LANGUAGES.map((lang: Language) => (
        <a
          key={lang}
          href={pathInLanguage(window.location.pathname, lang)}
          onClick={onPick}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
            language === lang ? "bg-accent text-accent-foreground shadow-md" : (isScrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/20")
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
  const [isScrolled, setIsScrolled] = useState(false);
  const goToSection = useSectionLink();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const labels: Record<(typeof SECTIONS)[number], string> = {
    tours: t.nav.tours,
    about: t.nav.about,
    contact: t.nav.contact
  };

  return (
    <nav className={`fixed top-0 z-50 w-full py-4 transition-all duration-300 ${isScrolled ? "bg-white/90 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md" : "bg-transparent"}`}>
      <div className="container mx-auto flex items-center justify-between gap-4 px-6 md:px-12">
        <Link href="/" className="relative z-50 flex items-center gap-2">
          <img src="/logo.jpg" alt="Real Travel" className="h-10 w-auto rounded-md object-contain shadow-sm" />
          <span className={`font-serif text-2xl font-bold tracking-tight hidden sm:block transition-colors ${isScrolled ? "text-primary" : "text-white drop-shadow-md"}`}>Real Travel</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <div className={`flex space-x-8 text-sm font-bold uppercase tracking-widest transition-colors ${isScrolled ? "text-foreground" : "text-white drop-shadow-sm"}`}>
            {SECTIONS.map((id) => (
              <button key={id} onClick={() => goToSection(id)} className={`transition-colors ${isScrolled ? "hover:text-accent" : "hover:text-accent"}`}>
                {labels[id]}
              </button>
            ))}
          </div>
          <a href={PHONE_HREF}>
            <Button className="rounded-[1.5rem] px-6 bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg transition-transform hover:-translate-y-0.5">{t.nav.call}</Button>
          </a>
          <LanguageSwitch isScrolled={isScrolled} />
        </div>

        <button
          className={`relative z-50 rounded-full p-3 transition-colors md:hidden ${isScrolled ? "text-primary hover:bg-muted" : "text-white hover:bg-white/20"}`}
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
