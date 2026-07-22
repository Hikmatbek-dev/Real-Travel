import {
  STATE_CANCELLED,
  STATE_PENDING,
  STATE_SUCCESS,
  isAdminRequest,
  paylovOrderState,
  sbSelect,
  sbUpdate,
} from "./_lib";

type PendingRow = { id: string; paylov_order_id: string | null };

const MAX_ORDERS = 25;

/**
 * POST /api/reconcile
 *
 * Settles orders that were paid at Paylov but never confirmed here — the case
 * where a customer pays and then closes the tab instead of returning to the
 * site, so neither the return page nor the (unregistered) webhook settles them.
 * The admin panel calls this when the orders view opens.
 *
 * Only pulls authoritative state from Paylov and writes what Paylov reports —
 * it never invents a payment. Requires an admin session, because each call
 * fans out into one Paylov request per pending order.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Every call fans out into one Paylov request per pending order, so this
  // stays behind the admin session rather than being open to the internet.
  if (!(await isAdminRequest(req))) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const pending = await sbSelect<PendingRow>(
      "orders",
      `payment_state=eq.${STATE_PENDING}&paylov_order_id=not.is.null&select=id,paylov_order_id&order=created_at.desc&limit=${MAX_ORDERS}`,
    );

    let confirmed = 0;
    let cancelled = 0;

    for (const order of pending) {
      const paylovOrderId = order.paylov_order_id;
      if (!paylovOrderId || paylovOrderId.startsWith("mock-")) continue;

      const remote = await paylovOrderState(paylovOrderId);
      if (!remote) continue;

      if (remote.paid) {
        await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, {
          payment_state: STATE_SUCCESS,
          status: "Confirmed",
          paid_at: new Date().toISOString(),
        });
        confirmed += 1;
      } else if (remote.canceled) {
        await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, {
          payment_state: STATE_CANCELLED,
          status: "Cancelled",
        });
        cancelled += 1;
      }
    }

    return res.status(200).json({ checked: pending.length, confirmed, cancelled });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
