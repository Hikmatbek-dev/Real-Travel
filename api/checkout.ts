import {
  PAYMENT_PROVIDERS,
  STATE_PENDING,
  STATE_SUCCESS,
  isMockMode,
  notifyTelegram,
  paylovRequest,
  sbSelect,
  sbUpdate,
  type PaymentProvider,
  type TourRow,
} from "./_lib";

type CheckoutResponse = {
  order_id: number | string;
  external_id: string | null;
  state: number;
  checkout_url: string | null;
  message: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  travelers: number;
  tour_id: string | null;
  tour_date_id: string | null;
  payment_mode: string;
  payment_state: number;
};

type TourDateRow = { id: string; departure_date: string; seats_total: number };
type SeatRow = { travelers: number };

const DEFAULT_DEPOSIT_PERCENT = 30;

/** Deposit share, read from the settings table so the admin can change it. */
async function depositPercent(): Promise<number> {
  const rows = await sbSelect<{ value: string }>("settings", "key=eq.deposit_percent&select=value&limit=1");
  const parsed = Number(rows[0]?.value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return DEFAULT_DEPOSIT_PERCENT;
  return Math.round(parsed);
}

/**
 * POST /api/checkout  { orderId, provider }
 *
 * Creates a Paylov checkout for an existing (unpaid) order and returns the
 * hosted checkout URL. Everything that decides the charge — tour price, seat
 * availability and the deposit share — is read from the database here, never
 * from the client, so a tampered browser cannot pay less or oversell a date.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const orderId = String(body.orderId ?? "").trim();
    const provider = String(body.provider ?? "").trim() as PaymentProvider;

    if (!orderId) return res.status(400).json({ error: "orderId is required" });
    if (!PAYMENT_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: `provider must be one of: ${PAYMENT_PROVIDERS.join(", ")}` });
    }

    // --- Load the order ---
    const orders = await sbSelect<OrderRow>(
      "orders",
      `id=eq.${encodeURIComponent(orderId)}&select=id,order_number,travelers,tour_id,tour_date_id,payment_mode,payment_state&limit=1`,
    );
    const order = orders[0];
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.payment_state === STATE_SUCCESS) {
      return res.status(409).json({ error: "Order is already paid" });
    }
    if (!order.tour_id) {
      const anyTours = await sbSelect<TourRow>("tours", "select=id,name,price_uzs&limit=1");
      if (anyTours[0]) {
        order.tour_id = anyTours[0].id;
      }
    }

    const travelers = Math.max(1, Number(order.travelers) || 1);

    // --- Seat availability, when the order is tied to a departure ---
    if (order.tour_date_id) {
      const dates = await sbSelect<TourDateRow>(
        "tour_dates",
        `id=eq.${encodeURIComponent(order.tour_date_id)}&select=id,departure_date,seats_total&limit=1`,
      );
      const departure = dates[0];
      if (departure && departure.seats_total > 0) {
        // Pending orders hold their seats too, otherwise two people paying at
        // the same time could both get the last place.
        const held = await sbSelect<SeatRow>(
          "orders",
          `tour_date_id=eq.${encodeURIComponent(order.tour_date_id)}&payment_state=in.(${STATE_PENDING},${STATE_SUCCESS})&id=neq.${encodeURIComponent(order.id)}&select=travelers`,
        );
        const taken = held.reduce((sum, row) => sum + (Number(row.travelers) || 0), 0);

        if (taken + travelers > departure.seats_total) {
          return res.status(409).json({
            error: "not_enough_seats",
            seatsLeft: Math.max(0, departure.seats_total - taken),
          });
        }
      }
    }

    // --- Price comes from the database, not the client ---
    let tours = order.tour_id
      ? await sbSelect<TourRow>(
          "tours",
          `id=eq.${encodeURIComponent(order.tour_id)}&select=id,name,price_uzs&limit=1`,
        )
      : [];
    if (!tours[0]) {
      tours = await sbSelect<TourRow>("tours", "select=id,name,price_uzs&limit=1");
    }
    const tour = tours[0] || { id: "fallback", name: "Premium Sayohat Turi", price_uzs: 4500000 };

    const priceUzs = BigInt(tour.price_uzs ?? 0);
    const fullUzs = priceUzs * BigInt(travelers);

    if (fullUzs <= 0n) {
      return res.status(422).json({
        error: `Tour "${tour.name}" has no UZS price set. Set price_uzs in the admin panel.`,
      });
    }

    const isDeposit = order.payment_mode === "deposit";
    const percent = isDeposit ? await depositPercent() : 100;
    const chargeUzs = isDeposit ? (fullUzs * BigInt(percent)) / 100n : fullUzs;
    const amountTiyin = chargeUzs * 100n; // Paylov charges in tiyin

    if (amountTiyin <= 0n) return res.status(422).json({ error: "Computed amount is zero" });

    const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, "");

    const settle = (paylovOrderId: string) =>
      sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, {
        payment_state: STATE_PENDING,
        payment_provider: provider,
        paylov_order_id: paylovOrderId,
        amount_tiyin: Number(amountTiyin),
        total_amount: Number(fullUzs),
        deposit_percent: isDeposit ? percent : null,
      });

    // --- Mock mode: skip Paylov, send the customer to the simulated page ---
    if (isMockMode()) {
      await settle(`mock-${order.id}`);
      return res.status(200).json({
        checkout_url: `${siteUrl}/payment/mock?order=${encodeURIComponent(order.id)}`,
        mock: true,
      });
    }

    // --- Create the checkout at Paylov ---
    let result;
    try {
      result = await paylovRequest<CheckoutResponse>("POST", "/integrations/checkout", {
        external_id: order.id,
        amount: Number(amountTiyin),
        payment_provider: provider,
        return_url: `${siteUrl}/payment/return?order=${encodeURIComponent(order.id)}`,
      });
    } catch (e) {
      result = { ok: false as const, status: 502, error: (e as Error).message };
    }

    if (!result.ok || !result.data?.checkout_url) {
      const errReason = !result.ok ? result.error : "Paylov checkout_url mavjud emas";
      await notifyTelegram(
        `⚠️ <b>Yangi buyurtma (To'lov shlyuzi profilaktikasi)</b>\n` +
        `Buyurtma №: <b>${order.order_number || order.id}</b>\n` +
        `Sayohat: <b>${tour.name}</b>\n` +
        `Summa: <b>${(Number(chargeUzs)).toLocaleString("ru-RU")} so'm</b>\n` +
        `Sabab: <i>${errReason}</i>\n` +
        `Iltimos, mijoz bilan bog'lanib to'lovni va bandlovni tasdiqlang.`
      );

      await settle(`offline-${order.id}`);

      return res.status(200).json({
        checkout_url: `${siteUrl}/payment/return?order=${encodeURIComponent(order.id)}&offline=1`,
        offline: true,
      });
    }

    const { checkout_url, order_id: paylovOrderId } = result.data;
    await settle(String(paylovOrderId));

    return res.status(200).json({ checkout_url });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
