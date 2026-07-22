import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Paylov (WLCM) API
//
// Every request is signed with HMAC-SHA256 over:
//   METHOD \n CANONICAL_PATH \n TIMESTAMP_MS \n SHA256(RAW_BODY)
// using the raw api_secret as the key. The signature must cover the exact
// bytes we send, so the serialized body is reused verbatim as the request body.
// ---------------------------------------------------------------------------

const PAYLOV_BASE_URL = process.env.PAYLOV_BASE_URL ?? "https://apidev.wlcm.uz/api/v1";

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export function paylovSignature(
  method: string,
  canonicalPath: string,
  timestamp: string,
  rawBody: string,
  secret: string,
): string {
  const message = `${method}\n${canonicalPath}\n${timestamp}\n${sha256Hex(rawBody)}`;
  return crypto.createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

export type PaylovResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: string };

export async function paylovRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<PaylovResult<T>> {
  const apiKey = process.env.PAYLOV_API_KEY;
  const apiSecret = process.env.PAYLOV_API_SECRET;
  if (!apiKey || !apiSecret) {
    return { ok: false, status: 500, error: "PAYLOV_API_KEY / PAYLOV_API_SECRET are not configured" };
  }

  const url = new URL(PAYLOV_BASE_URL.replace(/\/$/, "") + path);
  const rawBody = body === undefined ? "" : JSON.stringify(body);
  const timestamp = Date.now().toString();
  const signature = paylovSignature(method, url.pathname, timestamp, rawBody, apiSecret);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Timestamp": timestamp,
        "X-Signature": signature,
      },
      body: method === "GET" ? undefined : rawBody,
    });
  } catch (err) {
    return { ok: false, status: 502, error: `Paylov unreachable: ${(err as Error).message}` };
  }

  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, error: text || res.statusText };

  try {
    return { ok: true, status: res.status, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 502, error: `Paylov returned non-JSON: ${text.slice(0, 200)}` };
  }
}

/**
 * Ask Paylov whether an order has been paid.
 *
 * Paylov only pushes a webhook to a URL it has registered for the partner, so
 * we cannot rely on it being delivered. `GET /orders/{id}` lets us pull the
 * authoritative state ourselves, which keeps settlement working regardless.
 * Returns null when the state could not be determined.
 */
export async function paylovOrderState(
  paylovOrderId: string,
): Promise<{ paid: boolean; canceled: boolean } | null> {
  type OrderStateResponse = { data?: { order?: { paid?: boolean; canceled?: boolean } } };

  const result = await paylovRequest<OrderStateResponse>(
    "GET",
    `/orders/${encodeURIComponent(paylovOrderId)}`,
  );
  if (!result.ok) return null;

  const order = result.data?.data?.order;
  if (!order) return null;

  return { paid: order.paid === true, canceled: order.canceled === true };
}

// ---------------------------------------------------------------------------
// Supabase REST (service role — server side only, bypasses RLS)
// ---------------------------------------------------------------------------

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured");
  return { url: url.replace(/\/$/, ""), key };
}

export async function sbSelect<T>(table: string, query: string): Promise<T[]> {
  const { url, key } = supabaseConfig();
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Supabase select ${table} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T[];
}

export async function sbUpdate(table: string, query: string, patch: Record<string, unknown>): Promise<void> {
  const { url, key } = supabaseConfig();
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Supabase update ${table} failed: ${res.status} ${await res.text()}`);
}

// ---------------------------------------------------------------------------
// Shared types / constants
// ---------------------------------------------------------------------------

export const PAYMENT_PROVIDERS = ["payme", "click", "paylov", "uzum"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

// ---------------------------------------------------------------------------
// Mock mode
//
// With PAYLOV_MOCK=1 the checkout skips Paylov entirely and sends the customer
// to a local simulated payment page. The rest of the flow (webhook, signature
// verification, order settlement) runs for real, so switching the flag off is
// the only change needed once real Paylov credentials arrive.
// ---------------------------------------------------------------------------

const MOCK_WEBHOOK_SECRET = "mock-webhook-secret";

export function isMockMode(): boolean {
  return process.env.PAYLOV_MOCK === "1";
}

/** Secret used to sign/verify webhook payloads. Falls back to a fixed value in mock mode. */
export function webhookSecret(): string | undefined {
  return (
    process.env.PAYLOV_WEBHOOK_SECRET ||
    process.env.PAYLOV_API_SECRET ||
    (isMockMode() ? MOCK_WEBHOOK_SECRET : undefined)
  );
}

export const STATE_PENDING = 1;
export const STATE_SUCCESS = 2;
export const STATE_CANCELLED = -2;

export type OrderRow = {
  id: string;
  order_number: string;
  travelers: number;
  tour_id: string | null;
  payment_state: number;
};

export type TourRow = {
  id: string;
  name: string;
  price_uzs: number | string;
};
