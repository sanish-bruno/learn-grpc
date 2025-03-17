const grpc = require("@grpc/grpc-js");
const { GrpcReflection } = require("@grpc/reflection");

async function exploreServices() {
  // Create a reflection client
  const client = new GrpcReflection(
    "localhost:4000",
    grpc.credentials.createInsecure()
  );

  try {
    // List all services
    console.log("\nListing all services:");
    const services = await client.listServices();
    console.log(services);

    // Get details about the Product service
    console.log("\nGetting Product service details:");
    const serviceInfo = await client.fileContainingSymbol("product.Product");
    console.log(JSON.stringify(serviceInfo, null, 2));

    // Get details about the ProductItem message
    console.log("\nGetting ProductItem message details:");
    const messageInfo = await client.fileContainingSymbol(
      "product.ProductItem"
    );
    console.log(JSON.stringify(messageInfo, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.close();
  }
}

// Function to demonstrate getting method details
async function getMethodDetails() {
  const client = new GrpcReflection(
    "localhost:4000",
    grpc.credentials.createInsecure()
  );

  try {
    const serviceDescriptor = await client.fileContainingSymbol(
      "product.Product"
    );
    const methods = serviceDescriptor.service[0].method;

    console.log("\nAvailable Methods:");
    methods.forEach((method) => {
      console.log(`
Method: ${method.name}
Input Type: ${method.inputType}
Output Type: ${method.outputType}
      `);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.close();
  }
}

// Run the examples
console.log("Exploring gRPC services using reflection...");
exploreServices()
  .then(() => {
    console.log("\nGetting method details...");
    return getMethodDetails();
  })
  .catch(console.error);
