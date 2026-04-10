// server/utils/serverAuthInterceptor.js
const gRPC = require("@grpc/grpc-js");

function serverAuthInterceptor(methodDescriptor, call) {
  console.log("methodDescriptor", methodDescriptor.path);
  // console.log("call", call);
  const metadata = call.metadata?.getMap?.() || {};
  console.log("metadata", metadata);

  // Check if the method is a reflection method
  const isReflection = methodDescriptor.path?.includes("reflection") || 
                       methodDescriptor.path === "/grpc.reflection.v1.ServerReflection/ServerReflectionInfo";

  // if (isReflection) {
  //   const err = {
  //     code: gRPC.status.UNAUTHENTICATED,
  //     details: "Unauthenticated: Reflection service is not accessible",
  //   };
  //   // call.emit("error", err);
  //   return;
  // }

  return call;
}

module.exports = { serverAuthInterceptor };
