import crypto from "node:crypto";
import { STATE_CANCELLED, STATE_SUCCESS, isMockMode, sbSelect, webhookSecret } from "./_lib";

type MockOrderRow = {
  id: string;
  order_number: string;
  paylov_order_id: string | null;
  payment_provider: string | null;
};

/**
 * POST /api/mock-pay  { orderId, outcome: "success" | "cancel" }
 *
 * Test-only. Simulates what Paylov does after a customer pays: builds a
 * correctly signed webhook payload and posts it to the real webhook endpoint,
 * so the settlement path (signature check included) is exercised end to end.
 * Returns 404 unless PAYLOV_MOCK=1.
 */
export default async function handler(req: any, res: any) {
  if (!isMockMode()) return res.status(404).json({ error: "Mock mode is disabled" });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const orderId = String(body.orderId ?? "").trim();
    const outcome = String(body.outcome ?? "success");

    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const secret = webhookSecret();
    if (!secret) return res.status(500).json({ error: "Webhook secret is not configured" });

    const orders = await sbSelect<MockOrderRow>(
      "orders",
      `id=eq.${encodeURIComponent(orderId)}&select=id,order_number,paylov_order_id,payment_provider&limit=1`,
    );
    const order = orders[0];
    if (!order) return res.status(404).json({ error: "Order not found" });

    const state = outcome === "cancel" ? STATE_CANCELLED : STATE_SUCCESS;
    const paylovOrderId = order.paylov_order_id || `mock-${order.id}`;
    const paymentId = `mockpay-${Date.now()}`;
    const timestamp = Date.now().toString();

    const message = `${paylovOrderId}:${paymentId}:${state}:${timestamp}`;
    const signature = crypto.createHmac("sha256", secret).update(message, "utf8").digest("hex");

    const payload = {
      external_id: order.id,
      order_id: paylovOrderId,
      payment_id: paymentId,
      state,
      timestamp,
      signature,
      provider: order.payment_provider ?? "paylov",
    };

    const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, "");
    const hookRes = await fetch(`${siteUrl}/api/paylov-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const hookText = await hookRes.text();

    if (!hookRes.ok) {
      return res.status(502).json({ error: "Webhook rejected the mock payment", detail: hookText });
    }

    return res.status(200).json({ ok: true, state, webhook: hookText });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
