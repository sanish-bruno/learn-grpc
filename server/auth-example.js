// Example showing how to attach and verify authorization tokens

// CLIENT SIDE - How to attach the token using credentials.createFromMetadataGenerator
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the proto file
const packageDef = protoLoader.loadSync("product.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = grpc.loadPackageDefinition(packageDef);
const productPackage = grpcObject.product;

// Create credentials with metadata generator
const credentials = grpc.credentials.createFromMetadataGenerator(
  (params, callback) => {
    const metadata = new grpc.Metadata();
    // Add the authorization token to metadata
    metadata.add("authorization", "Bearer super-secret-token");
    callback(null, metadata);
  }
);

// Create client with credentials
const client = new productPackage.Product(
  "localhost:4000",
  grpc.credentials.combine(
    grpc.credentials.createInsecure(), // or createSsl() for secure connection
    credentials
  )
);

// Example client call
function callCreateProduct() {
  const product = {
    name: "Test Product",
    description: "A test product",
    price: 99.99,
    category: 1, // SMARTPHONE
  };

  client.createProduct(product, (error, response) => {
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Success:", response);
    }
  });
}

// SERVER SIDE - How the server verifies the token
// The server interceptor automatically checks the metadata for the authorization header

// Example of manual token verification in a service method
function createProductWithManualAuth(call, callback) {
  // Get metadata from the call
  const metadata = call.metadata?.getMap?.() || {};
  const authHeader = metadata["authorization"];

  console.log("Received metadata:", metadata);
  console.log("Authorization header:", authHeader);

  // Validate the token
  function validateAuthorization(authHeader) {
    if (!authHeader) return false;
    const [scheme, token] = String(authHeader).split(" ");
    return scheme === "Bearer" && token === "super-secret-token";
  }

  if (!validateAuthorization(authHeader)) {
    return callback({
      code: grpc.status.UNAUTHENTICATED,
      details: "Missing or invalid Authorization header",
    });
  }

  // Proceed with the actual business logic
  const data = call.request;
  console.log("Processing product:", data);

  // Your product creation logic here...
  callback(null, { id: 1, ...data });
}

module.exports = { callCreateProduct, createProductWithManualAuth };



