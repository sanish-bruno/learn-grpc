# gRPC E-Commerce Demo App

A simple e-commerce application that demonstrates the functionality of gRPC APIs for product and order management.

## Features

- Product catalog display
- Product details view
- Order creation and management
- Real-time order status updates
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Protocol Buffers compiler (protoc)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Generate TypeScript code from proto files:

   ```bash
   npm run generate
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── pages/         # Page components
  ├── services/      # gRPC service clients
  ├── proto/         # Protocol Buffer definitions
  ├── generated/     # Generated TypeScript code
  └── types/         # TypeScript type definitions
```

## Available Scripts

- `npm start` - Start the development server
- `npm build` - Build the production bundle
- `npm test` - Run tests
- `npm run generate` - Generate TypeScript code from proto files

## API Endpoints

### Products

- List all products
- Get product details
- Create new product
- Update product
- Delete product

### Orders

- List all orders
- Get order details
- Create new order
- Update order status
- Delete order

## Technologies Used

- React
- TypeScript
- gRPC-Web
- Tailwind CSS
- React Router
