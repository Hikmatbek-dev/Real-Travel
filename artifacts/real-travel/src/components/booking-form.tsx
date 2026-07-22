import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n";
import { formatUzs } from "@/lib/format";
import { useSharedTravelData, type SharedTour } from "@/lib/shared-travel-data";

const PAYMENT_PROVIDERS = [
  { id: "payme", label: "Payme" },
  { id: "click", label: "Click" },
  { id: "paylov", label: "Paylov" },
  { id: "uzum", label: "Uzum" }
] as const;

type ProviderId = (typeof PAYMENT_PROVIDERS)[number]["id"];

export function BookingForm({ tour }: { tour: SharedTour }) {
  const { t, language } = useLanguage();
  const { orders, saveOrders } = useSharedTravelData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<ProviderId>("payme");
  const [form, setForm] = useState({ customerName: "", phone: "", travelers: 1, notes: "" });

  const total = tour.priceUzs * form.travelers;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const orderId = `o${Date.now()}`;

    try {
      // Record the unpaid order first; the DB forces payment_state = 0 on insert.
      await saveOrders([
        {
          id: orderId,
          orderNumber: "", // assigned by the database sequence
          customerName: form.customerName,
          email: "",
          phone: `+998 ${form.phone}`,
          travelers: form.travelers,
          tourId: tour.id,
          date: new Date().toISOString(),
          status: "New",
          totalAmount: total,
          notes: form.notes
        },
        ...orders
      ]);

      // The server recomputes the amount from the database, so the price here
      // is display-only and cannot be tampered with.
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, provider })
      });
      const result = await response.json();

      if (!response.ok || !result.checkout_url) throw new Error(result.error || t.booking.payError);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>
      ) : null}

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

      <div className="space-y-2">
        <Label htmlFor="travelers">{t.booking.travelers}</Label>
        <Input
          id="travelers"
          type="number"
          min={1}
          max={30}
          value={form.travelers}
          onChange={(e) => setForm({ ...form, travelers: Math.max(1, Number(e.target.value) || 1) })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t.booking.note}</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder={t.booking.notePlaceholder}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
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

      <div className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-3">
        <span className="text-sm text-muted-foreground">{t.booking.totalLabel}</span>
        <span className="text-lg font-semibold text-primary">{formatUzs(total, language)}</span>
      </div>

      <Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.booking.processing}
          </>
        ) : (
          t.booking.payButton
        )}
      </Button>
    </form>
  );
}
