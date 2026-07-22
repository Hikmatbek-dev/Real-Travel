import crypto from "node:crypto";
import {
  STATE_CANCELLED,
  STATE_SUCCESS,
  notifyTelegram,
  sbSelect,
  sbUpdate,
  webhookSecret,
  type OrderRow,
} from "./_lib";

type WebhookBody = {
  external_id?: string;
  order_id?: string | number;
  payment_id?: string | number;
  amount?: string;
  state?: string | number;
  provider?: string;
  timestamp?: string | number;
  signature?: string;
};

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * POST /api/paylov-webhook
 *
 * Paylov calls this when a payment settles. The payload is authenticated with
 * HMAC-SHA256 over "{order_id}:{payment_id}:{state}:{timestamp}" — without that
 * check anyone could POST "state: 2" and mark orders as paid for free.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = webhookSecret();
  if (!secret) return res.status(500).json({ error: "Webhook secret is not configured" });

  try {
    const body: WebhookBody = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const { external_id, order_id, payment_id, state, timestamp, signature, provider } = body;

    if (!signature) return res.status(401).json({ error: "Missing signature" });
    if (order_id === undefined || payment_id === undefined || state === undefined || timestamp === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // --- Verify authenticity ---
    const message = `${order_id}:${payment_id}:${state}:${timestamp}`;
    const expected = crypto.createHmac("sha256", secret).update(message, "utf8").digest("hex");
    if (!safeEqual(expected, String(signature))) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const numericState = Number(state);
    if (numericState !== STATE_SUCCESS && numericState !== STATE_CANCELLED) {
      // Nothing to settle (e.g. still pending) — acknowledge so Paylov stops retrying.
      return res.status(200).json({ ok: true, ignored: `state ${state}` });
    }

    // --- Locate the order: external_id is the id we sent at checkout ---
    let orders: OrderRow[] = [];
    if (external_id) {
      orders = await sbSelect<OrderRow>(
        "orders",
        `id=eq.${encodeURIComponent(String(external_id))}&select=id,order_number,travelers,tour_id,payment_state&limit=1`,
      );
    }
    if (!orders.length) {
      orders = await sbSelect<OrderRow>(
        "orders",
        `paylov_order_id=eq.${encodeURIComponent(String(order_id))}&select=id,order_number,travelers,tour_id,payment_state&limit=1`,
      );
    }

    const order = orders[0];
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Already settled as paid — acknowledge without downgrading it.
    if (order.payment_state === STATE_SUCCESS) {
      return res.status(200).json({ ok: true, alreadyPaid: true });
    }

    await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, {
      payment_state: numericState,
      paylov_payment_id: String(payment_id),
      paylov_order_id: String(order_id),
      ...(provider ? { payment_provider: provider } : {}),
      ...(numericState === STATE_SUCCESS
        ? { paid_at: new Date().toISOString(), status: "Confirmed" }
        : { status: "Cancelled" }),
    });

    if (numericState === STATE_SUCCESS) {
      await notifyTelegram(
        `\u2705 <b>To'lov qabul qilindi</b>\nBuyurtma: <b>${order.order_number}</b>`,
      );
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
