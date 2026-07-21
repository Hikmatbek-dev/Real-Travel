import {
  PAYMENT_PROVIDERS,
  STATE_PENDING,
  STATE_SUCCESS,
  isMockMode,
  paylovRequest,
  sbSelect,
  sbUpdate,
  type OrderRow,
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

/**
 * POST /api/checkout  { orderId, provider }
 *
 * Creates a Paylov checkout for an existing (unpaid) order and returns the
 * hosted checkout URL. The charged amount is derived from the tour price in
 * the database — never from the client — so a tampered client cannot pay less.
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
      `id=eq.${encodeURIComponent(orderId)}&select=id,order_number,travelers,tour_id,payment_state&limit=1`,
    );
    const order = orders[0];
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.payment_state === STATE_SUCCESS) {
      return res.status(409).json({ error: "Order is already paid" });
    }
    if (!order.tour_id) return res.status(422).json({ error: "Order has no tour attached" });

    // --- Price comes from the database, not the client ---
    const tours = await sbSelect<TourRow>(
      "tours",
      `id=eq.${encodeURIComponent(order.tour_id)}&select=id,name,price_uzs&limit=1`,
    );
    const tour = tours[0];
    if (!tour) return res.status(422).json({ error: "Tour not found" });

    const priceUzs = BigInt(tour.price_uzs ?? 0);
    const travelers = BigInt(Math.max(1, Number(order.travelers) || 1));
    const amountTiyin = priceUzs * travelers * 100n; // Paylov charges in tiyin

    if (amountTiyin <= 0n) {
      return res.status(422).json({
        error: `Tour "${tour.name}" has no UZS price set. Set price_uzs in the admin panel.`,
      });
    }

    const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, "");

    // --- Mock mode: skip Paylov, send the customer to the simulated page ---
    if (isMockMode()) {
      const mockOrderId = `mock-${order.id}`;
      await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, {
        payment_state: STATE_PENDING,
        payment_provider: provider,
        paylov_order_id: mockOrderId,
        amount_tiyin: Number(amountTiyin),
        total_amount: Number(priceUzs * travelers),
      });
      return res.status(200).json({
        checkout_url: `${siteUrl}/payment/mock?order=${encodeURIComponent(order.id)}`,
        mock: true,
      });
    }

    // --- Create the checkout at Paylov ---
    const result = await paylovRequest<CheckoutResponse>("POST", "/integrations/checkout", {
      external_id: order.id,
      amount: Number(amountTiyin),
      payment_provider: provider,
      return_url: `${siteUrl}/payment/return?order=${encodeURIComponent(order.id)}`,
    });

    if (!result.ok) {
      return res.status(502).json({ error: "Paylov checkout failed", detail: result.error });
    }

    const { checkout_url, order_id: paylovOrderId } = result.data;
    if (!checkout_url) {
      return res.status(502).json({ error: "Paylov did not return a checkout_url", detail: result.data });
    }

    // --- Remember what we asked Paylov to charge ---
    await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, {
      payment_state: STATE_PENDING,
      payment_provider: provider,
      paylov_order_id: String(paylovOrderId),
      amount_tiyin: Number(amountTiyin),
      total_amount: Number(priceUzs * travelers),
    });

    return res.status(200).json({ checkout_url });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
