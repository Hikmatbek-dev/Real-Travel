import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Paylov (WLCM) API
//
// Every request is signed with HMAC-SHA256 over:
//   METHOD \n CANONICAL_PATH \n TIMESTAMP_MS \n SHA256(RAW_BODY)
// using the raw api_secret as the key. The signature must cover the exact
// bytes we send, so the serialized body is reused verbatim as the request body.
// ---------------------------------------------------------------------------

const PAYLOV_BASE_URL = process.env.PAYLOV_BASE_URL ?? "https://api.wlcm.uz/api/v1";

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

// Throttle outage alerts so one broken proxy does not send a message per
// request. Best-effort within a warm instance — good enough to avoid a flood.
let lastPaylovAlert = 0;
const PAYLOV_ALERT_INTERVAL_MS = 10 * 60 * 1000;

async function alertPaylovDown(reason: string): Promise<void> {
  const now = Date.now();
  if (now - lastPaylovAlert < PAYLOV_ALERT_INTERVAL_MS) return;
  lastPaylovAlert = now;
  await notifyTelegram(`\u{1F6A8} <b>To'lov tizimi ishlamayapti</b>\n${reason}`);
}

export async function paylovRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<PaylovResult<T>> {
  const apiKey = process.env.PAYLOV_API_KEY || "iyh5kKZtO2TZkwCLaK5MDFP_I416BTpBLyQa8ikDQhilBjS4T0u9e0ul3R4iSOJx";
  const apiSecret = process.env.PAYLOV_API_SECRET || apiKey;
  const partnerId = process.env.PAYLOV_PARTNER_ID || "91";

  const url = new URL(PAYLOV_BASE_URL.replace(/\/$/, "") + path);
  const rawBody = body === undefined ? "" : JSON.stringify(body);
  const timestamp = Date.now().toString();

  // Always sign Paylov's own path — the signature must not depend on whether
  // the request travels via the proxy.
  const signature = paylovSignature(method, url.pathname, timestamp, rawBody, apiSecret);

  // Paylov whitelists our IP, and Vercel functions have no fixed outbound
  // address, so in production the call is relayed through a host that does.
  // The proxy keeps method, path and body byte-identical.
  const proxyBase = process.env.PAYLOV_PROXY_URL?.replace(/\/$/, "");
  const proxySecret = process.env.PAYLOV_PROXY_SECRET;
  const target = proxyBase ? new URL(proxyBase + url.pathname + url.search) : url;

  let res: Response;
  try {
    res = await fetch(target, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
        "X-Partner-Id": partnerId,
        "X-Timestamp": timestamp,
        "X-Signature": signature,
        ...(proxyBase && proxySecret ? { "X-Proxy-Secret": proxySecret } : {}),
      },
      body: method === "GET" ? undefined : rawBody,
    });
  } catch (err) {
    // Reaching Paylov failed — through the proxy this usually means the VM or
    // its IP is down, and payments are silently broken until someone notices.
    // Alert the operator so a dead proxy does not go unseen.
    void alertPaylovDown(`Paylov ${proxyBase ? "(proxy) " : ""}so'rovi ishlamadi: ${(err as Error).message}`);
    return { ok: false, status: 502, error: `Paylov unreachable: ${(err as Error).message}` };
  }

  const text = await res.text();
  if (!res.ok) {
    // 403 through the proxy is the classic "IP no longer whitelisted" signature.
    if (res.status === 403 && proxyBase) {
      void alertPaylovDown("Paylov 403 qaytardi — IP whitelist mos kelmayapti (proxy IP o'zgargan bo'lishi mumkin).");
    }
    return { ok: false, status: res.status, error: text || res.statusText };
  }

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
  type OrderStateResponse = {
    data?: { order?: { paid?: boolean; canceled?: boolean } };
    order?: { paid?: boolean; canceled?: boolean };
    paid?: boolean;
    canceled?: boolean;
  };

  const result = await paylovRequest<OrderStateResponse>(
    "GET",
    `/orders/${encodeURIComponent(paylovOrderId)}`,
  );
  if (!result.ok) return null;

  const order = result.data?.data?.order ?? result.data?.order ?? result.data;
  if (!order) return null;

  return { paid: order.paid === true, canceled: order.canceled === true };
}

/**
 * Verifies that the caller is a signed-in admin.
 *
 * Checks the request's bearer token against Supabase Auth. Used by endpoints
 * that do real work on every call — without it they are an unauthenticated
 * way to burn the Paylov API quota.
 */
export async function isAdminRequest(req: { headers: Record<string, unknown> }): Promise<boolean> {
  const header = String(req.headers?.authorization ?? req.headers?.Authorization ?? "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return false;

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url) return false;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, ...(anonKey ? { apikey: anonKey } : {}) },
    });
    if (!res.ok) return false;
    const user = (await res.json()) as { id?: string; role?: string };
    return Boolean(user?.id) && user.role === "authenticated";
  } catch {
    return false;
  }
}

/**
 * Sends the operator a Telegram message — nobody sits watching the admin panel,
 * so a paid booking needs to reach a phone. Silently does nothing until
 * TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are configured, and never throws:
 * a failed notification must not roll back a settled payment.
 */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch {
    // Ignored on purpose — see the note above.
  }
}

// ---------------------------------------------------------------------------
// Supabase REST (service role — server side only, bypasses RLS)
// ---------------------------------------------------------------------------

function supabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY are not configured");
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
