import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock3, Loader2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n";
import { formatUzs } from "@/lib/format";

type Result = {
  orderNumber: string;
  paymentState: number;
  travelers: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMode: string;
  depositPercent: number | null;
  tourName: string | null;
  tourSlug: string | null;
  departureDate: string | null;
};

export function OrderLookupPage() {
  const { t, language } = useLanguage();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsChecking(true);

    try {
      const response = await fetch("/api/order-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone: `+998 ${phone}` })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(t.order.notFound);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.order.notFound);
    } finally {
      setIsChecking(false);
    }
  };

  const statusView = (state: number) => {
    if (state === 2) return { icon: CheckCircle2, label: t.order.statusPaid, tone: "text-emerald-600" };
    if (state === -2) return { icon: XCircle, label: t.order.statusCancelled, tone: "text-destructive" };
    if (state === 1) return { icon: Clock3, label: t.order.statusPending, tone: "text-amber-600" };
    return { icon: Clock3, label: t.order.statusNew, tone: "text-primary" };
  };

  return (
    <div className="container mx-auto max-w-2xl px-6 pb-24 pt-32 md:px-12">
      <h1 className="mb-3 font-serif text-4xl text-primary">{t.order.title}</h1>
      <p className="mb-10 font-light text-muted-foreground">{t.order.text}</p>

      <form onSubmit={handleSubmit} className="mb-10 space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="orderNumber">{t.order.orderNumber}</Label>
          <Input
            id="orderNumber"
            required
            placeholder={t.order.orderNumberHint}
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lookupPhone">{t.order.phone}</Label>
          <div className="flex items-center rounded-md border border-input bg-background">
            <span className="border-r border-input px-3 text-sm text-muted-foreground">+998</span>
            <Input
              id="lookupPhone"
              type="tel"
              inputMode="numeric"
              required
              minLength={9}
              maxLength={9}
              pattern="[0-9]{9}"
              placeholder="901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>
        ) : null}

        <Button type="submit" className="h-11 w-full" disabled={isChecking}>
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.order.checking}
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" /> {t.order.check}
            </>
          )}
        </Button>
      </form>

      {result ? (
        (() => {
          const view = statusView(result.paymentState);
          const StatusIcon = view.icon;
          return (
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <span className="font-mono text-lg font-semibold text-primary">{result.orderNumber}</span>
                <span className={`flex items-center gap-2 text-sm font-medium ${view.tone}`}>
                  <StatusIcon className="h-4 w-4" />
                  {view.label}
                </span>
              </div>

              <dl className="space-y-3 text-sm">
                {result.tourName ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t.order.tour}</dt>
                    <dd className="text-right font-medium">
                      {result.tourSlug ? (
                        <Link href={`/tours/${result.tourSlug}`} className="text-primary hover:underline">
                          {result.tourName}
                        </Link>
                      ) : (
                        result.tourName
                      )}
                    </dd>
                  </div>
                ) : null}

                {result.departureDate ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t.order.departure}</dt>
                    <dd className="font-medium">{result.departureDate}</dd>
                  </div>
                ) : null}

                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t.order.travelers}</dt>
                  <dd className="font-medium">{result.travelers}</dd>
                </div>

                <div className="flex justify-between gap-4 border-t border-border pt-3">
                  <dt className="text-muted-foreground">{t.order.total}</dt>
                  <dd className="font-medium">{formatUzs(result.totalAmount, language)}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t.order.paid}</dt>
                  <dd className="font-medium text-emerald-600">{formatUzs(result.paidAmount, language)}</dd>
                </div>

                {result.remainingAmount > 0 ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t.order.remaining}</dt>
                    <dd className="font-medium">{formatUzs(result.remainingAmount, language)}</dd>
                  </div>
                ) : null}
              </dl>

              {result.paymentMode === "deposit" && result.paymentState === 2 ? (
                <p className="mt-5 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  {t.order.depositPaid} ({result.depositPercent}%)
                </p>
              ) : null}
            </div>
          );
        })()
      ) : null}
    </div>
  );
}
