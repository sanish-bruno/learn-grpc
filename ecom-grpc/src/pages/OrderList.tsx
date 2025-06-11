import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderClient } from "../services/grpc";
import {
  OrderResponse,
  ListOrdersRequest,
} from "../generated/src/proto/order_pb";
import { OrderStatus } from "../proto/order_pb";

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const request = new ListOrdersRequest();
        request.setUserId("demo-user"); // For demo purposes
        request.setPage(1);
        request.setLimit(10);

        const response = await orderClient.listOrders(
          request,
          (err, response) => {
            if (err) {
              setError("Failed to fetch orders");
              setLoading(false);
            } else {
              setOrders(response?.getOrdersList() || []);
              setLoading(false);
            }
          }
        );
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch orders");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading orders...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Orders</h3>
        <Link
          to="/orders/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          New Order
        </Link>
      </div>
      <ul className="divide-y divide-gray-200">
        {orders.map((order) => (
          <li key={order.getId()}>
            <Link
              to={`/orders/${order.getId()}`}
              className="block hover:bg-gray-50"
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-indigo-600 truncate">
                    Order #{order.getId()}
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.getStatus() === OrderStatus.DELIVERED
                          ? "bg-green-100 text-green-800"
                          : order.getStatus() === OrderStatus.CANCELLED
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.getStatus()}
                    </span>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <div className="flex items-center text-sm text-gray-500">
                      {order.getItemsList().length} items
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <span className="text-gray-500">
                      Total: ${order.getTotalAmount()}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Created: {order.getCreatedAt()}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrderList;
