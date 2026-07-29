const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");
const { WebSocketServer } = require("ws");
const productsDB = require("./products");

const WS_SERVICE_PORT = 4002;
const SUPPORTED_MODES = ["insecure", "tls", "mtls"];

function parseMode() {
  const args = process.argv.slice(2);
  let mode = process.env.WS_SERVER_MODE || process.env.SERVER_MODE;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--mode" || arg === "-m") {
      mode = args[i + 1];
      i++;
    } else if (arg.startsWith("--mode=")) {
      mode = arg.slice("--mode=".length);
    } else if (SUPPORTED_MODES.includes(arg)) {
      mode = arg;
    }
  }

  mode = (mode || "tls").toLowerCase();

  if (!SUPPORTED_MODES.includes(mode)) {
    console.error(
      `Invalid mode "${mode}". Supported modes: ${SUPPORTED_MODES.join(", ")}`
    );
    process.exit(1);
  }

  return mode;
}

function buildTlsOptions(mode) {
  const cert = fs.readFileSync(path.join(__dirname, "certs/server-cert.pem"));
  const key = fs.readFileSync(path.join(__dirname, "certs/server-key.pem"));

  const options = { cert, key };

  if (mode === "mtls") {
    options.ca = fs.readFileSync(
      path.join(__dirname, "../../bruno/certs/localhost-cert.pem")
    );
    options.requestCert = true;
    options.rejectUnauthorized = true;
  }

  return options;
}

function send(ws, payload) {
  ws.send(JSON.stringify(payload));
}

function handleMessage(ws, raw) {
  let message;
  try {
    message = JSON.parse(raw.toString());
  } catch (err) {
    return send(ws, { type: "error", error: "Invalid JSON" });
  }

  const { type, payload } = message || {};
  console.log(`ws message: ${type}`);

  switch (type) {
    case "ping":
      return send(ws, { type: "pong", timestamp: new Date().toISOString() });

    case "list":
      return send(ws, {
        type: "products",
        products: productsDB.getProducts(),
      });

    case "get": {
      const product = productsDB.getProductById(Number(payload?.id));
      if (!product) return send(ws, { type: "error", error: "Not found" });
      return send(ws, { type: "product", product });
    }

    case "create": {
      const created = productsDB.addProduct(payload || {});
      return send(ws, { type: "created", product: created });
    }

    case "update": {
      const updated = productsDB.updateProduct(
        Number(payload?.id),
        payload || {}
      );
      if (!updated) return send(ws, { type: "error", error: "Not found" });
      return send(ws, { type: "updated", product: updated });
    }

    case "delete": {
      const deleted = productsDB.deleteProduct(Number(payload?.id));
      if (!deleted) return send(ws, { type: "error", error: "Not found" });
      return send(ws, { type: "deleted", id: Number(payload.id) });
    }

    default:
      return send(ws, { type: "error", error: `Unknown type: ${type}` });
  }
}

const mode = parseMode();
const httpServer =
  mode === "insecure"
    ? http.createServer()
    : https.createServer(buildTlsOptions(mode));

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws, req) => {
  console.log(`ws client connected from ${req.socket.remoteAddress}`);
  send(ws, { type: "welcome", message: "Connected to product ws server" });

  ws.on("message", (raw) => handleMessage(ws, raw));
  ws.on("close", () => console.log("ws client disconnected"));
  ws.on("error", (err) => console.error("ws error:", err));
});

const scheme = mode === "insecure" ? "ws" : "wss";

httpServer.listen(WS_SERVICE_PORT, "0.0.0.0", () => {
  console.log(
    `WebSocket service running in ${mode.toUpperCase()} mode at ${scheme}://0.0.0.0:${WS_SERVICE_PORT}`
  );
});
