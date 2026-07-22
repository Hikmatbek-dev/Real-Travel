#!/usr/bin/env node
/**
 * Paylov egress proxy.
 *
 * Paylov whitelists the IP that calls their API, and Vercel functions have no
 * fixed outbound address — whatever IP is registered would eventually stop
 * matching and payments would fail silently. This runs on a host with a static
 * IP and forwards our requests to Paylov unchanged.
 *
 * The request is relayed verbatim: Paylov's HMAC covers method, path, timestamp
 * and body, so nothing here may alter them or the signature breaks.
 *
 * Not an open proxy — it only ever talks to PAYLOV_BASE_URL, and every request
 * must carry the shared secret.
 *
 * Env: PAYLOV_BASE_URL (e.g. https://apidev.wlcm.uz), PROXY_SECRET, PORT
 */
const http = require("node:http");
const crypto = require("node:crypto");

const TARGET = (process.env.PAYLOV_BASE_URL || "https://apidev.wlcm.uz").replace(/\/$/, "");
const SECRET = process.env.PROXY_SECRET || "";
const PORT = Number(process.env.PORT || 8080);

if (!SECRET) {
  console.error("PROXY_SECRET is required — refusing to start an unauthenticated proxy.");
  process.exit(1);
}

/** Constant-time compare, so the secret cannot be guessed byte by byte. */
function secretOk(given) {
  const a = Buffer.from(String(given || ""), "utf8");
  const b = Buffer.from(SECRET, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Headers that belong to this hop rather than the forwarded request.
const STRIP = new Set([
  "host",
  "connection",
  "content-length",
  "x-proxy-secret",
  "accept-encoding",
]);

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok");
  }

  if (!secretOk(req.headers["x-proxy-secret"])) {
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end('{"error":"unauthorized"}');
  }

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));

  req.on("end", async () => {
    const body = Buffer.concat(chunks);

    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!STRIP.has(key.toLowerCase())) headers[key] = value;
    }

    try {
      const upstream = await fetch(TARGET + req.url, {
        method: req.method,
        headers,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
      });

      const payload = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      });
      res.end(payload);

      console.log(`${req.method} ${req.url} -> ${upstream.status}`);
    } catch (err) {
      console.error(`${req.method} ${req.url} -> ${err.message}`);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "upstream_unreachable", detail: err.message }));
    }
  });
});

server.listen(PORT, () => console.log(`Paylov proxy on :${PORT} -> ${TARGET}`));
