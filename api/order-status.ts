import { sbSelect } from "./_lib";

type StatusRow = { id: string; order_number: string; payment_state: number; total_amount: number | string };

/**
 * GET /api/order-status?order=<id>
 *
 * Minimal read-only status for the post-payment return page. Customers cannot
 * read the orders table directly (RLS allows insert only), so this exposes just
 * the payment state and order number — never customer or contact details.
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
      `id=eq.${encodeURIComponent(orderId)}&select=id,order_number,payment_state,total_amount&limit=1`,
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: "Order not found" });

    return res.status(200).json({
      orderNumber: order.order_number,
      paymentState: Number(order.payment_state),
      totalAmount: Number(order.total_amount),
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
