import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock3, Globe2, Instagram, MapPin, MapPinned, Phone, Search, Sparkles, Menu, X } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AdminPanel } from "@/admin-panel";
import { RegionKey, SharedTour, useSharedTravelData } from "@/lib/shared-travel-data";

type Language = "uz" | "ru" | "en";
type PublicRegionKey = "all" | RegionKey;

const copy = {
  uz: {
    navJourneys: "Sayohatlar",
    navAtelier: "Biz haqimizda",
    navContact: "Aloqa",
    navCall: "Qong'iroq qilish",
    heroEyebrow: "Premium sayohat tajribalari",
    heroTitleBefore: "Dunyoni",
    heroTitleAccent: "Real",
    heroTitleAfter: "Travel bilan kashf eting",
    heroText: "Admin panelda qo'shilgan yoki o'zgartirilgan sayohatlar shu yerda darrov ko'rinadi.",
    heroButton: "Sayohatlarni ko'rish",
    collectionTitle: "Sayohatlar kolleksiyasi",
    searchLabel: "Qidiruv",
    searchPlaceholder: "Masalan: Kyoto, Amalfi...",
    regionLabel: "Mintaqa",
    regionPlaceholder: "Mintaqani tanlang",
    maxPrice: "Maksimal narx",
    noTours: "Mos tur topilmadi. Filtrlarni o'zgartirib ko'ring.",
    cardButton: "Batafsil ko'rish",
    detailsEyebrow: "Batafsil dastur",
    detailsTitle: "Sayohat tafsilotlari",
    duration: "Davomiyligi",
    highlights: "Asosiy jihatlar",
    included: "Buyurtma yuborish",
    requestTitle: "So'rov yuborish",
    requestText: "Bu forma admin paneldagi orders bo'limiga tushadi.",
    fullName: "Ism familiya",
    phone: "Telefon",
    travelers: "Sayohatchilar soni",
    note: "Izoh",
    submit: "So'rov yuborish",
    processing: "Yuborilmoqda...",
    callback: "Buyurtma admin paneldagi ro'yxatga saqlandi.",
    successTitle: "So'rovingiz qabul qilindi",
    successText: "Bu buyurtma endi admin paneldagi orders bo'limida ko'rinadi.",
    returnButton: "Kolleksiyaga qaytish",
    aboutEyebrow: "Biz haqimizda",
    aboutTitleA: "Xotiralarni yaratamiz,",
    aboutTitleB: "oddiy marshrut emas.",
    aboutParagraphs: [
      "Real Travel sayti endi admin panel bilan bitta shared data asosida ishlaydi.",
      "Admin panelda tour qo'shsangiz yoki o'zgartirsangiz, shu foydalanuvchi bo'limida darrov aks etadi.",
      "Buyurtmalar ham shu saytdan to'g'ridan-to'g'ri admin panelga tushadi."
    ],
    footerText: "Sayt va admin panel bitta serverda, bitta ma'lumot oqimi bilan ishlaydi.",
    contact: "Aloqa",
    legal: "Huquqiy",
    terms: "Foydalanish shartlari",
    privacy: "Maxfiylik siyosati",
    cookies: "Cookie siyosati",
    copyright: "Barcha huquqlar himoyalangan.",
    regions: {
      all: "Barchasi",
      europe: "Yevropa",
      asia: "Osiyo",
      americas: "Amerika",
      africa: "Afrika"
    }
  },
  ru: {
    navJourneys: "Туры",
    navAtelier: "О нас",
    navContact: "Контакты",
    navCall: "Позвонить",
    heroEyebrow: "Премиальные путешествия",
    heroTitleBefore: "Откройте мир вместе с",
    heroTitleAccent: "Real",
    heroTitleAfter: "Travel",
    heroText: "Туры, добавленные или измененные в админке, сразу появляются здесь.",
    heroButton: "Смотреть туры",
    collectionTitle: "Коллекция туров",
    searchLabel: "Поиск",
    searchPlaceholder: "Например: Kyoto, Amalfi...",
    regionLabel: "Регион",
    regionPlaceholder: "Выберите регион",
    maxPrice: "Максимальная цена",
    noTours: "Подходящих туров не найдено.",
    cardButton: "Подробнее",
    detailsEyebrow: "Подробная программа",
    detailsTitle: "Детали тура",
    duration: "Длительность",
    highlights: "Ключевые детали",
    included: "Отправка заявки",
    requestTitle: "Оставить заявку",
    requestText: "Эта форма сразу попадает в раздел orders в админке.",
    fullName: "Имя и фамилия",
    phone: "Телефон",
    travelers: "Количество туристов",
    note: "Комментарий",
    submit: "Отправить заявку",
    processing: "Отправка...",
    callback: "Заявка сохранена в очереди admin panel.",
    successTitle: "Заявка принята",
    successText: "Теперь эта заявка видна в разделе orders админ-панели.",
    returnButton: "Вернуться к турам",
    aboutEyebrow: "О нас",
    aboutTitleA: "Мы создаем воспоминания,",
    aboutTitleB: "а не просто маршрут.",
    aboutParagraphs: [
      "Сайт Real Travel теперь работает на общей базе данных local storage с admin panel.",
      "Если админ добавит тур или изменит цену, пользовательская часть увидит это сразу.",
      "Заказы, отправленные отсюда, появляются в admin orders."
    ],
    footerText: "Сайт и admin panel теперь работают на одном сервере и с одними данными.",
    contact: "Контакты",
    legal: "Правовая информация",
    terms: "Условия использования",
    privacy: "Политика конфиденциальности",
    cookies: "Политика cookie",
    copyright: "Все права защищены.",
    regions: {
      all: "Все",
      europe: "Европа",
      asia: "Азия",
      americas: "Америка",
      africa: "Африка"
    }
  },
  en: {
    navJourneys: "Journeys",
    navAtelier: "Atelier",
    navContact: "Contact",
    navCall: "Call Now",
    heroEyebrow: "Curated luxury experiences",
    heroTitleBefore: "Discover the world with",
    heroTitleAccent: "Real",
    heroTitleAfter: "Travel",
    heroText: "Tours created or updated in the admin panel now appear here instantly.",
    heroButton: "Explore journeys",
    collectionTitle: "The Collection",
    searchLabel: "Search",
    searchPlaceholder: "e.g. Kyoto, Amalfi...",
    regionLabel: "Region",
    regionPlaceholder: "Select a region",
    maxPrice: "Max price",
    noTours: "No tours match your filters yet.",
    cardButton: "View details",
    detailsEyebrow: "Detailed program",
    detailsTitle: "Journey details",
    duration: "Duration",
    highlights: "Key details",
    included: "Inquiry flow",
    requestTitle: "Request itinerary",
    requestText: "This form now lands directly in the admin orders queue.",
    fullName: "Full name",
    phone: "Phone",
    travelers: "Travelers",
    note: "Note",
    submit: "Submit inquiry",
    processing: "Sending...",
    callback: "The order has been saved into the admin queue.",
    successTitle: "Inquiry received",
    successText: "This booking is now visible in the admin orders section.",
    returnButton: "Return to collection",
    aboutEyebrow: "The Atelier",
    aboutTitleA: "Crafting memories,",
    aboutTitleB: "not just itineraries.",
    aboutParagraphs: [
      "Real Travel now runs the public website and admin panel from one shared data source.",
      "If the admin adds a tour or edits the price, this user view updates instantly.",
      "Bookings submitted here appear in the admin orders section."
    ],
    footerText: "The public site and admin area now run on one server with shared data.",
    contact: "Contact",
    legal: "Legal",
    terms: "Terms of service",
    privacy: "Privacy policy",
    cookies: "Cookie policy",
    copyright: "All rights reserved.",
    regions: {
      all: "All",
      europe: "Europe",
      asia: "Asia",
      americas: "Americas",
      africa: "Africa"
    }
  }
};

function TourModal({
  language,
  tour,
  isOpen,
  onClose
}: {
  language: Language;
  tour: SharedTour | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = copy[language];
  const { orders, saveOrders } = useSharedTravelData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    travelers: 1,
    notes: ""
  });

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    setFormData({ ...formData, phone: digits });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tour) return;
    setIsSubmitting(true);

    window.setTimeout(() => {
      saveOrders([
        {
          id: `o${Date.now()}`,
          orderNumber: `RT-${1042 + orders.length + 1}`,
          customerName: formData.customerName,
          email: "",
          phone: `+998 ${formData.phone}`,
          travelers: formData.travelers,
          tourId: tour.id,
          date: new Date().toISOString(),
          status: "New",
          totalAmount: tour.price * formData.travelers,
          notes: formData.notes
        },
        ...orders
      ]);
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 800);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    window.setTimeout(() => {
      setIsSuccess(false);
      setFormData({ customerName: "", phone: "", travelers: 1, notes: "" });
    }, 200);
  };

  if (!tour) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl border-border p-0 overflow-hidden bg-white">
        {!isSuccess ? (
          <div className="grid md:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b md:border-b-0 md:border-r border-border/60">
              <div className="relative h-56 md:h-full min-h-[340px] overflow-hidden">
                <img src={tour.image} alt={tour.name} className="h-full w-full object-contain bg-muted/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/35 to-transparent" />
                <div className="absolute left-6 right-6 bottom-6 text-white">
                  <p className="mb-2 text-xs uppercase tracking-[0.25em] text-white/75">{t.detailsEyebrow}</p>
                  <h2 className="font-serif text-3xl md:text-4xl">{tour.name}</h2>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">${tour.price}</span>
                    <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{tour.duration} {language === "ru" ? "дней" : language === "uz" ? "kun" : "days"}</span>
                    <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{copy[language].regions[tour.region]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[85vh] overflow-y-auto p-6 md:p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="font-serif text-3xl text-primary">{t.detailsTitle}</DialogTitle>
                <DialogDescription>{tour.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="rounded-2xl bg-secondary/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                    <Clock3 className="h-4 w-4 text-accent" />
                    {t.duration}
                  </div>
                  <p className="text-sm text-muted-foreground">{tour.duration} {language === "ru" ? "дней насыщенной программы" : language === "uz" ? "kunlik dastur" : "days of curated travel"}</p>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="h-4 w-4 text-accent" />
                    {t.highlights}
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" /><span>{tour.location}</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" /><span>{tour.description}</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" /><span>${tour.price.toLocaleString()} / {language === "ru" ? "чел." : language === "uz" ? "kishi" : "traveler"}</span></li>
                  </ul>
                </div>

                <div className="border-t border-border/70 pt-6">
                  <h3 className="font-serif text-2xl text-primary mb-2">{t.requestTitle}</h3>
                  <p className="text-sm text-muted-foreground mb-5">{t.requestText}</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t.fullName}</Label>
                      <Input id="name" required value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t.phone}</Label>
                      <div className="flex items-center rounded-md border border-input bg-background">
                        <span className="px-3 text-sm text-muted-foreground border-r border-input">+998</span>
                        <Input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          required
                          minLength={9}
                          maxLength={9}
                          pattern="[0-9]{9}"
                          value={formData.phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="border-0 shadow-none focus-visible:ring-0"
                          placeholder="901234567"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="travelers">{t.travelers}</Label>
                      <Input id="travelers" type="number" min={1} value={formData.travelers} onChange={(e) => setFormData({ ...formData, travelers: Number(e.target.value) || 1 })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">{t.note}</Label>
                      <Input id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-widest h-12">
                      {isSubmitting ? t.processing : t.submit}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground font-light">{t.callback}</p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
              <CheckCircle2 className="w-16 h-16 text-accent mb-6" />
            </motion.div>
            <h3 className="font-serif text-3xl text-primary mb-4">{t.successTitle}</h3>
            <p className="text-muted-foreground font-light mb-8 max-w-xs">{t.successText}</p>
            <Button onClick={handleClose} variant="outline" className="rounded-none border-primary text-primary uppercase tracking-widest">
              {t.returnButton}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PublicSite() {
  const { tours, isLoaded } = useSharedTravelData();

  const maxTourPrice = useMemo(() => {
    if (!tours || tours.length === 0) return 10000;
    return Math.max(...tours.map((t) => t.price));
  }, [tours]);

  const [language, setLanguage] = useState<Language>("uz");
  const [selectedTour, setSelectedTour] = useState<SharedTour | null>(null);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<PublicRegionKey>("all");
  const [priceRange, setPriceRange] = useState([10000]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = copy[language];

  useEffect(() => {
    setPriceRange((prev) => [Math.max(prev[0], maxTourPrice)]);
  }, [maxTourPrice]);

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const matchSearch = `${tour.name} ${tour.location} ${tour.description}`.toLowerCase().includes(search.toLowerCase());
      const matchRegion = region === "all" || tour.region === region;
      const matchPrice = tour.price <= priceRange[0];
      return matchSearch && matchRegion && matchPrice;
    });
  }, [priceRange, region, search, tours]);

  useEffect(() => {
    if (!isLoaded) return;
    if (selectedTour) {
      const nextSelected = tours.find((tour) => tour.id === selectedTour.id) || null;
      setSelectedTour(nextSelected);
    }
  }, [isLoaded, selectedTour, tours]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <TooltipProvider>
      <div className="min-h-[100dvh] w-full flex flex-col bg-background font-sans">
        <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-sm py-4">
          <div className="container mx-auto px-6 md:px-12 flex items-center justify-between gap-4">
            <button type="button" className="cursor-pointer z-50 relative" onClick={() => scrollTo("hero")}>
              <img src="/logo.jpg" alt="Real Travel" className="h-12 w-auto rounded-md object-contain" />
            </button>
            <div className="hidden md:flex items-center gap-8">
              <div className="flex space-x-8 text-sm font-medium tracking-widest uppercase text-foreground">
                <button onClick={() => scrollTo("tours")} className="hover:text-accent transition-colors">{t.navJourneys}</button>
                <button onClick={() => scrollTo("about")} className="hover:text-accent transition-colors">{t.navAtelier}</button>
                <button onClick={() => scrollTo("contact")} className="hover:text-accent transition-colors">{t.navContact}</button>
              </div>
              <a href="tel:+998702277147">
                <Button className="rounded-full px-5">{t.navCall}</Button>
              </a>
              <div className="flex items-center gap-1 rounded-full border px-1 py-1 border-primary/10 bg-white">
                <Globe2 className="ml-2 h-4 w-4 text-primary" />
                {(["uz", "ru", "en"] as Language[]).map((lang) => (
                  <button key={lang} type="button" onClick={() => setLanguage(lang)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${language === lang ? "bg-accent text-primary" : "text-primary/70"}`}>
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Toggle Button */}
            <button 
              className="md:hidden z-50 p-2 text-primary hover:bg-secondary rounded-full transition-colors relative"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 w-full bg-white shadow-lg border-t border-border flex flex-col md:hidden py-6 px-6 gap-6"
              >
                <div className="flex flex-col space-y-4 text-sm font-medium tracking-widest uppercase text-foreground">
                  <button onClick={() => { scrollTo("tours"); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-accent transition-colors">{t.navJourneys}</button>
                  <button onClick={() => { scrollTo("about"); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-accent transition-colors">{t.navAtelier}</button>
                  <button onClick={() => { scrollTo("contact"); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-accent transition-colors">{t.navContact}</button>
                </div>
                
                <div className="flex items-center gap-1 rounded-full border px-1 py-1 border-primary/10 bg-white w-fit">
                  <Globe2 className="ml-2 h-4 w-4 text-primary" />
                  {(["uz", "ru", "en"] as Language[]).map((lang) => (
                    <button key={lang} type="button" onClick={() => { setLanguage(lang); setIsMobileMenuOpen(false); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${language === lang ? "bg-accent text-primary" : "text-primary/70"}`}>
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                <a href="tel:+998702277147" className="w-full">
                  <Button className="w-full rounded-full px-5 h-12 text-base">{t.navCall}</Button>
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <main className="flex-1">
          <section id="hero" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <motion.div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('/hero.png')" }} animate={{ scale: 1.05 }} transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }} />
              <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
            </div>

            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-20">
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-accent uppercase tracking-[0.3em] text-sm md:text-base mb-6">
                {t.heroEyebrow}
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-8 leading-tight">
                {t.heroTitleBefore} <span className="italic font-light">{t.heroTitleAccent}</span> {t.heroTitleAfter}
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto mb-12">
                {t.heroText}
              </motion.p>
              <Button onClick={() => scrollTo("tours")} className="bg-accent hover:bg-accent/90 text-primary px-8 py-6 text-lg rounded-none uppercase tracking-widest font-medium">
                {t.heroButton}
              </Button>
            </div>
          </section>

          <section id="tours" className="py-24 md:py-32 bg-secondary">
            <div className="container mx-auto px-6 md:px-12">
              <div className="mb-16 md:mb-24 text-center">
                <h2 className="text-4xl md:text-5xl font-serif text-primary mb-6">{t.collectionTitle}</h2>
                <div className="w-12 h-0.5 bg-accent mx-auto"></div>
              </div>

              <div className="mb-12 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-3 block">{t.searchLabel}</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder={t.searchPlaceholder} className="pl-9 bg-secondary/50 border-transparent focus-visible:border-accent" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-3 block">{t.regionLabel}</Label>
                    <Select value={region} onValueChange={(value) => setRegion(value as PublicRegionKey)}>
                      <SelectTrigger className="bg-secondary/50 border-transparent focus:ring-accent"><SelectValue placeholder={t.regionPlaceholder} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.regions.all}</SelectItem>
                        <SelectItem value="europe">{t.regions.europe}</SelectItem>
                        <SelectItem value="asia">{t.regions.asia}</SelectItem>
                        <SelectItem value="americas">{t.regions.americas}</SelectItem>
                        <SelectItem value="africa">{t.regions.africa}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{t.maxPrice}</Label>
                      <span className="text-sm font-medium">${priceRange[0]}</span>
                    </div>
                    <Slider min={2000} max={Math.max(10000, maxTourPrice)} step={500} value={priceRange} onValueChange={setPriceRange} className="py-2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                <AnimatePresence mode="popLayout">
                  {filteredTours.map((tour, i) => (
                    <motion.button
                      type="button"
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, delay: i * 0.08 }}
                      key={tour.id}
                      onClick={() => setSelectedTour(tour)}
                      className="group relative overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative h-72 md:h-80 overflow-hidden">
                        <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                        <img src={tour.image} alt={tour.name} className="w-full h-full object-contain bg-muted/10 transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                        <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wider">${tour.price}</div>
                      </div>
                      <div className="p-8">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center text-accent text-sm font-medium tracking-wider"><MapPin className="w-4 h-4 mr-1" />{t.regions[tour.region]}</div>
                          <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground"><Clock3 className="h-4 w-4" />{tour.duration} {language === "ru" ? "дн." : language === "uz" ? "kun" : "days"}</div>
                        </div>
                        <h3 className="text-2xl font-serif text-primary mb-4">{tour.name}</h3>
                        <p className="text-muted-foreground font-light leading-relaxed mb-4">{tour.location}</p>
                        <p className="text-muted-foreground font-light leading-relaxed mb-8">{tour.description}</p>
                        <div className="inline-flex w-full items-center justify-center rounded-none border border-primary/20 px-4 py-4 text-xs uppercase tracking-widest text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                          {t.cardButton}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
                {filteredTours.length === 0 ? <div className="col-span-full py-24 text-center"><p className="text-muted-foreground font-serif text-xl">{t.noTours}</p></div> : null}
              </div>
            </div>
          </section>

          <section id="about" className="py-24 md:py-32 bg-white">
            <div className="container mx-auto px-6 md:px-12 max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-accent uppercase tracking-[0.3em] text-sm mb-6">{t.aboutEyebrow}</h2>
                  <h3 className="text-4xl md:text-5xl font-serif text-primary mb-8 leading-tight">{t.aboutTitleA} <br /><span className="italic">{t.aboutTitleB}</span></h3>
                  <div className="space-y-6 text-muted-foreground font-light leading-relaxed">
                    {t.aboutParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                </div>
                <div className="relative h-[600px] rounded-2xl overflow-hidden">
                  <img src={tours[0]?.image || "/tours/santorini.png"} alt="Travel Experience" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border border-white/20 m-4 rounded-xl pointer-events-none"></div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer id="contact" className="bg-primary text-white pt-24 pb-12 border-t border-accent/20">
          <div className="container mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
              <div className="md:col-span-2">
                <div className="font-serif text-3xl mb-6">REAL <span className="text-accent italic">Travel</span></div>
                <p className="text-white/60 font-light max-w-sm leading-relaxed mb-8">{t.footerText}</p>
                <div className="flex space-x-5">
                  <a href="https://www.instagram.com/realtravel.uz/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-accent hover:border-accent transition-colors"><Instagram className="w-4 h-4" /></a>
                </div>
              </div>
              <div>
                <h4 className="uppercase tracking-[0.2em] text-xs font-semibold text-white/50 mb-6">{t.contact}</h4>
                <ul className="space-y-4 font-light text-white/80 text-sm">
                  <li className="flex items-center"><Phone className="w-4 h-4 mr-3 text-accent" /> +998 70 227 71 47</li>
                  <li className="flex items-start"><MapPinned className="w-4 h-4 mr-3 text-accent mt-0.5" /> Xorazm viloyati xonqa tumani</li>
                  <li className="flex items-center"><Instagram className="w-4 h-4 mr-3 text-accent" /> @realtravel.uz</li>
                </ul>
              </div>
              <div>
                <h4 className="uppercase tracking-[0.2em] text-xs font-semibold text-white/50 mb-6">{t.legal}</h4>
                <ul className="space-y-3 font-light text-white/80 text-sm">
                  <li><a href="#" className="hover:text-accent transition-colors">{t.terms}</a></li>
                  <li><a href="#" className="hover:text-accent transition-colors">{t.privacy}</a></li>
                  <li><a href="#" className="hover:text-accent transition-colors">{t.cookies}</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10 text-center text-xs font-light text-white/40 tracking-wider">&copy; {new Date().getFullYear()} REAL TRAVEL. {t.copyright}</div>
          </div>
        </footer>

        <TourModal language={language} tour={selectedTour} isOpen={!!selectedTour} onClose={() => setSelectedTour(null)} />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (pathname.startsWith("/admin")) {
    return <AdminPanel />;
  }

  return <PublicSite />;
}
