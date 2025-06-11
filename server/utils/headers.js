const gRPC = require("@grpc/grpc-js");

// Create response headers
function createResponseHeaders() {
  const responseHeaders = new gRPC.Metadata();
  responseHeaders.add("custom-header", "custom-value");
  responseHeaders.add("response-time", new Date().toISOString());
  responseHeaders.add(
    "set-cookie",
    "sessionId=abc123; Path=/; HttpOnly; Secure"
  );
  return responseHeaders;
}

// Create trailer metadata
function createTrailerMetadata() {
  const trailerMetadata = new gRPC.Metadata();
  trailerMetadata.add("trailer-timestamp", new Date().toISOString());
  return trailerMetadata;
}

// Create common headers for all requests
function createCommonHeaders() {
  const commonHeaders = new gRPC.Metadata();
  commonHeaders.add("server-timestamp", new Date().toISOString());
  commonHeaders.add("server-version", "1.0.0");
  commonHeaders.add("Access-Control-Allow-Origin", "*");
  commonHeaders.add(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  commonHeaders.add(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  commonHeaders.add("Access-Control-Allow-Credentials", "true");
  commonHeaders.add("Access-Control-Max-Age", "86400"); // 24 hours
  return commonHeaders;
}

// Middleware for adding common headers
function addCommonHeaders(call, callback) {
  const commonHeaders = createCommonHeaders();
  call.sendMetadata(commonHeaders);
  return callback();
}

// Log incoming headers
function logIncomingHeaders(call) {
  const incomingHeaders = call.metadata.getMap();
  console.log("Incoming headers:", incomingHeaders);
  return incomingHeaders;
}

module.exports = {
  createResponseHeaders,
  createTrailerMetadata,
  createCommonHeaders,
  addCommonHeaders,
  logIncomingHeaders,
};
