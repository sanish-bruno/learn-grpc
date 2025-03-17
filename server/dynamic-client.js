const grpc = require("@grpc/grpc-js");
const { GrpcReflection } = require("@grpc/reflection");

async function createDynamicClient() {
  const reflection = new GrpcReflection(
    "localhost:4000",
    grpc.credentials.createInsecure()
  );

  try {
    // Get service descriptor
    const descriptor = await reflection.fileContainingSymbol("product.Product");

    // Create dynamic client
    const client = new grpc.Client(
      "localhost:4000",
      grpc.credentials.createInsecure(),
      {
        "grpc.service_config": JSON.stringify({
          methodConfig: [
            {
              name: [{ service: "product.Product" }],
              waitForReady: true,
              timeout: "5s",
            },
          ],
        }),
      }
    );

    // Example: Create a product
    const createProduct = () => {
      return new Promise((resolve, reject) => {
        const metadata = new grpc.Metadata();
        metadata.add("custom-header", "test-value");

        client.makeUnaryRequest(
          "/product.Product/CreateProduct",
          (arg) => arg,
          (arg) => arg,
          {
            name: "Test Product",
            description: "Created using dynamic client",
            price: 199.99,
            category: "SMARTPHONE",
          },
          metadata,
          (err, response) => {
            if (err) reject(err);
            else resolve(response);
          }
        );
      });
    };

    // Example: Read all products
    const readProducts = () => {
      return new Promise((resolve, reject) => {
        client.makeUnaryRequest(
          "/product.Product/ReadProducts",
          (arg) => arg,
          (arg) => arg,
          {},
          (err, response) => {
            if (err) reject(err);
            else resolve(response);
          }
        );
      });
    };

    // Use the dynamic client
    console.log("Creating a product...");
    const newProduct = await createProduct();
    console.log("Created product:", newProduct);

    console.log("\nReading all products...");
    const products = await readProducts();
    console.log("Products:", products);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    reflection.close();
  }
}

// Run the dynamic client
console.log("Starting dynamic gRPC client...");
createDynamicClient().catch(console.error);
