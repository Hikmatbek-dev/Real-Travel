import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Check, X, MapPin, Calendar, Users, ChevronDown, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";
import { useSharedTravelData } from "@/lib/shared-travel-data";

export function TourDetailPage() {
  const [, params] = useRoute("/tour/:id");
  const [, setLocation] = useLocation();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  const { tours } = useSharedTravelData();
  const dbTour = tours.find(t => t.slug === params?.id);

  if (!dbTour) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center font-sans">
        <h1 className="text-3xl font-light text-slate-900 mb-4">Tur topilmadi</h1>
        <Button onClick={() => setLocation("/tours")} className="bg-[#2298F0] hover:bg-[#1a85d6] text-white">Barcha turlarga qaytish</Button>
      </div>
    );
  }

  // Transform dbTour to match the expected format
  const tour = {
    id: dbTour.id,
    title: dbTour.name,
    subtitle: dbTour.location,
    price: dbTour.priceUzs ? `${Number(dbTour.priceUzs).toLocaleString("uz-UZ")} so'm` : `$${dbTour.price.toLocaleString()}`,
    duration: `${dbTour.duration} Kun`,
    heroImage: dbTour.image || "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1920&q=80",
    description: dbTour.description,
    included: dbTour.included?.length > 0 ? dbTour.included : ["Xizmatlar tez orada qo'shiladi"],
    notIncluded: dbTour.excluded?.length > 0 ? dbTour.excluded : ["Xizmatlar tez orada qo'shiladi"],
    timeline: dbTour.itinerary?.length > 0 ? dbTour.itinerary : [{ day: 1, title: "Sayohat boshlanishi", text: "Tez orada batafsil ma'lumot joylanadi." }],
    gallery: dbTour.gallery?.length > 0 ? dbTour.gallery : [
      "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
      "https://images.unsplash.com/photo-1527528669527-df1e7d0db87b?w=800&q=80",
      "https://images.unsplash.com/photo-1522008629172-0c1737e56eb6?w=800&q=80"
    ],
    faqs: [
      { q: "Viza olish kerakmi?", a: "Ba'zi davlatlar uchun viza talab qilinishi mumkin. Menejerlarimiz batafsil ma'lumot berishadi." },
      { q: "Bolalar bilan borish qulaymi?", a: "Ha, ko'pchilik turlarimiz oilaviy hordiq uchun moslashtirilgan." },
      { q: "To'lov qanday amalga oshiriladi?", a: "To'lov ofisimizda shartnoma asosida naqd yoki pul o'tkazish yo'li bilan amalga oshiriladi." }
    ]
  };

  return (
    <div className="bg-white min-h-screen font-sans pb-32">
      {/* HERO IMAGE */}
      <div className="relative h-[60vh] md:h-[70vh] w-full">
        <img src={tour.heroImage} alt={tour.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-slate-900/10 to-transparent" />
      </div>

      <div className="max-w-[1000px] mx-auto px-6 md:px-12 -mt-32 relative z-10">
        {/* HEADER CARD */}
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl mb-16 border border-slate-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
            <div>
              <div className="text-sky-500 font-semibold tracking-widest text-xs uppercase mb-3">{tour.subtitle}</div>
              <h1 className="text-4xl md:text-5xl font-light text-slate-900 tracking-tight">{tour.title}</h1>
            </div>
            <div className="text-left md:text-right">
              <div className="text-3xl md:text-4xl font-medium text-slate-900 mb-2">{tour.price}</div>
              <div className="text-sm text-slate-500 flex items-center md:justify-end gap-1.5"><Calendar className="w-4 h-4" /> {tour.duration}</div>
            </div>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed font-light">{tour.description}</p>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
          <div>
            <h2 className="text-2xl font-light text-slate-900 mb-8 tracking-tight">Kiritilgan xizmatlar</h2>
            <ul className="space-y-4">
              {tour.included.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-slate-600 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-light text-slate-900 mb-8 tracking-tight">Kiritilmagan xizmatlar</h2>
            <ul className="space-y-4">
              {tour.notIncluded.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="text-slate-600 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="mb-24">
          <h2 className="text-3xl font-light text-slate-900 mb-12 tracking-tight">Sayohat dasturi</h2>
          <div className="space-y-8">
            {tour.timeline.map((item, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center font-medium text-lg shrink-0">
                    {item.day}
                  </div>
                  {idx !== tour.timeline.length - 1 && <div className="w-px h-full bg-slate-100 my-2" />}
                </div>
                <div className="pb-8 pt-2">
                  <h3 className="text-xl font-medium text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.text || item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PHOTO GALLERY */}
        <div className="mb-24">
          <h2 className="text-3xl font-light text-slate-900 mb-12 tracking-tight">Galereya</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tour.gallery.map((img, idx) => (
              <div key={idx} className={`rounded-3xl overflow-hidden h-64 ${idx === 0 ? "md:col-span-2 md:h-96" : ""}`}>
                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-24">
          <h2 className="text-3xl font-light text-slate-900 mb-12 tracking-tight">Ko'p beriladigan savollar</h2>
          <div className="space-y-6">
            {tour.faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-slate-100 pb-6">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-lg font-medium text-slate-900"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="mt-4 text-slate-600 leading-relaxed animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STICKY BOOKING BAR (BOTTOM) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 md:p-6 z-40 transform transition-transform">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
          <div className="hidden md:block">
            <div className="text-sm text-slate-500 mb-1">{tour.title}</div>
            <div className="text-2xl font-medium text-slate-900">{tour.price}</div>
          </div>
          <Button
            onClick={() => setIsBookingOpen(true)}
            className="w-full md:w-auto bg-amber-400 hover:bg-amber-500 text-slate-900 px-12 py-7 rounded-2xl text-base font-medium shadow-sm transition-all"
          >
            Turni band qilish
          </Button>
        </div>
      </div>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} tourName={tour.title} />
    </div>
  );
}
