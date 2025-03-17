const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the proto file
const packageDefinition = protoLoader.loadSync("order.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load the package definition
const orderProto = grpc.loadPackageDefinition(packageDefinition).order;

// Create a client
const client = new orderProto.Order(
  "localhost:4000",
  grpc.credentials.createInsecure()
);

// Add metadata to all requests
const metadata = new grpc.Metadata();
metadata.add("client-name", "order-test-client");
metadata.add("client-version", "1.0.0");

// Create a new order
function createOrder() {
  console.log("\n--- Creating a new order ---");
  const orderRequest = {
    user_id: "user123",
    items: [
      { product_id: 1, quantity: 2, unit_price: 499.99 },
      { product_id: 3, quantity: 1, unit_price: 29.99 },
    ],
    shipping_address: "123 Main St, Anytown, USA",
    total_amount: 1029.97,
    status: "PENDING",
  };

  client.createOrder(orderRequest, metadata, (err, response) => {
    if (err) {
      console.error("Error creating order:", err);
      return;
    }

    console.log("Order created successfully:", response);
    // Store the order ID for later use
    global.orderId = response.id;

    // Get the order we just created
    getOrder(response.id);
  });
}

// Get an order by ID
function getOrder(orderId) {
  console.log(`\n--- Getting order with ID: ${orderId} ---`);
  client.getOrder({ id: orderId }, metadata, (err, response) => {
    if (err) {
      console.error("Error getting order:", err);
      return;
    }

    console.log("Order details:", response);

    // Next, let's update this order
    updateOrder(orderId);
  });
}

// Update an order
function updateOrder(orderId) {
  console.log(`\n--- Updating order with ID: ${orderId} ---`);
  const updateRequest = {
    id: orderId,
    status: "PROCESSING",
    shipping_address: "456 Oak St, Othertown, USA",
  };

  client.updateOrder(updateRequest, metadata, (err, response) => {
    if (err) {
      console.error("Error updating order:", err);
      return;
    }

    console.log("Order updated successfully:", response);

    // Now list all orders
    listOrders();
  });
}

// List orders
function listOrders() {
  console.log("\n--- Listing all orders ---");
  const listRequest = {
    user_id: "user123",
    page: 1,
    limit: 10,
  };

  client.listOrders(listRequest, metadata, (err, response) => {
    if (err) {
      console.error("Error listing orders:", err);
      return;
    }

    console.log(
      `Found ${response.orders.length} orders out of ${response.total_count} total`
    );
    console.log("Orders:", response.orders);

    // Start tracking order status
    trackOrderStatus(global.orderId);
  });
}

// Track order status (server streaming)
function trackOrderStatus(orderId) {
  console.log(`\n--- Tracking status updates for order ID: ${orderId} ---`);
  const call = client.trackOrderStatus({ id: orderId }, metadata);

  call.on("data", (update) => {
    console.log(
      `[${update.timestamp}] Order ${update.order_id} status: ${update.status}`
    );
    console.log(`Message: ${update.message}`);
  });

  call.on("end", () => {
    console.log("Status tracking ended");

    // Delete the order
    setTimeout(() => deleteOrder(orderId), 1000);
  });

  call.on("error", (error) => {
    console.error("Error in status tracking:", error);
  });

  // After 30 seconds, cancel the stream from client side
  setTimeout(() => {
    console.log("Cancelling status tracking from client side");
    call.cancel();

    // Delete the order
    deleteOrder(orderId);
  }, 30000);
}

// Delete an order
function deleteOrder(orderId) {
  console.log(`\n--- Deleting order with ID: ${orderId} ---`);
  client.deleteOrder({ id: orderId }, metadata, (err, response) => {
    if (err) {
      console.error("Error deleting order:", err);
      return;
    }

    console.log("Delete response:", response);
    console.log("All tests complete!");
    process.exit(0);
  });
}

// Start the test sequence
createOrder();
