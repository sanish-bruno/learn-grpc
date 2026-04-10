// server/utils/auth.js
const grpc = require("@grpc/grpc-js");

function validateAuthorization(authHeader) {
  if (!authHeader) return false;
  const [scheme, token] = String(authHeader).split(" ");
  return scheme === "Bearer" && token === "super-secret-token";
}

// Wrap the service handler with auth check
function withAuth(handler) {
  return (call, callback) => {
    const metadata = call.metadata?.getMap?.() || {};
    const authHeader = metadata["authorization"];
    console.log("authHeader", authHeader);
    console.log("metadata", metadata);

    if (!validateAuthorization(authHeader)) {
      const err = {
        code: grpc.status.UNAUTHENTICATED,
        details: "Missing or invalid Authorization header",
      };
      if (callback) return callback(err);
      // For streaming calls:
      if (call.emit) call.emit("error", err);
      return;
    }

    return handler(call, callback);
  };
}

module.exports = { withAuth };
