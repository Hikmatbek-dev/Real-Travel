import { useState } from "react";
import { CreditCard, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Simulated payment page, shown instead of Paylov when PAYLOV_MOCK=1.
 * The buttons drive /api/mock-pay, which signs and delivers a real webhook.
 */
export function PaymentMock() {
  const orderId = new URLSearchParams(window.location.search).get("order") ?? "";
  const [busy, setBusy] = useState<"success" | "cancel" | null>(null);
  const [error, setError] = useState("");

  const settle = async (outcome: "success" | "cancel") => {
    if (!orderId) {
      setError("Buyurtma raqami topilmadi.");
      return;
    }
    setBusy(outcome);
    setError("");
    try {
      const response = await fetch("/api/mock-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, outcome })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "To'lovni yakunlab bo'lmadi.");
        setBusy(null);
        return;
      }
      window.location.href = `/payment/return?order=${encodeURIComponent(orderId)}`;
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex gap-3 text-amber-900">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Test rejimi</div>
            <div className="mt-1 font-light">
              Bu haqiqiy to'lov emas. Paylov kalitlari sozlangach bu sahifa o'rniga
              haqiqiy to'lov oynasi ochiladi.
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-primary">To'lovni yakunlash</h1>
            <p className="text-muted-foreground text-sm mt-2 font-light">
              Natijani tanlang — buyurtma holati shunga qarab yangilanadi.
            </p>
            {orderId ? (
              <p className="text-xs text-muted-foreground mt-4 font-mono break-all">{orderId}</p>
            ) : null}
          </div>

          {error ? (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>
          ) : null}

          <div className="space-y-3">
            <Button className="w-full h-12" disabled={busy !== null} onClick={() => settle("success")}>
              {busy === "success" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yakunlanmoqda...</> : "To'lovni tasdiqlash"}
            </Button>
            <Button
              variant="outline"
              className="w-full h-12"
              disabled={busy !== null}
              onClick={() => settle("cancel")}
            >
              {busy === "cancel" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bekor qilinmoqda...</> : "To'lovni bekor qilish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
