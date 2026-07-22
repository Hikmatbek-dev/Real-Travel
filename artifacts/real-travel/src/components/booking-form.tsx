import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n";
import { formatUzs } from "@/lib/format";
import { useSharedTravelData, type PaymentMode, type SharedTour, type TravelerInfo } from "@/lib/shared-travel-data";

const PAYMENT_PROVIDERS = [
  { id: "payme", label: "Payme" },
  { id: "click", label: "Click" },
  { id: "paylov", label: "Paylov" },
  { id: "uzum", label: "Uzum" }
] as const;

type ProviderId = (typeof PAYMENT_PROVIDERS)[number]["id"];

type Availability = {
  id: string;
  departureDate: string;
  seatsTotal: number;
  seatsLeft: number | null;
};

const emptyTraveler = (): TravelerInfo => ({ fullName: "", birthDate: "" });

export function BookingForm({ tour }: { tour: SharedTour }) {
  const { t, language } = useLanguage();
  const { orders, saveOrders, depositPercent } = useSharedTravelData();

  const [dates, setDates] = useState<Availability[] | null>(null);
  const [dateId, setDateId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<ProviderId>("payme");
  const [mode, setMode] = useState<PaymentMode>("full");
  const [form, setForm] = useState({ customerName: "", phone: "", notes: "" });
  const [travelers, setTravelers] = useState<TravelerInfo[]>([emptyTraveler()]);

  // Seats left can only be counted server-side — visitors cannot read orders.
  useEffect(() => {
    let active = true;
    fetch(`/api/availability?tour=${encodeURIComponent(tour.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list: Availability[] = data.dates ?? [];
        setDates(list);
        const firstOpen = list.find((d) => d.seatsLeft === null || d.seatsLeft > 0);
        if (firstOpen) setDateId(firstOpen.id);
      })
      .catch(() => active && setDates([]));
    return () => {
      active = false;
    };
  }, [tour.id]);

  const selected = dates?.find((d) => d.id === dateId) ?? null;
  const seatsLeft = selected?.seatsLeft ?? null;

  const fullTotal = tour.priceUzs * travelers.length;
  const dueNow = mode === "deposit" ? Math.round((fullTotal * depositPercent) / 100) : fullTotal;
  const dueLater = fullTotal - dueNow;

  const setTravelerCount = (count: number) => {
    const next = Math.min(30, Math.max(1, count));
    setTravelers((prev) =>
      next > prev.length
        ? [...prev, ...Array.from({ length: next - prev.length }, emptyTraveler)]
        : prev.slice(0, next)
    );
  };

  const updateTraveler = (index: number, patch: Partial<TravelerInfo>) => {
    setTravelers((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : language === "en" ? "en-GB" : "uz-UZ", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }),
    [language]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const orderId = `o${Date.now()}`;

    try {
      await saveOrders([
        {
          id: orderId,
          orderNumber: "", // assigned by the database sequence
          customerName: form.customerName,
          email: "",
          phone: `+998 ${form.phone}`,
          travelers: travelers.length,
          tourId: tour.id,
          tourDateId: dateId || null,
          paymentMode: mode,
          travelersInfo: travelers,
          date: new Date().toISOString(),
          status: "New",
          totalAmount: fullTotal,
          notes: form.notes
        },
        ...orders
      ]);

      // The server recomputes price, deposit share and seat availability, so
      // the figures shown here are display-only.
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, provider })
      });
      const result = await response.json();

      if (!response.ok || !result.checkout_url) {
        throw new Error(result.error === "not_enough_seats" ? t.booking.soldOut : result.error || t.booking.payError);
      }

      window.location.href = result.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.booking.payError);
      setIsSubmitting(false);
    }
  };

  if (tour.priceUzs <= 0) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        {t.booking.noPrice}
      </div>
    );
  }

  if (dates !== null && dates.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        {t.booking.noDates}
      </div>
    );
  }

  const soldOut = seatsLeft !== null && seatsLeft < travelers.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>
      ) : null}

      {/* Departure */}
      <div className="space-y-2">
        <Label htmlFor="departure">{t.booking.departure}</Label>
        {dates === null ? (
          <div className="flex h-10 items-center rounded-md border border-input px-3 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </div>
        ) : (
          <select
            id="departure"
            required
            value={dateId}
            onChange={(e) => setDateId(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{t.booking.selectDate}</option>
            {dates.map((date) => (
              <option key={date.id} value={date.id} disabled={date.seatsLeft === 0}>
                {dateLabel.format(new Date(`${date.departureDate}T00:00:00`))}
                {date.seatsLeft === 0
                  ? ` — ${t.booking.soldOut}`
                  : date.seatsLeft !== null
                    ? ` — ${date.seatsLeft} ${t.booking.seatsLeft}`
                    : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Contact */}
      <div className="space-y-2">
        <Label htmlFor="name">{t.booking.fullName}</Label>
        <Input
          id="name"
          required
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t.booking.phone}</Label>
        <div className="flex items-center rounded-md border border-input bg-background">
          <span className="border-r border-input px-3 text-sm text-muted-foreground">+998</span>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            required
            minLength={9}
            maxLength={9}
            pattern="[0-9]{9}"
            placeholder="901234567"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 9) })}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Travelers */}
      <div className="space-y-2">
        <Label htmlFor="travelerCount">{t.booking.travelers}</Label>
        <Input
          id="travelerCount"
          type="number"
          min={1}
          max={30}
          value={travelers.length}
          onChange={(e) => setTravelerCount(Number(e.target.value) || 1)}
        />
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="text-sm font-medium text-primary">{t.booking.travelerDetails}</div>
        <p className="text-xs text-muted-foreground">{t.booking.travelerNameHint}</p>
        {travelers.map((traveler, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-2">
            <Input
              required
              aria-label={`${t.booking.traveler} ${index + 1} — ${t.booking.travelerName}`}
              placeholder={`${t.booking.traveler} ${index + 1} — ${t.booking.travelerName}`}
              value={traveler.fullName}
              onChange={(e) => updateTraveler(index, { fullName: e.target.value })}
            />
            <Input
              required
              type="date"
              aria-label={t.booking.birthDate}
              max={new Date().toISOString().slice(0, 10)}
              value={traveler.birthDate}
              onChange={(e) => updateTraveler(index, { birthDate: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t.booking.note}</Label>
        <Textarea
          id="notes"
          rows={2}
          placeholder={t.booking.notePlaceholder}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      {/* Payment mode */}
      <div className="space-y-2">
        <Label>{t.booking.paymentMode}</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["full", "deposit"] as PaymentMode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                mode === option
                  ? "border-primary bg-primary text-white"
                  : "border-input bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              {option === "full" ? t.booking.payFull : `${t.booking.payDeposit} ${depositPercent}%`}
            </button>
          ))}
        </div>
        {mode === "deposit" ? <p className="text-xs text-muted-foreground">{t.booking.depositNote}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>{t.booking.paymentLabel}</Label>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_PROVIDERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setProvider(option.id)}
              className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                provider === option.id
                  ? "border-primary bg-primary text-white"
                  : "border-input bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-1 rounded-md bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t.booking.totalLabel}</span>
          <span className="text-sm text-muted-foreground">{formatUzs(fullTotal, language)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary">{t.booking.payNow}</span>
          <span className="text-lg font-semibold text-primary">{formatUzs(dueNow, language)}</span>
        </div>
        {dueLater > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t.booking.remaining}</span>
            <span className="text-xs text-muted-foreground">{formatUzs(dueLater, language)}</span>
          </div>
        ) : null}
      </div>

      <Button type="submit" className="h-12 w-full" disabled={isSubmitting || soldOut || !dateId}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.booking.processing}
          </>
        ) : soldOut ? (
          t.booking.soldOut
        ) : (
          t.booking.payButton
        )}
      </Button>
    </form>
  );
}
