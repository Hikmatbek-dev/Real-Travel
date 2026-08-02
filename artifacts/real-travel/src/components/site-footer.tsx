import { Link } from "wouter";
import { Instagram, MapPin, Phone, MessageCircle, Clock } from "lucide-react";
import { COMPANY } from "@/lib/company";

export function SiteFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-24 pb-12 font-sans">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* BRANDING (Span 4) */}
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center group mb-6 w-fit">
              <img 
                src="/logo.jpg" 
                alt="Real Travel Logo" 
                className="h-12 md:h-14 w-auto object-contain transition-transform duration-500 group-hover:scale-105 rounded-xl shadow-sm bg-white" 
              />
            </Link>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8 font-light">
              Biz dunyo bo'ylab eng yaxshi lyuks turlarni va unutilmas sayohatlarni taqdim etuvchi premium turistik agentlikmiz. Sayohatni biz bilan his qiling.
            </p>
          </div>

          {/* MENUS (Span 4) */}
          <div className="md:col-span-4 flex flex-col sm:flex-row gap-12 sm:gap-24">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900 mb-6">Menyu</h4>
              <ul className="space-y-4 text-sm font-medium text-slate-500">
                <li><Link href="/" className="hover:text-[#2298F0] transition-colors">Bosh sahifa</Link></li>
                <li><Link href="/tours" className="hover:text-[#2298F0] transition-colors">Turlarimiz</Link></li>
                <li><Link href="/about" className="hover:text-[#2298F0] transition-colors">Biz haqimizda</Link></li>
                <li><Link href="/contact" className="hover:text-[#2298F0] transition-colors">Aloqa</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900 mb-6">Turlar</h4>
              <ul className="space-y-4 text-sm font-medium text-slate-500">
                <li><Link href="/tours" className="hover:text-[#2298F0] transition-colors">Asal oyi</Link></li>
                <li><Link href="/tours" className="hover:text-[#2298F0] transition-colors">Sarguzasht</Link></li>
                <li><Link href="/tours" className="hover:text-[#2298F0] transition-colors">Oila</Link></li>
                <li><Link href="/tours" className="hover:text-[#2298F0] transition-colors">Shaharlar</Link></li>
              </ul>
            </div>
          </div>

          {/* CONTACT INFO (Span 4) */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900 mb-6">Aloqa Ma'lumotlari</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li>
                <a href={`tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-3 hover:text-[#2298F0] transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#2298F0]/10 flex items-center justify-center transition-colors">
                    <Phone className="w-4 h-4 text-[#2298F0]" />
                  </div>
                  {COMPANY.phone}
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#2298F0]/10 flex items-center justify-center shrink-0 transition-colors">
                    <MapPin className="w-4 h-4 text-[#2298F0]" />
                  </div>
                  <span className="leading-relaxed mt-1">{COMPANY.address.uz}</span>
                </div>
              </li>
              <li>
                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#2298F0]/10 flex items-center justify-center shrink-0 transition-colors">
                    <Clock className="w-4 h-4 text-[#2298F0]" />
                  </div>
                  <span>Dush-Shan: 09:00 - 18:30</span>
                </div>
              </li>

              <li>
                <a href={COMPANY.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[#2298F0] transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#2298F0]/10 flex items-center justify-center shrink-0 transition-colors">
                    <Instagram className="w-4 h-4 text-[#2298F0]" />
                  </div>
                  @{COMPANY.instagram}
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* COPYRIGHT */}
        <div className="pt-8 border-t border-slate-100 flex flex-col items-center justify-center gap-1 text-xs text-slate-400 font-medium text-center">
          <p>© {new Date().getFullYear()} REAL TRAVEL. Barcha huquqlar himoyalangan.</p>
          <p>
            Developed by{" "}
            <a
              href="https://t.me/Hikmatdev"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#2298F0] hover:underline"
            >
              Hikmatdev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
