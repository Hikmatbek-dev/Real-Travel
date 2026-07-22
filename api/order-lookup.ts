import { STATE_CANCELLED, STATE_PENDING, STATE_SUCCESS, paylovOrderState, sbSelect, sbUpdate } from "./_lib";

type LookupRow = {
  id: string;
  order_number: string;
  phone: string;
  travelers: number;
  status: string;
  payment_state: number;
  payment_mode: string;
  deposit_percent: number | null;
  total_amount: number;
  amount_tiyin: number | null;
  paylov_order_id: string | null;
  tour_id: string | null;
  tour_date_id: string | null;
};

/** Compares phone numbers by digits only, so "+998 90 123" == "998901 23". */
function sameNumber(a: string, b: string): boolean {
  const digits = (value: string) => value.replace(/\D/g, "").slice(-9);
  const left = digits(a);
  return left.length === 9 && left === digits(b);
}

/**
 * POST /api/order-lookup  { orderNumber, phone }
 *
 * Lets a customer check their own booking without an account. Both the order
 * number and the phone it was booked with must match, so the endpoint cannot
 * be used to walk through order numbers and harvest other people's bookings.
 * The response deliberately carries no contact details or traveler names.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const orderNumber = String(body.orderNumber ?? "").trim().toUpperCase();
    const phone = String(body.phone ?? "").trim();

    if (!orderNumber || !phone) return res.status(400).json({ error: "orderNumber and phone are required" });

    const rows = await sbSelect<LookupRow>(
      "orders",
      `order_number=eq.${encodeURIComponent(orderNumber)}&select=id,order_number,phone,travelers,status,payment_state,payment_mode,deposit_percent,total_amount,amount_tiyin,paylov_order_id,tour_id,tour_date_id&limit=1`,
    );

    const order = rows[0];
    // Same response whether the number is unknown or the phone does not match,
    // so neither can be probed.
    if (!order || !sameNumber(phone, order.phone)) {
      return res.status(404).json({ error: "not_found" });
    }

    let paymentState = Number(order.payment_state);

    // Refresh from Paylov while still pending, same as the return page does.
    if (paymentState === STATE_PENDING && order.paylov_order_id && !order.paylov_order_id.startsWith("mock-")) {
      const remote = await paylovOrderState(order.paylov_order_id);
      if (remote?.paid) {
        paymentState = STATE_SUCCESS;
        await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, {
          payment_state: STATE_SUCCESS,
          status: "Confirmed",
          paid_at: new Date().toISOString(),
        });
      } else if (remote?.canceled) {
        paymentState = STATE_CANCELLED;
        await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, {
          payment_state: STATE_CANCELLED,
          status: "Cancelled",
        });
      }
    }

    const [tour] = order.tour_id
      ? await sbSelect<{ name: string; slug: string }>(
          "tours",
          `id=eq.${encodeURIComponent(order.tour_id)}&select=name,slug&limit=1`,
        )
      : [];

    const [departure] = order.tour_date_id
      ? await sbSelect<{ departure_date: string }>(
          "tour_dates",
          `id=eq.${encodeURIComponent(order.tour_date_id)}&select=departure_date&limit=1`,
        )
      : [];

    const paidUzs = paymentState === STATE_SUCCESS ? Math.round((order.amount_tiyin ?? 0) / 100) : 0;

    return res.status(200).json({
      orderNumber: order.order_number,
      paymentState,
      status: order.status,
      travelers: order.travelers,
      totalAmount: Number(order.total_amount),
      paidAmount: paidUzs,
      remainingAmount: Math.max(0, Number(order.total_amount) - paidUzs),
      paymentMode: order.payment_mode,
      depositPercent: order.deposit_percent,
      tourName: tour?.name ?? null,
      tourSlug: tour?.slug ?? null,
      departureDate: departure ? String(departure.departure_date).slice(0, 10) : null,
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
