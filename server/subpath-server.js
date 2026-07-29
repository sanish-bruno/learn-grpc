const http2 = require("node:http2");

// Configuration
const SUBPATH = "/api/grpc"; // The subpath prefix
const GRPC_BACKEND_PORT = 4000; // The actual gRPC server port
const PROXY_PORT = 4001; // The proxy port that clients connect to

// Create an HTTP/2 proxy server that strips the subpath before forwarding to the gRPC backend
const proxy = http2.createServer();

proxy.on("stream", (clientStream, headers) => {
  const originalPath = headers[":path"];
  const method = headers[":method"];

  console.log(`[proxy] Incoming request: ${method} ${originalPath}`);

  // Check if the path starts with the subpath
  if (!originalPath.startsWith(SUBPATH + "/")) {
    console.log(`[proxy] Path does not start with ${SUBPATH}/, rejecting`);
    clientStream.respond({ ":status": 404 });
    clientStream.end("Not found - path must start with " + SUBPATH);
    return;
  }

  // Strip the subpath prefix to get the real gRPC path
  const strippedPath = originalPath.slice(SUBPATH.length);
  console.log(`[proxy] Stripped path: ${strippedPath}`);

  // Build the forwarded headers with stripped path
  const forwardHeaders = { ...headers, ":path": strippedPath };

  // Create an HTTP/2 client session to the backend
  const backendSession = http2.connect(`http://127.0.0.1:${GRPC_BACKEND_PORT}`);

  backendSession.on("error", (err) => {
    console.error("[proxy] Backend session error:", err.message);
    if (!clientStream.closed) {
      clientStream.respond({ ":status": 502 });
      clientStream.end("Backend unavailable");
    }
  });

  const backendStream = backendSession.request(forwardHeaders);

  let pendingTrailers = null;

  // Forward response headers from backend to client
  // Use waitForTrailers so we can forward gRPC trailers
  backendStream.on("response", (responseHeaders) => {
    console.log("[proxy] Backend responded");
    clientStream.respond(responseHeaders, { waitForTrailers: true });
  });

  // When the client stream is ready for trailers, send any we received from backend
  clientStream.on("wantTrailers", () => {
    if (pendingTrailers) {
      console.log("[proxy] Sending trailers to client:", pendingTrailers);
      clientStream.sendTrailers(pendingTrailers);
    } else {
      clientStream.sendTrailers({});
    }
  });

  // Pipe data bidirectionally
  backendStream.on("data", (chunk) => {
    if (!clientStream.closed) {
      clientStream.write(chunk);
    }
  });

  clientStream.on("data", (chunk) => {
    if (!backendStream.closed) {
      backendStream.write(chunk);
    }
  });

  // Store trailers from backend
  backendStream.on("trailers", (trailers) => {
    console.log("[proxy] Received backend trailers:", trailers);
    pendingTrailers = trailers;
  });

  // Handle stream end
  backendStream.on("end", () => {
    if (!clientStream.closed) {
      clientStream.end();
    }
    backendSession.close();
  });

  clientStream.on("end", () => {
    if (!backendStream.closed) {
      backendStream.end();
    }
  });

  // Handle errors
  clientStream.on("error", (err) => {
    if (err.code === "ERR_HTTP2_INVALID_STREAM") return;
    console.error("[proxy] Client stream error:", err.message);
    if (!backendStream.closed) backendStream.close();
    backendSession.close();
  });

  backendStream.on("error", (err) => {
    if (err.code === "ERR_HTTP2_INVALID_STREAM") return;
    console.error("[proxy] Backend stream error:", err.message);
    if (!clientStream.closed) clientStream.close();
    backendSession.close();
  });
});

proxy.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log(`\n=== gRPC Subpath Proxy ===`);
  console.log(`Proxy listening on: http://0.0.0.0:${PROXY_PORT}`);
  console.log(`Subpath prefix: ${SUBPATH}`);
  console.log(`Forwarding to gRPC backend: http://127.0.0.1:${GRPC_BACKEND_PORT}`);
  console.log(`\nClients should connect to: http://localhost:${PROXY_PORT}${SUBPATH}`);
  console.log(`Example: a call to product.Product/ReadProducts`);
  console.log(`  -> client sends :path = ${SUBPATH}/product.Product/ReadProducts`);
  console.log(`  -> proxy strips subpath, forwards :path = /product.Product/ReadProducts`);
  console.log(`==============================\n`);
});
