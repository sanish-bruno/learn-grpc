const orders = [];
let nextOrderId = 1;

// Generate a unique order ID
function generateOrderId() {
  return `ORD-${Date.now()}-${nextOrderId++}`;
}

// Create a new order
function createOrder(orderData) {
  const orderId = orderData.id || generateOrderId();
  const now = new Date().toISOString();

  const newOrder = {
    id: orderId,
    user_id: orderData.user_id,
    items: orderData.items || [],
    shipping_address: orderData.shipping_address,
    total_amount: orderData.total_amount || 0,
    status: orderData.status || "PENDING",
    created_at: now,
    updated_at: now,
  };

  orders.push(newOrder);
  return newOrder;
}

// Get order by ID
function getOrder(orderId) {
  return orders.find((order) => order.id === orderId);
}

// List orders with optional filtering
function listOrders(userId, page = 1, limit = 10) {
  let filteredOrders = orders;

  if (userId) {
    filteredOrders = filteredOrders.filter((order) => order.user_id === userId);
  }

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return {
    orders: paginatedOrders,
    total_count: filteredOrders.length,
  };
}

// Update order
function updateOrder(orderData) {
  const index = orders.findIndex((order) => order.id === orderData.id);

  if (index === -1) {
    return null;
  }

  const now = new Date().toISOString();
  const updatedOrder = {
    ...orders[index],
    ...orderData,
    updated_at: now,
  };

  orders[index] = updatedOrder;
  return updatedOrder;
}

// Delete order
function deleteOrder(orderId) {
  const index = orders.findIndex((order) => order.id === orderId);

  if (index === -1) {
    return { success: false, message: "Order not found" };
  }

  orders.splice(index, 1);
  return { success: true, message: "Order deleted successfully" };
}

module.exports = {
  createOrder,
  getOrder,
  listOrders,
  updateOrder,
  deleteOrder,
};
