import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Star, CheckCircle2, Phone, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";
import { Input } from "@/components/ui/input";
import { useSharedTravelData } from "@/lib/shared-travel-data";
import { isVideoUrl } from "@/lib/upload-image";

const HONEYMOON_TOURS = [
  {
    id: "maldives-honeymoon",
    title: "Maldiv Orollari",
    country: "Maldiv",
    duration: "7 Kun",
    price: "24,000,000 UZS",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
    description: "Ocean Pool Villa, 5 yulduzli xizmat va to'liq pansion."
  },
  {
    id: "bali-romance",
    title: "Bali Romantikasi",
    country: "Indoneziya",
    duration: "8 Kun",
    price: "18,500,000 UZS",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
    description: "Ubud o'rmonlari va muqaddas ibodatxonalar."
  },
  {
    id: "paris-love",
    title: "Parij Oqshomlari",
    country: "Fransiya",
    duration: "5 Kun",
    price: "21,000,000 UZS",
    image: "https://images.unsplash.com/photo-1502602881460-59df98cb332a?auto=format&fit=crop&w=800&q=80",
    description: "Eyfel minorasi manzarasidagi lyuks mehmonxona."
  }
];

const POPULAR_COUNTRIES = [
  { name: "Xitoy", image: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80" },
  { name: "Misr", image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80" },
  { name: "Azerbaijan", image: "https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=800&q=80" },
  { name: "Turkiya", image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80" },
  { name: "Indoneziya", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80" },
  { name: "BAA", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80" },
];

const FAQS = [
  {
    q: "Turlarni qanday qilib band qilsam bo'ladi?",
    a: "Saytdagi 'Turni band qilish' tugmasini bosing va o'z ma'lumotlaringizni qoldiring. Menejerlarimiz tez orada siz bilan bog'lanishadi."
  },
  {
    q: "Premium turlarga nimalar kiradi?",
    a: "Barcha premium turlarimiz 5 yulduzli mehmonxonalar, shaxsiy transferlar va eksklyuziv ekskursiyalarni o'z ichiga oladi."
  },
  {
    q: "To'lov qanday amalga oshiriladi?",
    a: "To'lov ofisimizda shartnoma asosida naqd yoki pul o'tkazish yo'li bilan amalga oshiriladi."
  }
];

export function HomePage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedTourName, setSelectedTourName] = useState<string | undefined>();
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | undefined>();
  const { tours, homeGallery, reviews } = useSharedTravelData();

  // Show up to 3 tours on the home page as featured tours
  const featuredTours = tours.slice(0, 3);
  
  // Gallery images with fallbacks
  const galleryImages = [
    homeGallery[0] || (tours[0]?.image || "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80"),
    homeGallery[1] || (tours[1]?.image || "https://images.unsplash.com/photo-1511225070737-5af5ac9a690d?auto=format&fit=crop&w=800&q=80"),
    homeGallery[2] || (tours[2]?.image || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80"),
    homeGallery[3] || (tours[3]?.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80")
  ];
  // Admin-managed media (images/videos); falls back to the defaults above.
  const galleryItems = homeGallery.length > 0 ? homeGallery : galleryImages;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/tours?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/tours");
    }
  };

  const handleBook = (tourName?: string, tourSlug?: string) => {
    setSelectedTourName(tourName);
    setSelectedTourSlug(tourSlug);
    setIsBookingOpen(true);
  };

  return (
    <div className="font-sans">
      {/* HERO SECTION */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=90"
            alt="Hero Background" 
            className="w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite]"
          />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto text-center px-6 mt-16">
          <div className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white font-medium tracking-[0.2em] text-xs md:text-sm uppercase shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-[#F5B400] animate-pulse" /> Premium Tur Operator
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-[140px] font-bold text-white tracking-tighter leading-[0.9] mb-8 drop-shadow-2xl font-heading">
            Sayohatni<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B400] to-[#ffd043] italic pr-4">his qiling.</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-white/90 font-light max-w-3xl mx-auto mb-16 drop-shadow-md">
            Dunyodagi eng sara sayohatlar va unutilmas sarguzashtlar.
          </p>

          {/* SEARCH BAR (Premium) */}
          <div className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-xl p-2.5 rounded-full border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-grow w-full">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Qayerga sayohat qilmoqchisiz?"
                  className="w-full h-16 pl-8 rounded-full border-none bg-transparent focus-visible:ring-0 text-white placeholder:text-white/70 text-lg md:text-xl font-light"
                />
              </div>
              <button 
                type="submit" 
                className="w-16 h-16 flex-shrink-0 rounded-full bg-gradient-to-tr from-[#F5B400] to-[#ffd043] hover:scale-105 text-slate-900 flex items-center justify-center transition-all mr-1 shadow-lg"
              >
                <Search className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ASAL OYI TURLARI */}
      <section className="py-32 px-6 max-w-7xl mx-auto font-sans">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-slate-900 tracking-tight mb-4 font-heading">Eksklyuziv Turlar</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Premium toifadagi maxsus romantik va qiziqarli sayohat paketlari.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredTours.map((tour) => (
            <div 
              key={tour.id} 
              onClick={() => setLocation(`/tour/${tour.slug}`)}
              className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100 cursor-pointer"
            >
              <div className="relative h-72 w-full overflow-hidden">
                <img src={tour.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"} alt={tour.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                  {tour.location}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow bg-gradient-to-b from-white to-slate-50/50">
                <h3 className="text-xl font-semibold text-slate-900 mb-2 font-heading group-hover:text-[#2298F0] transition-colors">{tour.name}</h3>
                <span className="text-2xl font-light text-[#2298F0] mb-4">
                  {tour.priceUzs ? `${Number(tour.priceUzs).toLocaleString("uz-UZ")} so'm` : `$${tour.price.toLocaleString()}`}
                </span>
                <p className="text-sm text-slate-500 mb-8 flex-grow leading-relaxed line-clamp-3">{tour.description}</p>
                
                <div className="flex items-center justify-between mt-auto gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full text-[#2298F0] border-[#2298F0] group-hover:bg-[#2298F0] group-hover:text-white rounded-xl py-6 font-medium transition-all pointer-events-none"
                  >
                    Tafsilotlar
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBook(tour.name, tour.slug);
                    }} 
                    className="w-full bg-[#F5B400] hover:bg-[#e0a500] text-slate-900 rounded-xl py-6 font-semibold transition-all shadow-md hover:shadow-lg relative z-20 hover:-translate-y-0.5"
                  >
                    Band qilish
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {featuredTours.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-500">
              Hozircha turlar mavjud emas. Admin paneldan qo'shing.
            </div>
          )}
        </div>
      </section>

      {/* MASHHUR DAVLATLAR */}
      <section className="py-32 px-6 font-sans bg-slate-900 mb-20 rounded-[3rem] mx-4 md:mx-12 overflow-hidden relative">
        <div className="absolute inset-0 bg-[#2298F0]/5 pointer-events-none mix-blend-screen" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight mb-4 font-heading text-center">
              Mashhur davlatlar
            </h2>
            <p className="text-white/60 font-light max-w-xl text-center">
              Eng ko'p sayohat qilinadigan va sevib tanlanadigan manzillar
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {POPULAR_COUNTRIES.map((country, idx) => (
              <Link key={idx} href={`/tours?country=${encodeURIComponent(country.name)}`} className="group block relative h-72 md:h-96 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10 hover:ring-white/30 transition-all duration-500">
                <img src={country.image} alt={country.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-8">
                  <span className="text-3xl md:text-4xl font-light text-white drop-shadow-sm mb-2 group-hover:text-[#F5B400] transition-colors font-heading">{country.name}</span>
                  <div className="w-12 h-1 bg-[#2298F0] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM XIZMATLAR */}
      <section className="py-32 px-6 max-w-7xl mx-auto font-sans relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#2298F0]/5 rounded-full blur-3xl -z-10" />
        
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-light text-slate-900 tracking-tight mb-4 font-heading">Nega aynan biz?</h2>
          <p className="text-slate-500 max-w-xl mx-auto font-light">Boshqalardan ajralib turadigan o'ziga xos qulayliklarimiz</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          <div className="flex flex-col items-center p-12 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-500 border border-slate-100 text-center group">
            <div className="w-20 h-20 mb-8 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-[#F5B400]/10 transition-colors duration-500">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#F5B400]">
                <path d="M12 2L4 22H7.5L9.5 16H14.5L16.5 22H20L12 2Z" fill="currentColor" />
                <path d="M10.7 12L12 8L13.3 12H10.7Z" fill="white" />
              </svg>
            </div>
            <h3 className="text-2xl font-medium text-slate-900 mb-4 font-heading group-hover:text-[#2298F0] transition-colors">Premium Xizmat</h3>
            <p className="text-slate-500 text-base font-light leading-relaxed">Bizning barcha turlarimiz yuqori sifat va mutlaq lyuks sharoitlarni kafolatlaydi.</p>
          </div>
          <div className="flex flex-col items-center p-12 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-500 border border-slate-100 text-center group">
            <div className="w-20 h-20 mb-8 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-[#F5B400]/10 transition-colors duration-500">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#F5B400]">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-medium text-slate-900 mb-4 font-heading group-hover:text-[#2298F0] transition-colors">Ortiqcha xarajatsiz</h3>
            <p className="text-slate-500 text-base font-light leading-relaxed">Agentlik bilan to'g'ridan-to'g'ri aloqa o'rnatib, ortiqcha vositachilarsiz sayohat qiling.</p>
          </div>
          <div className="flex flex-col items-center p-12 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-500 border border-slate-100 text-center group">
            <div className="w-20 h-20 mb-8 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-[#F5B400]/10 transition-colors duration-500">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#F5B400]">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-medium text-slate-900 mb-4 font-heading group-hover:text-[#2298F0] transition-colors">24/7 Qo'llab-quvvatlash</h3>
            <p className="text-slate-500 text-base font-light leading-relaxed">Sayohat davomida har qanday yordam uchun mutaxassislarimiz doim aloqada.</p>
          </div>
        </div>
      </section>

      {/* MIJOZLAR FIKRI */}
      <section className="py-32 px-6 max-w-7xl mx-auto font-sans text-center">
        <h2 className="text-4xl md:text-5xl font-light text-slate-900 tracking-tight mb-20 font-heading">
          Mijozlarimiz fikri
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-500">
              Hozircha mijozlar fikri mavjud emas.
            </div>
          )}
          {reviews.map((review, idx) => (
            <div key={idx} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 text-center shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#F5B400] rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                &ldquo;
              </div>
              <div className="flex items-center justify-center gap-1 mb-8 mt-6">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#F5B400] text-[#F5B400]" />
                ))}
              </div>
              <p className="text-slate-600 text-lg leading-relaxed mb-8 italic">"{review.text}"</p>
              <div className="font-semibold text-slate-900 text-lg">{review.author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GALEREYA */}
      <section className="py-32 px-6 max-w-7xl mx-auto font-sans text-center mb-10">
        <div className="mb-20">
          <h2 className="text-4xl md:text-5xl font-light text-slate-900 tracking-tight mb-4 font-heading">REAL TRAVEL <br/> sarguzashtlaridan namunalar</h2>
          <p className="text-slate-500 max-w-xl mx-auto font-light">Biz bilan sayohat qilgan mijozlarimizning ajoyib damlaridan yorqin lavhalar</p>
        </div>
        
        {/* Masonry — grows with however many images/videos the admin adds. */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 [column-fill:_balance]">
          {galleryItems.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="group relative mb-4 md:mb-6 break-inside-avoid overflow-hidden rounded-[2rem] shadow-lg"
            >
              {isVideoUrl(src) ? (
                <video
                  src={src}
                  muted
                  loop
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              ) : (
                <img
                  src={src}
                  alt="Sarguzasht"
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-slate-900/0 transition-colors duration-500 group-hover:bg-slate-900/15" />
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-6 max-w-4xl mx-auto font-sans">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-slate-900 tracking-tight mb-4 font-heading">Tez-tez beriladigan savollar</h2>
          <p className="text-slate-500 font-light text-lg">Sayohatga oid savollaringizga qisqa javoblar</p>
        </div>
        
        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#2298F0]/30 transition-colors">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left px-8 py-6 text-lg font-medium text-slate-900 focus:outline-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-[#2298F0] transition-transform duration-300 flex-shrink-0 ml-4 ${openFaq === idx ? "rotate-180" : ""}`} />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="px-8 pb-6 pt-2 text-slate-600 leading-relaxed font-light text-base">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} tourName={selectedTourName} tourSlug={selectedTourSlug} />
    </div>
  );
}
