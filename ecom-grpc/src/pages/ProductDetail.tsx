import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productClient } from "../services/grpc";
import { ProductItem, ProductId } from "../generated/src/proto/product_pb";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const request = new ProductId();
        request.setId(parseInt(id || "0"));
        const response = await productClient.readProduct(
          request,
          (err, response) => {
            if (err) {
              setError("Failed to fetch product details");
              setLoading(false);
            } else {
              setProduct(response as ProductItem);
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
  }, [id]);

  const handleOrder = () => {
    navigate(`/orders/new?productId=${id}`);
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
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Product Details
        </h3>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {product.getName()}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {product.getDescription()}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Price</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              ${product.getPrice()}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {product.getCategory()}
            </dd>
          </div>
        </dl>
      </div>
      <div className="px-4 py-5 sm:px-6">
        <button
          onClick={handleOrder}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Order Now
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
