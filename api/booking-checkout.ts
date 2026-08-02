import {
  PAYMENT_PROVIDERS,
  STATE_PENDING,
  isMockMode,
  paylovRequest,
  sbSelect,
  sbUpdate,
  type PaymentProvider,
} from "./_lib";

type CheckoutResponse = { order_id: number | string; checkout_url: string | null };
type TourRow = { id: string };

const DEFAULT_FEE_UZS = 150000;

/** Booking fee in so'm, read from settings so the admin controls it, never the client. */
async function bookingFeeUzs(): Promise<number> {
  const rows = await sbSelect<{ value: string }>("settings", "key=eq.booking_fee&select=value&limit=1");
  const parsed = Number(rows[0]?.value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : DEFAULT_FEE_UZS;
}

async function sbInsertOrder(row: Record<string, unknown>): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured");
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/orders`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Supabase insert order failed: ${res.status} ${await res.text()}`);
}

/**
 * POST /api/booking-checkout
 *   { customerName, phone, note?, tourSlug?, provider? }
 *
 * Records a booking request and starts a Paylov checkout for the flat booking
 * fee. The amount is read from settings on the server — the client never sends
 * it — so the previous version's client-controlled "amount: 150000" (and its
 * hardcoded bearer token) are gone. The order's payment_state is forced to 0
 * by the DB trigger, so nothing here can mark a booking paid.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const customerName = String(body.customerName ?? "").trim();
    const rawPhone = String(body.phone ?? "").replace(/\D/g, "");
    const note = String(body.note ?? "").trim().slice(0, 500);
    const tourSlug = String(body.tourSlug ?? "").trim();
    const provider = (String(body.provider ?? "payme").trim() as PaymentProvider);

    if (!customerName) return res.status(400).json({ error: "customerName is required" });
    if (rawPhone.length < 9) return res.status(400).json({ error: "A valid phone is required" });
    if (!PAYMENT_PROVIDERS.includes(provider)) return res.status(400).json({ error: "Invalid provider" });

    const phone = `+998 ${rawPhone.slice(-9)}`;

    // Optional link to a tour, for the operator's context. Never trusted for pricing.
    let tourId: string | null = null;
    if (tourSlug) {
      const tours = await sbSelect<TourRow>("tours", `slug=eq.${encodeURIComponent(tourSlug)}&select=id&limit=1`);
      tourId = tours[0]?.id ?? null;
    }

    const feeUzs = await bookingFeeUzs();
    const amountTiyin = feeUzs * 100;

    const orderId = `b${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // The trigger forces order_number, status='New', payment_state=0.
    await sbInsertOrder({
      id: orderId,
      customer_name: customerName,
      phone,
      travelers: 1,
      tour_id: tourId,
      notes: note,
      total_amount: feeUzs,
    });

    const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, "");

    const settle = (paylovOrderId: string) =>
      sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}`, {
        payment_state: STATE_PENDING,
        payment_provider: provider,
        paylov_order_id: paylovOrderId,
        amount_tiyin: amountTiyin,
      });

    if (isMockMode()) {
      await settle(`mock-${orderId}`);
      return res.status(200).json({ checkout_url: `${siteUrl}/payment/mock?order=${encodeURIComponent(orderId)}`, mock: true });
    }

    const result = await paylovRequest<CheckoutResponse>("POST", "/integrations/checkout", {
      external_id: orderId,
      amount: amountTiyin,
      payment_provider: provider,
      return_url: `${siteUrl}/payment/return?order=${encodeURIComponent(orderId)}`,
    });

    if (!result.ok || !result.data.checkout_url) {
      return res.status(502).json({ error: "Paylov checkout failed", detail: result.ok ? result.data : result.error });
    }

    await settle(String(result.data.order_id));
    return res.status(200).json({ checkout_url: result.data.checkout_url });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
