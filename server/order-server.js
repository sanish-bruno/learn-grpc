const gRPC = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const {
  createResponseHeaders,
  createTrailerMetadata,
  addCommonHeaders,
  logIncomingHeaders,
} = require("./utils/headers");
const grpcReflection = require("@grpc/reflection");
const ordersDB = require("./orders");

// Load Order proto file
const orderPackageDef = protoLoader.loadSync("order.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load package definition
const orderGRPCObject = gRPC.loadPackageDefinition(orderPackageDef);
const orderPackage = orderGRPCObject.order;

// Get the OrderStatus enum values for easy reference
const OrderStatus = orderPackage.OrderStatus;

// Order Service Implementation
function createOrder(call, callback) {
  // Log incoming headers
  logIncomingHeaders(call);

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const data = call.request;
  console.log("Create order request:", data);

  try {
    const newOrder = ordersDB.createOrder(data);
    const trailerMetadata = createTrailerMetadata();
    return callback(null, newOrder, trailerMetadata);
  } catch (error) {
    return callback({
      code: gRPC.status.INTERNAL,
      details: `Error creating order: ${error.message}`,
    });
  }
}

function getOrder(call, callback) {
  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const orderId = call.request.id;
  console.log(`Get order request for ID: ${orderId}`);

  const order = ordersDB.getOrder(orderId);

  if (!order) {
    return callback({
      code: gRPC.status.NOT_FOUND,
      details: `Order with ID ${orderId} not found`,
    });
  }

  const trailerMetadata = createTrailerMetadata();
  return callback(null, order, trailerMetadata);
}

function listOrders(call, callback) {
  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const { user_id, page, limit } = call.request;
  console.log(
    `List orders request for user: ${user_id}, page: ${page}, limit: ${limit}`
  );

  const result = ordersDB.listOrders(user_id, page, limit);

  const trailerMetadata = createTrailerMetadata();
  return callback(null, result, trailerMetadata);
}

function updateOrder(call, callback) {
  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const data = call.request;
  console.log(`Update order request for ID: ${data.id}`);

  const updatedOrder = ordersDB.updateOrder(data);

  if (!updatedOrder) {
    return callback({
      code: gRPC.status.NOT_FOUND,
      details: `Order with ID ${data.id} not found`,
    });
  }

  const trailerMetadata = createTrailerMetadata();
  return callback(null, updatedOrder, trailerMetadata);
}

function deleteOrder(call, callback) {
  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  const orderId = call.request.id;
  console.log(`Delete order request for ID: ${orderId}`);

  const result = ordersDB.deleteOrder(orderId);

  const trailerMetadata = createTrailerMetadata();
  return callback(null, result, trailerMetadata);
}

function trackOrderStatus(call) {
  const orderId = call.request.id;
  console.log(
    `Client subscribed to order status tracking for order ${orderId}`
  );

  // Set response headers
  const responseHeaders = createResponseHeaders();
  call.sendMetadata(responseHeaders);

  // Check if order exists
  const order = ordersDB.getOrder(orderId);
  if (!order) {
    call.emit("error", {
      code: gRPC.status.NOT_FOUND,
      details: `Order with ID ${orderId} not found`,
    });
    return;
  }

  // Send initial status
  const initialUpdate = {
    order_id: orderId,
    status: order.status,
    timestamp: new Date().toISOString(),
    message: `Current order status is ${order.status}`,
  };
  call.write(initialUpdate);

  // Simulate status changes (every 10 seconds)
  const statuses = Object.keys(OrderStatus).filter(
    (key) => typeof OrderStatus[key] === "number"
  );
  let currentStatusIndex = statuses.indexOf(order.status);

  const interval = setInterval(() => {
    // Move to next status (simulate order progression)
    currentStatusIndex = (currentStatusIndex + 1) % statuses.length;
    const newStatus = statuses[currentStatusIndex];

    // Update order in database
    order.status = newStatus;
    ordersDB.updateOrder(order);

    // Send update to client
    const update = {
      order_id: orderId,
      status: newStatus,
      timestamp: new Date().toISOString(),
      message: `Order status updated to ${newStatus}`,
    };
    call.write(update);

    // If we reach DELIVERED or CANCELLED, end the stream after sending the update
    if (newStatus === "DELIVERED" || newStatus === "CANCELLED") {
      setTimeout(() => {
        console.log(
          `Ending status updates for order ${orderId} - final status: ${newStatus}`
        );
        clearInterval(interval);
        call.end();
      }, 1000);
    }
  }, 10000);

  // Handle client disconnect
  call.on("cancelled", () => {
    console.log(`Client unsubscribed from order ${orderId} status updates`);
    clearInterval(interval);
  });

  // Handle errors
  call.on("error", (error) => {
    console.error(`Error in trackOrderStatus for order ${orderId}:`, error);
    clearInterval(interval);
  });
}

const server = new gRPC.Server();

// Initialize reflection service
const reflection = new grpcReflection.ReflectionService(orderPackageDef);
reflection.addToServer(server);

// Add Order service
server.addService(
  orderPackage.Order.service,
  {
    createOrder,
    getOrder,
    listOrders,
    updateOrder,
    deleteOrder,
    trackOrderStatus,
  },
  addCommonHeaders
);

const ORDER_SERVICE_PORT = 4001;

server.bindAsync(
  `0.0.0.0:${ORDER_SERVICE_PORT}`,
  gRPC.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log(`Order service running at http://0.0.0.0:${port}`);
    console.log(`Available services: Order`);
  }
);
