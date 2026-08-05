import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";
import { useLang, LANGS, LANG_LABELS } from "@/i18n/lang";

export function SiteHeader() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { t, lang, setLang } = useLang();

  const LangSwitch = ({ dark }: { dark?: boolean }) => (
    <div
      className={`inline-flex items-center rounded-full p-0.5 ${
        dark ? "bg-slate-100" : isScrolled ? "bg-slate-100" : "bg-white/15 backdrop-blur-md"
      }`}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
            lang === l
              ? "bg-[#F5B400] text-slate-900"
              : dark || isScrolled
                ? "text-slate-500 hover:text-slate-900"
                : "text-white/80 hover:text-white"
          }`}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.tours, href: "/tours" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" }
  ];

  return (
    <>
      <header
        className={`fixed top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-xl py-4 border-b border-slate-100 shadow-sm"
            : "bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-transparent pb-10 pt-6"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-6 md:px-12">
          <Link href="/" className="relative z-50 flex items-center group">
            <img 
              src="/logo.jpg" 
              alt="Real Travel Logo" 
              className="h-12 md:h-14 w-auto object-contain transition-transform duration-500 group-hover:scale-105 rounded-xl shadow-sm bg-white" 
            />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center space-x-10">
            {navLinks.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-all ${
                    isActive
                      ? "text-[#F5B400]"
                      : isScrolled ? "text-slate-700 hover:text-[#2298F0]" : "text-white/90 hover:text-white drop-shadow-md"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* LANG + BOOK BUTTON CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <LangSwitch />
            <Button
              onClick={() => setIsBookingOpen(true)}
              className="bg-[#F5B400] hover:bg-[#e0a500] text-slate-900 rounded-full px-8 py-6 text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {t.nav.book}
            </Button>
          </div>

          {/* MOBILE: lang + menu toggle */}
          <div className="flex items-center gap-3 lg:hidden">
            <LangSwitch />
            <button
              className={`p-2 rounded-full z-50 transition-colors ${isScrolled ? "text-slate-900 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
              onClick={() => setIsMobileMenuOpen((o) => !o)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl lg:hidden flex flex-col p-6"
            >
              <nav className="flex flex-col space-y-4 mb-8">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium text-slate-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsBookingOpen(true);
                }}
                className="bg-[#F5B400] hover:bg-[#e0a500] text-slate-900 rounded-2xl py-7 text-base font-semibold w-full shadow-md"
              >
                {t.nav.book}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </>
  );
}
