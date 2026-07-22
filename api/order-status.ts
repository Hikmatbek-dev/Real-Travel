import {
  STATE_CANCELLED,
  STATE_PENDING,
  STATE_SUCCESS,
  paylovOrderState,
  sbSelect,
  sbUpdate,
} from "./_lib";

type StatusRow = {
  id: string;
  order_number: string;
  payment_state: number;
  total_amount: number | string;
  paylov_order_id: string | null;
};

/**
 * GET /api/order-status?order=<id>
 *
 * Minimal read-only status for the post-payment return page. Customers cannot
 * read the orders table directly (RLS allows insert only), so this exposes just
 * the payment state and order number — never customer or contact details.
 *
 * While an order is still pending this also pulls the authoritative state from
 * Paylov and settles it. That makes payment confirmation work even though the
 * webhook is not registered on Paylov's side — the webhook, when it does
 * arrive, simply settles the order first and this becomes a no-op.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const orderId = String(req.query?.order ?? "").trim();
  if (!orderId) return res.status(400).json({ error: "order is required" });

  try {
    const rows = await sbSelect<StatusRow>(
      "orders",
      `id=eq.${encodeURIComponent(orderId)}&select=id,order_number,payment_state,total_amount,paylov_order_id&limit=1`,
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: "Order not found" });

    let paymentState = Number(order.payment_state);

    // Mock checkouts carry a synthetic id that Paylov knows nothing about.
    const isRealPaylovOrder = !!order.paylov_order_id && !order.paylov_order_id.startsWith("mock-");

    if (paymentState === STATE_PENDING && isRealPaylovOrder) {
      const remote = await paylovOrderState(order.paylov_order_id!);

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

    return res.status(200).json({
      orderNumber: order.order_number,
      paymentState,
      totalAmount: Number(order.total_amount),
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
