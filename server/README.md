# gRPC E-Commerce Demo App

A demo backend exposing the same product catalog over three protocols — **gRPC**, **HTTP/REST**, and **WebSocket** — each of which can be booted in **insecure**, **TLS**, or **mTLS** mode using a shared set of certificates.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Server + client certificates in `./certs/` (see `generate-certs.sh`)
- For mTLS: the CA at `../../bruno/certs/localhost-cert.pem` (used to verify client certs)

## Setup

```bash
npm install
```

## Servers overview

| Server | File | Port | Insecure scheme | Secure scheme |
|---|---|---|---|---|
| gRPC | `server.js` | 4000 | `http://` (h2c) | `https://` |
| HTTP / REST | `http-server.js` | 4001 | `http://` | `https://` |
| WebSocket | `ws-server.js` | 4002 | `ws://` | `wss://` |

Every server accepts the same mode selector:

- CLI flag: `--mode=insecure|tls|mtls` (also `-m mtls`, or bare positional `mtls`)
- Env var: `SERVER_MODE=mtls`

If unspecified, all servers default to **TLS**.

## Run a single server

```bash
# gRPC
npm run start:product:insecure
npm run start:product:tls
npm run start:product:mtls

# HTTP
npm run start:http:insecure
npm run start:http:tls
npm run start:http:mtls

# WebSocket
npm run start:ws:insecure
npm run start:ws:tls
npm run start:ws:mtls
```

Or invoke `node` directly:

```bash
node server.js       --mode=mtls
node http-server.js  --mode=tls
node ws-server.js    --mode=insecure
```

## Run everything at once

`scripts/start-all.js` boots all three servers with the chosen mode and prefixes their logs. Ctrl+C stops them together.

```bash
npm run start:all:insecure
npm run start:all:tls
npm run start:all:mtls
# or
SERVER_MODE=mtls npm run start:all
node scripts/start-all.js --mode=tls
```

---

## gRPC server (port 4000)

Defined in `product.proto`. Reflection is enabled via `descriptor_set.bin`, and unary/streaming RPCs are all wired to the same `products.json`-backed store.

### RPCs

| RPC | Kind | Request | Response |
|---|---|---|---|
| `CreateProduct` | unary | `ProductItem` | `ProductItem` |
| `ReadProduct` | unary | `ProductId` | `ProductItem` |
| `ReadProducts` | unary | `VoidParam` | `ProductItems` |
| `UpdateProduct` | unary | `ProductItem` | `ProductItem` |
| `DeleteProduct` | unary | `ProductId` | `DeleteProductResponse` |
| `CreateExampleProduct` | unary | `VoidParam` | `ProductItem` |
| `WatchProductUpdates` | server-stream | `ProductId` | stream of `ProductUpdate` (every 5s) |
| `BatchCreateProducts` | client-stream | stream of `ProductItem` | `ProductBatchResponse` |
| `MonitorProductPrices` | bidi-stream | stream of `PriceAlert` | stream of `PriceUpdate` |

### Auth

Reflection and RPCs are gated by `serverAuthInterceptor`. Include metadata:

```
authorization: password
```

### Example (`grpcurl`)

```bash
# insecure
grpcurl -plaintext -H 'authorization: password' \
  localhost:4000 product.Product/ReadProducts

# tls (self-signed → skip verify)
grpcurl -insecure -H 'authorization: password' \
  localhost:4000 product.Product/ReadProducts

# mtls
grpcurl \
  -cert client-cert.pem -key client-key.pem \
  -cacert ./certs/server-cert.pem \
  -H 'authorization: password' \
  localhost:4000 product.Product/ReadProducts
```

---

## HTTP server (port 4001)

Plain REST over `node:http` / `node:https`. JSON in, JSON out. No auth.

### Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/health` | — | `{ "status": "ok" }` |
| `GET` | `/products` | — | `{ "products": [...] }` |
| `GET` | `/products/:id` | — | product or `404` |
| `POST` | `/products` | `{ name, description, price, category }` | created product |
| `PUT` | `/products/:id` | partial product | updated product or `404` |
| `DELETE` | `/products/:id` | — | `{ "deleted": true }` or `404` |

### Examples

```bash
# insecure
curl http://localhost:4001/products

# tls (self-signed → -k)
curl -k https://localhost:4001/products

# mtls
curl \
  --cert client-cert.pem --key client-key.pem \
  --cacert ./certs/server-cert.pem \
  https://localhost:4001/products

# create
curl -k -X POST https://localhost:4001/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Widget","description":"a widget","price":9.99,"category":0}'
```

---

## WebSocket server (port 4002)

`ws`-based server. All frames are JSON `{ type, payload }`. On connect the server pushes a `welcome` message.

### Message types

| Send | Response |
|---|---|
| `{"type":"ping"}` | `{"type":"pong","timestamp":"..."}` |
| `{"type":"list"}` | `{"type":"products","products":[...]}` |
| `{"type":"get","payload":{"id":1}}` | `{"type":"product","product":{...}}` |
| `{"type":"create","payload":{"name":"...","price":1.0,"category":0}}` | `{"type":"created","product":{...}}` |
| `{"type":"update","payload":{"id":1,"price":19.99}}` | `{"type":"updated","product":{...}}` |
| `{"type":"delete","payload":{"id":1}}` | `{"type":"deleted","id":1}` |

Malformed JSON, unknown types, or missing records return `{"type":"error","error":"..."}`.

### Examples (`wscat`)

```bash
# insecure
wscat -c ws://localhost:4002

# tls
wscat -c wss://localhost:4002 --no-check

# mtls
wscat -c wss://localhost:4002 \
  --cert client-cert.pem \
  --key  client-key.pem \
  --ca   ./certs/server-cert.pem
```

Then at the `>` prompt:

```
{"type":"list"}
{"type":"get","payload":{"id":1}}
{"type":"create","payload":{"name":"Widget","description":"a widget","price":9.99,"category":0}}
```

### Node client snippet

```js
const WebSocket = require("ws");
const ws = new WebSocket("wss://localhost:4002", {
  rejectUnauthorized: false, // tls with self-signed
  // mtls:
  // cert: fs.readFileSync("client-cert.pem"),
  // key:  fs.readFileSync("client-key.pem"),
  // ca:   fs.readFileSync("./certs/server-cert.pem"),
});
ws.on("open", () => ws.send(JSON.stringify({ type: "list" })));
ws.on("message", (raw) => console.log(JSON.parse(raw.toString())));
```

---

## Certificates

- `certs/server-cert.pem`, `certs/server-key.pem` — server identity used by all three servers for TLS/mTLS.
- `../../bruno/certs/localhost-cert.pem` — CA used **only in mTLS mode** to verify incoming client certificates.
- Regenerate with `./generate-certs.sh`.

## Project layout

```
server/
├── server.js               # gRPC (port 4000)
├── http-server.js          # HTTP/REST (port 4001)
├── ws-server.js            # WebSocket (port 4002)
├── scripts/
│   └── start-all.js        # unified launcher
├── product.proto           # gRPC service definition
├── product-message.proto   # gRPC message definitions
├── products.js             # shared file-backed product store
├── products.json           # persisted product data
├── certs/                  # server-side certs & keys
├── utils/                  # headers, auth, interceptors
└── package.json
```

## License

MIT
