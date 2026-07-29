// server/utils/authInterceptor.js
const grpc = require("@grpc/grpc-js");

function validateAuthorization(authHeader) {
  if (!authHeader) return false;
  const [scheme, token] = String(authHeader).split(" ");
  return scheme === "Bearer" && token === "super-secret-token";
}

function authInterceptor(call, methodDefinition, next) {
  const md = call.metadata?.getMap?.() || {};
  const authHeader = md["authorization"];
  console.log("metadata", md);
  console.log("methodDefinition", methodDefinition);
  console.log("call", call);

  const isReflection =
    methodDefinition.handler.path ===
    "/grpc.reflection.v1.ServerReflection/ServerReflectionInfo";

  // If you want to require auth for reflection only:
  const requireAuth = isReflection;
  // If you want for ALL methods, use `true`.
  console.log("requireAuth", requireAuth);
  //   console.log("methodDefinition", methodDefinition.handler.path);
  console.log("authHeader", authHeader);

  if (requireAuth && !validateAuthorization(authHeader)) {
    const err = {
      code: grpc.status.UNAUTHENTICATED,
      details: "Invalid or missing Authorization header",
    };
    // End the call with error
    call.emit("error", err);
    return;
  }

  // Else proceed to next
  //   return next(call);
}

module.exports = { authInterceptor };
