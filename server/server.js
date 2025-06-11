const gRPC = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const {
  createResponseHeaders,
  createTrailerMetadata,
  addCommonHeaders,
  logIncomingHeaders,
  createCommonHeaders,
} = require("./utils/headers");
const grpcReflection = require("@grpc/reflection");
const productsDB = require("./products");
const fs = require("fs");
const path = require("path");

// Load Product proto file
const productPackageDef = protoLoader.loadSync("product.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load package definition
const productGRPCObject = gRPC.loadPackageDefinition(productPackageDef);
const productPackage = productGRPCObject.product;

// Get the Category enum values for easy reference
const Category = productPackage.Category;

function createProduct(call, callback) {
  // Log incoming headers
  logIncomingHeaders(call);

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const data = call.request;

  console.log(data);

  // // Validate category using both numeric and text values
  // const validNumericCategories = Object.values(Category).filter(
  //   (value) => typeof value === "number"
  // );
  // const validTextCategories = Object.keys(Category).filter(
  //   (key) => typeof Category[key] === "number"
  // );

  // console.log("validNumericCategories", validNumericCategories);
  // console.log("validTextCategories", validTextCategories);

  // const isValidCategory =
  //   validNumericCategories.includes(data.category) || // Check numeric value
  //   validTextCategories.includes(data.category); // Check text value

  // if (!isValidCategory) {
  //   return callback({
  //     code: gRPC.status.INVALID_ARGUMENT,
  //     details: `Invalid category. Must be one of: ${validTextCategories.join(
  //       ", "
  //     )} or their corresponding values: ${validNumericCategories.join(", ")}`,
  //   });
  // }

  // Convert text category to numeric if needed
  const categoryValue =
    typeof data.category === "string" ? Category[data.category] : data.category;

  // Create product with numeric category value
  const productData = {
    ...data,
    category: categoryValue,
  };

  const newProductData = productsDB.addProduct(productData);

  const trailerMetadata = createTrailerMetadata();
  return callback(null, newProductData, trailerMetadata);
}

// Example of how to create a product with category
function createExampleProduct(call, callback) {
  // Log incoming headers
  logIncomingHeaders(call);

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const exampleProduct = {
    name: "iPhone 13",
    description: "Latest iPhone model",
    price: 999.99,
    category: Category.SMARTPHONE, // Using the enum value
  };

  const trailerMetadata = createTrailerMetadata();
  return callback(null, exampleProduct, trailerMetadata);
}

function readProduct(call, callback) {
  // Log incoming headers
  logIncomingHeaders(call);

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const productId = call.request.id;
  const selectedProduct = productsDB.getProductById(productId);

  console.log("call.request", call.request);
  console.log("selectedProduct", selectedProduct);

  const trailerMetadata = createTrailerMetadata();

  if (selectedProduct) {
    return callback(null, selectedProduct, trailerMetadata);
  } else {
    callback({
      code: gRPC.status.NOT_FOUND,
      details: "Could not find a product with the specified ID",
    });
  }
}

function readProducts(call, callback) {
  logIncomingHeaders(call);

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const trailerMetadata = createTrailerMetadata();
  return callback(
    null,
    { products: productsDB.getProducts() },
    trailerMetadata
  );
}

function updateProduct(call, callback) {
  // Log incoming headers
  logIncomingHeaders(call);

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const productInfo = call.request;

  const updatedProduct = productsDB.updateProduct(productInfo.id, {
    name: productInfo.name,
    description: productInfo.description,
    price: productInfo.price,
    category: productInfo.category,
  });

  if (!updatedProduct) {
    return callback({
      code: gRPC.status.NOT_FOUND,
      details: "Could not find a product with the specified ID to update",
    });
  }

  const trailerMetadata = createTrailerMetadata();
  return callback(null, updatedProduct, trailerMetadata);
}

function deleteProduct(call, callback) {
  logIncomingHeaders(call);

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const productId = call.request.id;
  const deleted = productsDB.deleteProduct(productId);

  if (!deleted) {
    return callback({
      code: gRPC.status.NOT_FOUND,
      details: "Could not find a product with the specified ID to delete",
    });
  }

  const trailerMetadata = createTrailerMetadata();
  return callback(null, { deleted: true }, trailerMetadata);
}

// Server Streaming: Watch for product updates
function watchProductUpdates(call) {
  const productId = call.request.id;
  console.log(`Client subscribed to updates for product ${productId}`);

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  // Simulate periodic updates (every 5 seconds)
  const interval = setInterval(() => {
    const product = productsDB.getProductById(productId);
    if (product) {
      const update = {
        product: product,
        type: "MODIFIED",
        timestamp: new Date().toISOString(),
      };
      call.write(update);
    }
  }, 5000);

  // Handle client disconnect
  call.on("cancelled", () => {
    console.log(`Client unsubscribed from product ${productId} updates`);
    clearInterval(interval);
  });

  // Handle errors
  call.on("error", (error) => {
    console.error("Error in watchProductUpdates:", error);
    clearInterval(interval);
  });
}

// Client Streaming: Batch create products
function batchCreateProducts(call, callback) {
  console.log("Starting batch product creation");
  const results = {
    success_count: 0,
    failed_items: [],
    message: "",
  };

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  // Handle incoming product items
  call.on("data", (productItem) => {
    try {
      console.log("received product", productItem);
      const newProduct = productsDB.addProduct(productItem);
      if (newProduct) {
        results.success_count++;
      } else {
        results.failed_items.push(productItem);
      }
    } catch (error) {
      console.error("Error processing product:", error);
      results.failed_items.push(productItem);
    }
  });

  // Handle end of stream
  call.on("end", () => {
    results.message = `Successfully created ${results.success_count} products. Failed: ${results.failed_items.length}`;
    console.log(results.message);
    const trailerMetadata = createTrailerMetadata();
    callback(null, results, trailerMetadata);
  });

  // Handle errors
  call.on("error", (error) => {
    console.error("Error in batchCreateProducts:", error);
    callback({
      code: gRPC.status.INTERNAL,
      details: "Error processing batch creation",
    });
  });
}

// Bidirectional Streaming: Monitor product prices
function monitorProductPrices(call) {
  console.log("Starting price monitoring");
  const priceAlerts = new Map();

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  // Handle incoming price alerts
  call.on("data", (alert) => {
    console.log(`Received price alert for product ${alert.product_id}`);
    priceAlerts.set(alert.product_id, alert);

    // Immediately check current price
    const product = productsDB.getProductById(alert.product_id);
    if (product) {
      const isTriggered =
        alert.type === "PRICE_ABOVE"
          ? product.price > alert.target_price
          : product.price < alert.target_price;

      const update = {
        product_id: alert.product_id,
        current_price: product.price,
        alert_triggered: isTriggered,
        timestamp: new Date().toISOString(),
      };

      call.write(update);
    }
  });

  // Simulate periodic price checks (every 10 seconds)
  const interval = setInterval(() => {
    priceAlerts.forEach((alert, productId) => {
      const product = productsDB.getProductById(productId);
      if (product) {
        const isTriggered =
          alert.type === "PRICE_ABOVE"
            ? product.price > alert.target_price
            : product.price < alert.target_price;

        const update = {
          product_id: productId,
          current_price: product.price,
          alert_triggered: isTriggered,
          timestamp: new Date().toISOString(),
        };

        call.write(update);
      }
    });
  }, 10000);

  // Handle client disconnect
  call.on("end", () => {
    console.log("Client ended price monitoring session");
    clearInterval(interval);
    call.end();
  });

  // Handle errors
  call.on("error", (error) => {
    console.error("Error in monitorProductPrices:", error);
    clearInterval(interval);
  });
}

const server = new gRPC.Server();

const reflection = new grpcReflection.ReflectionService(productPackageDef);
reflection.addToServer(server);

// Add Product service
server.addService(
  productPackage.Product.service,
  {
    createProduct,
    readProduct,
    readProducts,
    updateProduct,
    deleteProduct,
    createExampleProduct,
    watchProductUpdates,
    batchCreateProducts,
    monitorProductPrices,
  },
  addCommonHeaders
);

const PRODUCT_SERVICE_PORT = 4000;

// Read certificate files
const rootCert = fs.readFileSync(
  path.join(__dirname, "certs/localhost-cert.pem")
);
const certChain = fs.readFileSync(
  path.join(__dirname, "certs/server-cert.pem")
);
const privateKey = fs.readFileSync(
  path.join(__dirname, "certs/server-key.pem")
);

// Create SSL credentials for tls
// const credentials = gRPC.ServerCredentials.createSsl(null, [
//   {
//     private_key: privateKey,
//     cert_chain: certChain,
//   },
// ]);

// // Create SSL credentials for mtls
// const credentials = gRPC.ServerCredentials.createSsl(
//   rootCert,
//   [
//     {
//       private_key: privateKey,
//       cert_chain: certChain,
//     },
//   ],
//   true
// );

const credentials = gRPC.ServerCredentials.createInsecure();

server.bindAsync(
  `0.0.0.0:${PRODUCT_SERVICE_PORT}`,
  credentials,
  (error, port) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log(`Product service running with mTLS at https://0.0.0.0:${port}`);
    console.log(`Available services: Product`);
  }
);
