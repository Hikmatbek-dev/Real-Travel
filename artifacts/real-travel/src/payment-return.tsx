import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "checking" | "paid" | "cancelled" | "pending" | "offline" | "error";

const TEXT = {
  uz: {
    checking: "To'lov tekshirilmoqda...",
    paid: "To'lov muvaffaqiyatli!",
    paidText: "Buyurtmangiz tasdiqlandi. Tez orada siz bilan bog'lanamiz.",
    cancelled: "To'lov bekor qilindi",
    cancelledText: "Buyurtma to'lanmadi. Qayta urinib ko'rishingiz mumkin.",
    pending: "To'lov hali tasdiqlanmadi",
    pendingText: "To'lov qayta ishlanmoqda. Bir necha daqiqadan so'ng tekshiring.",
    offline: "Buyurtmangiz qabul qilindi!",
    offlineText: "Ma'lumotlaringiz muvaffaqiyatli saqlandi. To'lov tizimida texnik profilaktika ketayotgani sababli menejerimiz tez orada siz bilan bog'lanib, bandlov va to'lovni tasdiqlaydi.",
    error: "Buyurtma topilmadi",
    order: "Buyurtma raqami",
    home: "Bosh sahifaga qaytish"
  }
};

export function PaymentReturn() {
  const t = TEXT.uz;
  const [status, setStatus] = useState<Status>("checking");
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order");
    const isOffline = params.get("offline") === "1";

    if (!orderId) {
      setStatus("error");
      return;
    }

    if (isOffline) {
      setStatus("offline");
      // Fetch order number if available
      fetch(`/api/order-status?order=${encodeURIComponent(orderId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.orderNumber) setOrderNumber(data.orderNumber);
        })
        .catch(() => {});
      return;
    }

    let attempts = 0;
    let timer: number | undefined;
    let active = true;

    // The webhook may land a moment after the customer is redirected back,
    // so poll briefly before settling on "pending".
    const check = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/order-status?order=${encodeURIComponent(orderId)}`);
        const data = await response.json();
        if (!active) return;

        if (!response.ok) {
          setStatus("error");
          return;
        }

        setOrderNumber(data.orderNumber || "");

        if (data.paymentState === 2) return setStatus("paid");
        if (data.paymentState === -2) return setStatus("cancelled");

        if (attempts >= 10) return setStatus("pending");
        timer = window.setTimeout(check, 2000);
      } catch {
        if (!active) return;
        if (attempts >= 10) return setStatus("error");
        timer = window.setTimeout(check, 2000);
      }
    };

    check();

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const icon = {
    checking: <Loader2 className="h-14 w-14 animate-spin text-primary" />,
    paid: <CheckCircle2 className="h-14 w-14 text-emerald-600" />,
    cancelled: <XCircle className="h-14 w-14 text-destructive" />,
    pending: <Loader2 className="h-14 w-14 text-muted-foreground" />,
    offline: <CheckCircle2 className="h-14 w-14 text-primary" />,
    error: <XCircle className="h-14 w-14 text-destructive" />
  }[status];

  const title = {
    checking: t.checking,
    paid: t.paid,
    cancelled: t.cancelled,
    pending: t.pending,
    offline: t.offline,
    error: t.error
  }[status];

  const text = {
    checking: "",
    paid: t.paidText,
    cancelled: t.cancelledText,
    pending: t.pendingText,
    offline: t.offlineText,
    error: ""
  }[status];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-6 text-center">
      <div className="mb-6">{icon}</div>
      <h1 className="font-serif text-3xl text-primary mb-3">{title}</h1>
      {text ? <p className="text-muted-foreground font-light max-w-sm mb-2">{text}</p> : null}
      {orderNumber ? (
        <p className="text-sm text-muted-foreground mb-8">
          {t.order}: <span className="font-semibold text-primary">{orderNumber}</span>
        </p>
      ) : (
        <div className="mb-8" />
      )}
      <Button
        onClick={() => {
          window.history.pushState({}, "", "/");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
        variant="outline"
        className="rounded-lg border-primary text-primary uppercase tracking-widest"
      >
        {t.home}
      </Button>
    </div>
  );
}
