import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productClient } from "../services/grpc";
import { ProductItem, VoidParam } from "../generated/src/proto/product_pb";

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const request = new VoidParam();
        const response = await new Promise<ProductItem[]>((resolve, reject) => {
          productClient.readProducts(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response?.getProductsList() || []);
            }
          });
        });

        setProducts(response);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to fetch products. Please try again later.");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading products...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {products.map((product) => (
          <li key={product.getId()}>
            <Link
              to={`/products/${product.getId()}`}
              className="block hover:bg-gray-50"
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-indigo-600 truncate">
                    {product.getName()}
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      ${product.getPrice()}
                    </span>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <div className="flex items-center text-sm text-gray-500">
                      {product.getDescription()}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <span className="text-gray-500">
                      Category: {product.getCategory()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
