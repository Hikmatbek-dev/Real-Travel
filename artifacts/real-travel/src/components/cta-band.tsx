import { Instagram, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";
import { COMPANY, PHONE_HREF } from "@/lib/company";
import { useToast } from "@/hooks/use-toast";

/**
 * Closing band. Many visitors will not book online at all — they want to talk
 * first — so the page ends with a way to reach a person rather than a footer.
 */
export function CtaBand() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Xabar yuborildi!",
      description: "Mutaxassisimiz tez orada siz bilan bog'lanadi.",
    });
  };

  return (
    <section className="py-20 relative font-sans">
        <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Airplane CTA" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background/80"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="bg-primary/95 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-border flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 leading-tight">
                      Sayohat bo'yicha bepul ekspert maslahatini oling
                    </h2>
                    <p className="text-primary-foreground/80 text-lg">
                      Mutaxassisimiz sizga 10 daqiqa ichida moliyaviy va istaklaringizga mos tur tanlab beradi.
                    </p>
                </div>
                
                <div className="flex-1 w-full">
                    <form onSubmit={handleSubmit} className="space-y-4 bg-background p-6 rounded-2xl shadow-inner border border-border">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Ismingiz</label>
                            <input type="text" id="name" required placeholder="Masalan: Jamshid" className="w-full border border-border bg-card text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">Telefon raqamingiz</label>
                            <input type="tel" id="phone" required placeholder="+998 __ _______" className="w-full border border-border bg-card text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" />
                        </div>
                        <button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-md mt-2 uppercase tracking-wide text-sm">
                            Mijozlar menejeri bilan bog'lanish
                        </button>
                        <p className="text-xs text-muted-foreground text-center mt-3">Ma'lumotlaringiz xavfsizligi kafolatlanadi.</p>
                    </form>
                </div>
            </div>
        </div>
    </section>
  );
}
