import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/i18n/lang";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourName?: string;
  tourSlug?: string;
  priceUzs?: number;
}

export function BookingModal({ isOpen, onClose, tourName, tourSlug, priceUzs }: BookingModalProps) {
  const { t } = useLang();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("+998 ");

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    if (!val.startsWith("+998")) {
       val = "+998 ";
    }
    
    const digits = val.slice(4).replace(/\D/g, "").slice(0, 9);
    
    let formatted = "+998 ";
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += " " + digits.slice(2, 5);
    if (digits.length > 5) formatted += " " + digits.slice(5, 7);
    if (digits.length > 7) formatted += " " + digits.slice(7, 9);
    
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Server records the booking and sets the amount itself — the client
      // sends no secret and no price.
      const response = await fetch("/api/booking-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          note: tourName ? `Tur: ${tourName}${note ? ` — ${note}` : ""}` : note,
          tourSlug: tourSlug ?? ""
        })
      });

      const data = await response.json();

      if (response.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.error === "too_many_orders") {
        setError(t.booking.errTooMany);
        setIsLoading(false);
      } else {
        // Temporary: surface the server reason so payment issues can be diagnosed.
        const reason = data?.detail
          ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))
          : data?.error;
        setError(`${t.booking.errGeneric}${reason ? ` [${String(reason).slice(0, 400)}]` : ""}`);
        setIsLoading(false);
      }
    } catch (err) {
      setError(t.booking.errNetwork);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 md:p-10 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-2">{t.booking.title}</h2>
            <p className="text-sm text-slate-500">
              {tourName ? (
                <>
                  <span className="font-medium text-slate-900">{tourName}</span> {t.booking.subTourSuffix}
                </>
              ) : (
                t.booking.subNoTour
              )}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-xs font-medium text-slate-500 mb-1.5 block">{t.booking.nameLabel}</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t.booking.namePlaceholder} className="rounded-xl h-12 bg-slate-50 border-transparent focus:bg-white focus:border-[#2298F0] focus:ring-1 focus:ring-[#2298F0] transition-all text-sm" />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-500 mb-1.5 block">{t.booking.phoneLabel}</Label>
              <Input 
                required 
                type="tel" 
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+998 90 123 45 67" 
                className="rounded-xl h-12 bg-slate-50 border-transparent focus:bg-white focus:border-[#2298F0] focus:ring-1 focus:ring-[#2298F0] transition-all text-sm" 
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-500 mb-1.5 block">{t.booking.noteLabel}</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.booking.notePlaceholder} className="rounded-xl min-h-[100px] resize-none bg-slate-50 border-transparent focus:bg-white focus:border-[#2298F0] focus:ring-1 focus:ring-[#2298F0] transition-all text-sm py-3" />
            </div>

            <Button
              type="submit"
              disabled={isLoading || phone.length < 17}
              className="w-full h-14 rounded-2xl bg-[#F5B400] hover:bg-[#e0a500] text-slate-900 text-base font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {isLoading
                ? t.booking.processing
                : priceUzs && priceUzs > 0
                  ? `${t.booking.payGo} — ${Number(priceUzs).toLocaleString("uz-UZ")} ${t.currency}`
                  : t.booking.payGo}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
