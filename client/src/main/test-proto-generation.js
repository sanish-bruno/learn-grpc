const fs = require("fs");
const path = require("path");
const grpc = require("@grpc/grpc-js");
const grpcReflection = require("grpc-reflection-js");

// Sample nested type structure similar to what we'd get from reflection
const sampleReflectionData = {
  nested: {
    product: {
      nested: {
        Category: {
          values: {
            SMARTPHONE: 0,
            CAMERA: 1,
            LAPTOPS: 2,
            HEADPHONES: 3,
            CHARGERS: 4,
            SPEAKERS: 5,
            TELEVISIONS: 6,
            MODEMS: 7,
            KEYBOARD: 8,
            MICROPHONES: 9,
          },
        },
        ProductId: {
          fields: {
            id: {
              type: "int32",
              id: 1,
            },
          },
        },
        ProductItem: {
          fields: {
            id: {
              type: "int32",
              id: 1,
            },
            name: {
              type: "string",
              id: 2,
            },
            description: {
              type: "string",
              id: 3,
            },
            price: {
              type: "float",
              id: 4,
            },
            category: {
              type: "Category",
              id: 5,
            },
          },
        },
        ProductItems: {
          fields: {
            products: {
              rule: "repeated",
              type: "ProductItem",
              id: 1,
            },
          },
        },
        ProductUpdate: {
          fields: {
            product: {
              type: "ProductItem",
              id: 1,
            },
            type: {
              type: "UpdateType",
              id: 2,
            },
            timestamp: {
              type: "string",
              id: 3,
            },
          },
          nested: {
            UpdateType: {
              values: {
                CREATED: 0,
                MODIFIED: 1,
                DELETED: 2,
              },
            },
          },
        },
        PriceAlert: {
          fields: {
            product_id: {
              type: "int32",
              id: 1,
            },
            target_price: {
              type: "float",
              id: 2,
            },
            type: {
              type: "AlertType",
              id: 3,
            },
          },
          nested: {
            AlertType: {
              values: {
                PRICE_ABOVE: 0,
                PRICE_BELOW: 1,
              },
            },
          },
        },
        Product: {
          methods: {
            CreateProduct: {
              requestType: ".product.ProductItem",
              responseType: ".product.ProductItem",
            },
            ReadProduct: {
              requestType: ".product.ProductId",
              responseType: ".product.ProductItem",
            },
            WatchProductUpdates: {
              requestType: ".product.ProductId",
              responseType: ".product.ProductUpdate",
              responseStream: true,
            },
          },
        },
      },
    },
  },
};

// Import the necessary functions from main.js
const {
  generateProtoFileFromReflection,
  extractServiceDetailsFromReflection,
} = require("./proto-generation");

// Run the test
async function testProtoGeneration() {
  console.log("Testing proto file generation with nested types...");

  const serviceName = "product.Product";
  const packageName = "product";
  const serviceClassName = "Product";

  // Extract service details
  const serviceDetails = {};
  serviceDetails[serviceName] = {
    name: serviceClassName,
    package: packageName,
    methods: [
      {
        name: "CreateProduct",
        requestStream: false,
        responseStream: false,
        type: "UNARY",
        requestType: ".product.ProductItem",
        responseType: ".product.ProductItem",
      },
      {
        name: "WatchProductUpdates",
        requestStream: false,
        responseStream: true,
        type: "SERVER_STREAMING",
        requestType: ".product.ProductId",
        responseType: ".product.ProductUpdate",
      },
    ],
    reflectionData: sampleReflectionData,
  };

  // Generate proto file
  try {
    const protoContent = generateProtoFileFromReflection(serviceDetails);

    // Save to a file
    const tempProtoPath = path.join(__dirname, "generated_test.proto");
    fs.writeFileSync(tempProtoPath, protoContent);

    console.log(`Generated proto file saved to: ${tempProtoPath}`);
    console.log("\n===== GENERATED PROTO FILE CONTENT =====");
    console.log(protoContent);
    console.log("======================================\n");

    // Validate the proto file contains nested types
    if (
      protoContent.includes("enum UpdateType") &&
      protoContent.includes("enum AlertType")
    ) {
      console.log("✅ Test passed: Proto file contains the nested enum types");
    } else {
      console.log(
        "❌ Test failed: Proto file is missing the nested enum types"
      );
    }
  } catch (err) {
    console.error("Error during proto generation:", err);
  }
}

// Run the test
testProtoGeneration();
