import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "checking" | "paid" | "cancelled" | "pending" | "error";

/**
 * Where Paylov sends the customer back after payment. It polls the order status
 * (the server re-checks with Paylov), so the booking confirms without relying
 * on the webhook being delivered.
 */
export function PaymentReturnPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<Status>("checking");
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("order");
    if (!orderId) {
      setStatus("error");
      return;
    }

    let attempts = 0;
    let active = true;
    let timer: number | undefined;

    const check = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/order-status?order=${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (!active) return;

        if (!res.ok) {
          setStatus("error");
          return;
        }
        setOrderNumber(data.orderNumber || "");

        if (data.paymentState === 2) return setStatus("paid");
        if (data.paymentState === -2) return setStatus("cancelled");

        // Still pending — the webhook/settlement may land a moment later.
        if (attempts < 5) timer = window.setTimeout(check, 2500);
        else setStatus("pending");
      } catch {
        if (active) setStatus("error");
      }
    };

    check();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const view = {
    checking: { icon: Loader2, spin: true, color: "text-sky-500", title: "To'lov tekshirilmoqda...", text: "Bir necha soniya kuting." },
    paid: { icon: CheckCircle2, spin: false, color: "text-emerald-500", title: "To'lov muvaffaqiyatli!", text: "Bandlovingiz qabul qilindi. Menejerimiz tez orada siz bilan bog'lanadi." },
    pending: { icon: Clock, spin: false, color: "text-amber-500", title: "To'lov qayta ishlanmoqda", text: "To'lov tasdiqlanishi bir necha daqiqa olishi mumkin. Keyinroq buyurtma holatini tekshiring." },
    cancelled: { icon: XCircle, spin: false, color: "text-red-500", title: "To'lov bekor qilindi", text: "Bandlov to'lanmadi. Qayta urinib ko'rishingiz mumkin." },
    error: { icon: XCircle, spin: false, color: "text-red-500", title: "Buyurtma topilmadi", text: "So'rov ma'lumotlari noto'g'ri bo'lishi mumkin." }
  }[status];

  const Icon = view.icon;

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-white px-6 py-24 font-sans">
      <div className="w-full max-w-md text-center">
        <div className={`mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 ${view.color}`}>
          <Icon className={`h-10 w-10 ${view.spin ? "animate-spin" : ""}`} />
        </div>
        <h1 className="mb-3 text-3xl font-light tracking-tight text-slate-900">{view.title}</h1>
        <p className="mb-8 text-slate-500 leading-relaxed">{view.text}</p>
        {orderNumber ? (
          <p className="mb-8 text-sm text-slate-400">
            Buyurtma raqami: <span className="font-mono font-medium text-slate-700">{orderNumber}</span>
          </p>
        ) : null}
        <Button onClick={() => setLocation("/")} className="rounded-2xl bg-sky-500 px-8 py-3 text-white hover:bg-sky-600">
          Bosh sahifaga qaytish
        </Button>
      </div>
    </div>
  );
}
