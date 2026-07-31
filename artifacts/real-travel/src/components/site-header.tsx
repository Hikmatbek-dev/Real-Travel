import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGES, pathInLanguage, useLanguage, type Language } from "@/i18n";
import { PHONE_HREF } from "@/lib/company";

const SECTIONS = ["tours", "about", "contact"] as const;

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
    <div className={`flex items-center gap-1 rounded-full border px-1.5 py-1 shadow-sm transition-all ${
      isScrolled ? "bg-slate-900/90 border-slate-700" : "bg-black/40 border-white/20 backdrop-blur-md"
    }`}>
      <Globe2 className="ml-1.5 h-4 w-4 text-amber-400" />
      {LANGUAGES.map((lang: Language) => (
        <a
          key={lang}
          href={pathInLanguage(window.location.pathname, lang)}
          onClick={onPick}
          className={`rounded-full px-2.5 py-1 text-xs font-black transition-all ${
            language === lang
              ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md"
              : "text-slate-200 hover:text-white hover:bg-white/10"
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
    <nav className={`fixed top-0 z-50 w-full py-3.5 transition-all duration-300 ${
      isScrolled 
        ? "bg-slate-950/90 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl border-b border-slate-800/80 py-2.5" 
        : "bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent"
    }`}>
      <div className="container mx-auto flex items-center justify-between gap-4 px-6 md:px-12">
        <Link href="/" className="relative z-50 flex items-center gap-3 group">
          <img src="/logo.jpg" alt="Real Travel" className="h-10 w-auto rounded-xl object-contain shadow-md ring-2 ring-amber-400/40 group-hover:ring-amber-400 transition-all" />
          <span className="font-serif text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Real <span className="text-amber-400">Travel</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <div className="flex space-x-8 text-sm font-extrabold uppercase tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {SECTIONS.map((id) => (
              <button key={id} onClick={() => goToSection(id)} className="transition-all hover:text-amber-400 hover:scale-105">
                {labels[id]}
              </button>
            ))}
          </div>
          <a href={PHONE_HREF}>
            <Button className="rounded-full px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black shadow-lg hover:shadow-amber-500/20 transition-all hover:-translate-y-0.5">
              <Phone className="mr-2 h-4 w-4 fill-slate-950" />
              {t.nav.call}
            </Button>
          </a>
          <LanguageSwitch isScrolled={isScrolled} />
        </div>

        <button
          className="relative z-50 rounded-full p-2.5 text-white hover:bg-white/10 transition-colors md:hidden"
          aria-label="Menu"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6 text-amber-400" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full flex w-full flex-col gap-6 border-t border-slate-800 bg-slate-950/95 px-6 py-6 shadow-2xl backdrop-blur-2xl md:hidden text-white"
          >
            <div className="flex flex-col space-y-4 text-sm font-black uppercase tracking-widest text-slate-100">
              {SECTIONS.map((id) => (
                <button
                  key={id}
                  onClick={() => goToSection(id, () => setIsMobileMenuOpen(false))}
                  className="py-2 text-left transition-colors hover:text-amber-400"
                >
                  {labels[id]}
                </button>
              ))}
            </div>
            <a href={PHONE_HREF} onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full rounded-full bg-amber-400 text-slate-950 font-black py-3">
                <Phone className="mr-2 h-4 w-4 fill-slate-950" />
                {t.nav.call}
              </Button>
            </a>
            <LanguageSwitch onPick={() => setIsMobileMenuOpen(false)} isScrolled={true} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
