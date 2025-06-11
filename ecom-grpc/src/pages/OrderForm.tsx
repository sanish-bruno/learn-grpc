import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { orderClient, productClient } from "../services/grpc";
import { OrderRequest, OrderItem } from "../generated/src/proto/order_pb";
import { ProductItem, ProductId } from "../generated/src/proto/product_pb";
import { OrderStatus } from "../proto/order_pb";

const OrderForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError("No product selected");
        setLoading(false);
        return;
      }

      try {
        const request = new ProductId();
        request.setId(parseInt(productId));
        const response = await productClient.readProduct(
          request,
          (err, response) => {
            if (err) {
              setError("Failed to fetch product details");
              setLoading(false);
            } else {
              setProduct(response);
              setLoading(false);
            }
          }
        );
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch product details");
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSubmitting(true);
    try {
      const orderItem = new OrderItem();
      orderItem.setProductId(product.getId());
      orderItem.setQuantity(quantity);
      orderItem.setUnitPrice(product.getPrice());

      const orderRequest = new OrderRequest();
      orderRequest.setUserId("demo-user"); // For demo purposes
      orderRequest.setItemsList([orderItem]);
      orderRequest.setShippingAddress("123 Demo Street, Demo City");
      orderRequest.setTotalAmount(product.getPrice() * quantity);
      orderRequest.setStatus(OrderStatus.PENDING);

      const response = await orderClient.createOrder(
        orderRequest,
        (err, response) => {
          if (err) {
            setError("Failed to create order");
            setSubmitting(false);
          } else {
            navigate(`/orders/${response?.getId()}`);
          }
        }
      );
    } catch (err) {
      setError("Failed to create order");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading product details...</div>;
  }

  if (error || !product) {
    return (
      <div className="text-center py-10 text-red-600">
        {error || "Product not found"}
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Create New Order
        </h3>
        <div className="mt-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product
              </label>
              <div className="mt-1 text-sm text-gray-900">
                {product.getName()} - ${product.getPrice()}
              </div>
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700"
              >
                Quantity
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Amount
              </label>
              <div className="mt-1 text-sm text-gray-900">
                ${(product.getPrice() * quantity).toFixed(2)}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {submitting ? "Creating Order..." : "Create Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
