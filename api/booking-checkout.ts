import { STATE_PENDING, payxCreateInvoice, sbSelect, sbUpdate } from "./_lib";

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
 * POST /api/booking-checkout  { customerName, phone, note?, tourSlug? }
 *
 * Records a booking request and opens a PayX invoice for the flat booking fee.
 * The amount is read from settings on the server — the client sends no secret
 * and no price. The DB trigger forces payment_state=0, so a client cannot mark
 * a booking paid; that only happens when PayX's signed webhook confirms it.
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

    if (!customerName) return res.status(400).json({ error: "customerName is required" });
    if (rawPhone.length < 9) return res.status(400).json({ error: "A valid phone is required" });

    const phone = `+998 ${rawPhone.slice(-9)}`;

    // Optional link to a tour, for the operator's context. Never trusted for pricing.
    let tourId: string | null = null;
    if (tourSlug) {
      const tours = await sbSelect<TourRow>("tours", `slug=eq.${encodeURIComponent(tourSlug)}&select=id&limit=1`);
      tourId = tours[0]?.id ?? null;
    }

    const feeUzs = await bookingFeeUzs();
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

    // payer_reference is our order id, so the webhook can find the booking.
    const invoice = await payxCreateInvoice(orderId, feeUzs);
    if (!invoice.ok) {
      return res.status(502).json({ error: "PayX invoice failed", detail: invoice.error });
    }

    await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}`, {
      payment_state: STATE_PENDING,
      payment_provider: "payx",
      paylov_order_id: invoice.uuid, // reused column: the provider's invoice reference
      amount_tiyin: feeUzs * 100,
    });

    return res.status(200).json({ checkout_url: invoice.payUrl });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
