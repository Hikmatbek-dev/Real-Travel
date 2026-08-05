import { COMPANY } from "@/lib/company";
import { useSeo } from "@/lib/use-seo";
import { useLang } from "@/i18n/lang";

export function AboutPage() {
  const { t } = useLang();
  useSeo({
    title: "Biz haqimizda — Real Travel | O'zbekiston sayohat agentligi",
    description:
      "Real Travel — Xorazm, Xonqadagi ishonchli sayohat agentligi. Jamoamiz, qadriyatlarimiz va mijozlarga g'amxo'rligimiz haqida.",
    path: "/about",
  });
  return (
    <div className="font-sans bg-white pb-32">
      {/* HEADER HERO */}
      <section className="relative h-[80vh] flex flex-col justify-center overflow-hidden mb-24">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2000&q=80" alt="Biz Haqimizda" className="w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite] origin-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 w-full mt-20 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white font-medium tracking-[0.2em] text-xs uppercase shadow-2xl">
             {t.aboutPage.badge}
          </div>
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-8 font-heading drop-shadow-2xl">
            {t.aboutPage.title1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B400] to-[#ffd043] italic pr-4">{t.aboutPage.title2}</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 font-light max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            {COMPANY.legalName} {t.aboutPage.heroSuffix}
          </p>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-6 md:px-12">

        {/* STORY & MISSION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32">
          <div>
            <h2 className="text-3xl font-light text-slate-900 tracking-tight mb-8 font-heading">{t.aboutPage.storyTitle}</h2>
            <div className="prose prose-slate prose-lg">
              <p className="text-slate-600 leading-relaxed font-light mb-6">{t.aboutPage.story1}</p>
              <p className="text-slate-600 leading-relaxed font-light">{t.aboutPage.story2}</p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-light text-slate-900 tracking-tight mb-8 font-heading">{t.aboutPage.missionTitle}</h2>
            <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 h-full flex items-center shadow-sm">
              <p className="text-2xl text-slate-800 font-light leading-relaxed italic text-center">
                {t.aboutPage.missionQuote}
              </p>
            </div>
          </div>
        </div>





      </div>
    </div>
  );
}
