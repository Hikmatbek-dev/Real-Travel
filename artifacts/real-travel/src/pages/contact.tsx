import { useState } from "react";
import { Phone, MapPin, Instagram, Clock, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { COMPANY } from "@/lib/company";

export function ContactPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="font-sans bg-white pb-32">
      {/* HEADER HERO */}
      <section className="relative h-[60vh] flex flex-col justify-center overflow-hidden mb-24">
        <div className="absolute inset-0 z-0 bg-slate-900">
          <img src="https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=2000&q=85" alt="Aloqa" className="w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite] opacity-90" />
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent pointer-events-none" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 w-full text-center mt-20">
          <h1 className="text-5xl md:text-7xl lg:text-[90px] font-bold text-white tracking-tighter mb-6 font-heading drop-shadow-2xl">
            Biz bilan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B400] to-[#ffd043] italic pr-2">bog'laning</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 font-light max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Sizning sayohatingiz shu yerdan boshlanadi. Barcha savollaringizga javob berishga va eng yaxshi turni tanlashga tayyormiz.
          </p>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-6 md:px-12">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-32">
          {/* CONTACT INFO */}
          <div>
            <h2 className="text-3xl font-light text-slate-900 tracking-tight mb-12 font-heading">Aloqa ma'lumotlari</h2>
            
            <div className="space-y-12">
              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-[#2298F0]/10 text-[#2298F0] flex items-center justify-center shrink-0 transition-colors">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-2 font-heading">Telefon raqam</h3>
                  <a href={`tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`} className="text-xl text-slate-600 hover:text-[#2298F0] transition-colors font-medium">
                    {COMPANY.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-[#2298F0]/10 text-[#2298F0] flex items-center justify-center shrink-0 transition-colors">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-2 font-heading">Manzil</h3>
                  <p className="text-lg text-slate-600 leading-relaxed font-light">
                    {COMPANY.address.uz}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-[#2298F0]/10 text-[#2298F0] flex items-center justify-center shrink-0 transition-colors">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-2 font-heading">Ish vaqti</h3>
                  <p className="text-lg text-slate-600 font-light mb-1">Dushanbadan shanbagacha 9:00 dan 18:30 gacha</p>
                  <p className="text-lg text-slate-600 font-light">Yakshanba: Dam olish kuni</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-[#2298F0]/10 text-[#2298F0] flex items-center justify-center shrink-0 transition-colors">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-2 font-heading">Ijtimoiy tarmoqlar</h3>
                  <a href={COMPANY.instagramUrl} target="_blank" rel="noreferrer" className="text-lg text-slate-600 hover:text-[#2298F0] transition-colors block font-light mb-1">
                    @{COMPANY.instagram}
                  </a>

                </div>
              </div>
            </div>
          </div>

          {/* CONTACT FORM */}
          <div className="bg-slate-50 rounded-[3rem] p-10 md:p-14 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            {isSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in zoom-in duration-300 relative z-10">
                <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-sm">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-light text-slate-900 tracking-tight mb-4 font-heading">Xabar yuborildi</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-lg font-light">
                  Tez orada menejerlarimiz siz bilan bog'lanishadi. E'tiboringiz uchun rahmat.
                </p>
              </div>
            ) : (
              <div className="relative z-10">
                <h2 className="text-3xl font-light text-slate-900 tracking-tight mb-10 font-heading">Bizga yozing</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-slate-600 mb-2 block">Ism va Familiya *</Label>
                    <Input required placeholder="To'liq ismingizni kiriting" className="rounded-2xl h-14 bg-white border-slate-200 focus:border-[#2298F0] focus:ring-1 focus:ring-[#2298F0] transition-all text-base px-5 shadow-sm" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600 mb-2 block">Telefon raqam *</Label>
                    <Input required type="tel" placeholder="+998 90 123 45 67" className="rounded-2xl h-14 bg-white border-slate-200 focus:border-[#2298F0] focus:ring-1 focus:ring-[#2298F0] transition-all text-base px-5 shadow-sm" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600 mb-2 block">Xabar *</Label>
                    <Textarea required placeholder="Sayohat haqida o'z istaklaringizni yozib qoldiring..." className="rounded-2xl min-h-[160px] resize-none bg-white border-slate-200 focus:border-[#2298F0] focus:ring-1 focus:ring-[#2298F0] transition-all text-base p-5 shadow-sm" />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full h-16 rounded-2xl bg-[#F5B400] hover:bg-[#e0a500] text-slate-900 text-base font-semibold transition-all flex items-center justify-center gap-3 mt-8 shadow-md">
                    {isLoading ? "Yuborilmoqda..." : <><Send className="w-5 h-5" /> Xabarni yuborish</>}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* MAP */}
        <div>
          <h2 className="text-3xl font-light text-slate-900 tracking-tight mb-12 text-center font-heading">Xaritada ofisimiz</h2>
          <div className="w-full h-[600px] bg-slate-100 rounded-[3rem] overflow-hidden shadow-sm border border-slate-100">
            <iframe 
              src="https://maps.google.com/maps?q=Xonqa,+Xorazm&t=&z=15&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

      </div>
    </div>
  );
}
