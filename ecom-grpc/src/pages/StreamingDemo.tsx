import React, { useState, useEffect } from "react";
import { ProductClient } from "../generated/src/proto/product_pb_service";
import {
  ProductItem,
  ProductId,
  PriceAlert,
  ProductUpdate,
  PriceUpdate,
} from "../generated/src/proto/product_pb";
import { OrderClient } from "../generated/src/proto/order_pb_service";
import { OrderId, OrderStatusUpdate } from "../generated/src/proto/order_pb";

const StreamingDemo: React.FC = () => {
  const [productUpdates, setProductUpdates] = useState<ProductUpdate[]>([]);
  const [orderStatusUpdates, setOrderStatusUpdates] = useState<
    OrderStatusUpdate[]
  >([]);
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);
  const [batchCreateStatus, setBatchCreateStatus] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("1");
  const [priceAlert, setPriceAlert] = useState<PriceAlert>(new PriceAlert());

  const productClient = new ProductClient("http://localhost:8080");
  const orderClient = new OrderClient("http://localhost:8080");

  // Server Streaming: Watch Product Updates
  useEffect(() => {
    const productId = new ProductId();
    productId.setId(selectedProductId);

    const stream = productClient.watchProductUpdates(productId);

    stream.on("data", (update: ProductUpdate) => {
      setProductUpdates((prev) => [...prev, update]);
    });

    stream.on("end", () => {
      console.log("Product updates stream ended");
    });

    return () => {
      stream.cancel();
    };
  }, [selectedProductId]);

  // Server Streaming: Track Order Status
  useEffect(() => {
    const orderId = new OrderId();
    orderId.setId(selectedOrderId);

    const stream = orderClient.trackOrderStatus(orderId);

    stream.on("data", (update: OrderStatusUpdate) => {
      setOrderStatusUpdates((prev) => [...prev, update]);
    });

    stream.on("end", () => {
      console.log("Order status stream ended");
    });

    return () => {
      stream.cancel();
    };
  }, [selectedOrderId]);

  // Bidirectional Streaming: Monitor Product Prices
  useEffect(() => {
    const stream = productClient.monitorProductPrices();

    stream.on("data", (update: PriceUpdate) => {
      setPriceUpdates((prev) => [...prev, update]);
    });

    stream.on("end", () => {
      console.log("Price monitoring stream ended");
    });

    // Send initial price alert
    const alert = new PriceAlert();
    alert.setProductId(selectedProductId);
    alert.setTargetPrice(100);
    alert.setType(PriceAlert.AlertType.PRICE_BELOW);
    stream.write(alert);

    return () => {
      stream.cancel();
    };
  }, [selectedProductId]);

  // Client Streaming: Batch Create Products
  const handleBatchCreate = async () => {
    const stream = productClient.batchCreateProducts();

    // Create sample products
    const products = [
      createSampleProduct("Product 1", 99.99),
      createSampleProduct("Product 2", 149.99),
      createSampleProduct("Product 3", 199.99),
    ];

    for (const product of products) {
      stream.write(product);
    }

    stream.end();

    stream.on("end", (status) => {
      if (status?.code === 0) {
        setBatchCreateStatus("Batch creation completed successfully");
      } else {
        setBatchCreateStatus("Error in batch creation");
      }
    });
  };

  const createSampleProduct = (name: string, price: number): ProductItem => {
    const product = new ProductItem();
    product.setName(name);
    product.setDescription("Sample product");
    product.setPrice(price);
    product.setCategory(0); // SMARTPHONE = 0
    return product;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">gRPC Streaming Demo</h1>

      {/* Server Streaming: Product Updates */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Product Updates Stream</h2>
        <div className="mb-4">
          <label className="block mb-2">Product ID:</label>
          <input
            type="number"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(Number(e.target.value))}
            className="border p-2 rounded"
          />
        </div>
        <div className="h-40 overflow-y-auto border p-2">
          {productUpdates.map((update, index) => (
            <div key={index} className="mb-2">
              <p>Type: {update.getType()}</p>
              <p>Timestamp: {update.getTimestamp()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Server Streaming: Order Status */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Order Status Stream</h2>
        <div className="mb-4">
          <label className="block mb-2">Order ID:</label>
          <input
            type="text"
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <div className="h-40 overflow-y-auto border p-2">
          {orderStatusUpdates.map((update, index) => (
            <div key={index} className="mb-2">
              <p>Status: {update.getStatus()}</p>
              <p>Message: {update.getMessage()}</p>
              <p>Timestamp: {update.getTimestamp()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bidirectional Streaming: Price Monitoring */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Price Monitoring</h2>
        <div className="h-40 overflow-y-auto border p-2">
          {priceUpdates.map((update, index) => (
            <div key={index} className="mb-2">
              <p>Product ID: {update.getProductId()}</p>
              <p>Current Price: ${update.getCurrentPrice()}</p>
              <p>
                Alert Triggered: {update.getAlertTriggered() ? "Yes" : "No"}
              </p>
              <p>Timestamp: {update.getTimestamp()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Client Streaming: Batch Create */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Batch Create Products</h2>
        <button
          onClick={handleBatchCreate}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Start Batch Create
        </button>
        {batchCreateStatus && (
          <p className="mt-2 text-green-600">{batchCreateStatus}</p>
        )}
      </div>
    </div>
  );
};

export default StreamingDemo;
