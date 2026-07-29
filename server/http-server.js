const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");
const productsDB = require("./products");

const HTTP_SERVICE_PORT = 4001;
const SUPPORTED_MODES = ["insecure", "tls", "mtls"];

function parseMode() {
  const args = process.argv.slice(2);
  let mode = process.env.HTTP_SERVER_MODE || process.env.SERVER_MODE;

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

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;
  const method = req.method || "GET";

  console.log(`[${method}] ${pathname}`);

  try {
    if (method === "GET" && pathname === "/health") {
      return sendJson(res, 200, { status: "ok" });
    }

    if (method === "GET" && pathname === "/products") {
      return sendJson(res, 200, { products: productsDB.getProducts() });
    }

    const productMatch = pathname.match(/^\/products\/(\d+)$/);

    if (method === "GET" && productMatch) {
      const product = productsDB.getProductById(Number(productMatch[1]));
      if (!product) return sendJson(res, 404, { error: "Not found" });
      return sendJson(res, 200, product);
    }

    if (method === "POST" && pathname === "/products") {
      const body = await readBody(req);
      const created = productsDB.addProduct(body);
      return sendJson(res, 201, created);
    }

    if (method === "PUT" && productMatch) {
      const body = await readBody(req);
      const updated = productsDB.updateProduct(Number(productMatch[1]), body);
      if (!updated) return sendJson(res, 404, { error: "Not found" });
      return sendJson(res, 200, updated);
    }

    if (method === "DELETE" && productMatch) {
      const deleted = productsDB.deleteProduct(Number(productMatch[1]));
      if (!deleted) return sendJson(res, 404, { error: "Not found" });
      return sendJson(res, 200, { deleted: true });
    }

    return sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    console.error("Request error:", err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}

const mode = parseMode();
const server =
  mode === "insecure"
    ? http.createServer(handleRequest)
    : https.createServer(buildTlsOptions(mode), handleRequest);

const scheme = mode === "insecure" ? "http" : "https";

server.listen(HTTP_SERVICE_PORT, "0.0.0.0", () => {
  console.log(
    `HTTP service running in ${mode.toUpperCase()} mode at ${scheme}://0.0.0.0:${HTTP_SERVICE_PORT}`
  );
});
