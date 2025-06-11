# gRPC E-Commerce Demo App

A simple e-commerce application that demonstrates the functionality of gRPC APIs for product and order management.

## Features

- Product catalog display
- Order management
- Real-time order status updates
- Product price monitoring

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
ecom-grpc/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ProductList.tsx
│   │   └── OrderList.tsx
│   ├── services/
│   │   ├── productService.ts
│   │   └── orderService.ts
│   ├── proto/
│   │   ├── product.proto
│   │   ├── product-message.proto
│   │   └── order.proto
│   ├── App.tsx
│   ├── index.tsx
│   └── styles.css
├── package.json
└── tsconfig.json
```

## API Endpoints

### Product Service

- List Products
- Get Product Details
- Create Product
- Update Product
- Delete Product
- Watch Product Updates
- Batch Create Products
- Monitor Product Prices

### Order Service

- Create Order
- Get Order Details
- List Orders
- Update Order
- Delete Order
- Track Order Status

## Development

The application uses:

- React for the frontend
- gRPC-Web for API communication
- TypeScript for type safety
- React Router for navigation

## License

MIT
