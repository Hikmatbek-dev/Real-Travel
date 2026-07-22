# Paylov egress proxy

Paylov whitelists the IP address that calls their API. Vercel functions have no
fixed outbound IP, so a whitelisted address would eventually stop matching and
payments would fail with no obvious cause.

This is a small relay that runs on a host with a static IP. Vercel calls it, it
calls Paylov. Method, path and body are forwarded byte-for-byte, so Paylov's
HMAC signature stays valid — the proxy never signs or rewrites anything.

```
Vercel function ──> proxy (static IP, whitelisted) ──> apidev.wlcm.uz
```

Only that one IP has to be registered with Paylov, and it stays the same for
the life of the server.

## What you need

Any VPS with a static IP — the cheapest tier is plenty (this relays a handful of
requests per booking). DigitalOcean, Hetzner, or a local Uzbek provider all work.
Ubuntu 22.04+ or Debian 12+, and Node.js 18 or newer.

You will also need a subdomain pointing at the server, e.g.
`proxy.real-travel.uz` → the VPS IP. TLS is not optional here: the API key and
signature travel in the headers.

## Setup

```bash
# 1. Node (skip if already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Drop server.js on the box
sudo mkdir -p /opt/paylov-proxy
sudo cp server.js /opt/paylov-proxy/

# 3. Generate a shared secret and keep it — Vercel needs the same value
openssl rand -hex 32
```

Create `/etc/systemd/system/paylov-proxy.service`:

```ini
[Unit]
Description=Paylov egress proxy
After=network.target

[Service]
Environment=PAYLOV_BASE_URL=https://apidev.wlcm.uz
Environment=PROXY_SECRET=<the secret you generated>
Environment=PORT=8080
ExecStart=/usr/bin/node /opt/paylov-proxy/server.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now paylov-proxy
curl localhost:8080/healthz    # -> ok
```

### TLS

Caddy gets a certificate automatically:

```bash
sudo apt-get install -y caddy
```

`/etc/caddy/Caddyfile`:

```
proxy.real-travel.uz {
    reverse_proxy localhost:8080
}
```

```bash
sudo systemctl restart caddy
curl https://proxy.real-travel.uz/healthz    # -> ok
```

### Firewall

The proxy itself should not be reachable except through Caddy:

```bash
sudo ufw allow 22,80,443/tcp
sudo ufw enable
```

## Point Vercel at it

Add to the project's environment variables, then redeploy:

| Name | Value |
|---|---|
| `PAYLOV_PROXY_URL` | `https://proxy.real-travel.uz` |
| `PAYLOV_PROXY_SECRET` | the secret from step 3 |

`PAYLOV_BASE_URL` stays as it is — it is what the request is signed against.
Remove `PAYLOV_PROXY_URL` and everything goes direct again, which is handy for
local work.

## Give Paylov the address

The IP to register in the whitelist is the VPS's public address:

```bash
curl -s https://api.ipify.org    # run this on the VPS
```

## Checking it works

```bash
# on the VPS
journalctl -u paylov-proxy -f
```

A successful checkout logs `POST /api/v1/integrations/checkout -> 200`. If
Paylov starts returning 403, the whitelist no longer matches the server's
address — check `curl -s https://api.ipify.org` on the box against what they
have registered.
