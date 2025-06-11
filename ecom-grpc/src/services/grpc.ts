import { grpc } from "@improbable-eng/grpc-web";
import { ProductClient } from "../generated/src/proto/product_pb_service";
import { OrderClient } from "../generated/src/proto/order_pb_service";

// Create gRPC client instances with Envoy proxy URL
const productClient = new ProductClient("http://localhost:8082", {
  debug: true,
});

const orderClient = new OrderClient("http://localhost:8082", {
  debug: true,
});

// Helper function to handle gRPC errors
const handleGrpcError = (error: Error): Error => {
  console.error("gRPC Error:", error);
  return new Error(error.message || "An error occurred");
};

export { productClient, orderClient, handleGrpcError };
