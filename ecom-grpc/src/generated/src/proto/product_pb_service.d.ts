// package: product
// file: src/proto/product.proto

import * as src_proto_product_pb from "../../src/proto/product_pb";
import {grpc} from "@improbable-eng/grpc-web";

type ProductCreateProduct = {
  readonly methodName: string;
  readonly service: typeof Product;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof src_proto_product_pb.ProductItem;
  readonly responseType: typeof src_proto_product_pb.ProductItem;
};

type ProductReadProduct = {
  readonly methodName: string;
  readonly service: typeof Product;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof src_proto_product_pb.ProductId;
  readonly responseType: typeof src_proto_product_pb.ProductItem;
};

type ProductReadProducts = {
  readonly methodName: string;
  readonly service: typeof Product;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof src_proto_product_pb.VoidParam;
  readonly responseType: typeof src_proto_product_pb.ProductItems;
};

type ProductUpdateProduct = {
  readonly methodName: string;
  readonly service: typeof Product;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof src_proto_product_pb.ProductItem;
  readonly responseType: typeof src_proto_product_pb.ProductItem;
};

type ProductDeleteProduct = {
  readonly methodName: string;
  readonly service: typeof Product;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof src_proto_product_pb.ProductId;
  readonly responseType: typeof src_proto_product_pb.DeleteProductResponse;
};

type ProductCreateExampleProduct = {
  readonly methodName: string;
  readonly service: typeof Product;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof src_proto_product_pb.VoidParam;
  readonly responseType: typeof src_proto_product_pb.ProductItem;
};

type ProductWatchProductUpdates = {
  readonly methodName: string;
  readonly service: typeof Product;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof src_proto_product_pb.ProductId;
  readonly responseType: typeof src_proto_product_pb.ProductUpdate;
};

type ProductBatchCreateProducts = {
  readonly methodName: string;
  readonly service: typeof Product;
  readonly requestStream: true;
  readonly responseStream: false;
  readonly requestType: typeof src_proto_product_pb.ProductItem;
  readonly responseType: typeof src_proto_product_pb.ProductBatchResponse;
};

type ProductMonitorProductPrices = {
  readonly methodName: string;
  readonly service: typeof Product;
  readonly requestStream: true;
  readonly responseStream: true;
  readonly requestType: typeof src_proto_product_pb.PriceAlert;
  readonly responseType: typeof src_proto_product_pb.PriceUpdate;
};

export class Product {
  static readonly serviceName: string;
  static readonly CreateProduct: ProductCreateProduct;
  static readonly ReadProduct: ProductReadProduct;
  static readonly ReadProducts: ProductReadProducts;
  static readonly UpdateProduct: ProductUpdateProduct;
  static readonly DeleteProduct: ProductDeleteProduct;
  static readonly CreateExampleProduct: ProductCreateExampleProduct;
  static readonly WatchProductUpdates: ProductWatchProductUpdates;
  static readonly BatchCreateProducts: ProductBatchCreateProducts;
  static readonly MonitorProductPrices: ProductMonitorProductPrices;
}

export type ServiceError = { message: string, code: number; metadata: grpc.Metadata }
export type Status = { details: string, code: number; metadata: grpc.Metadata }

interface UnaryResponse {
  cancel(): void;
}
interface ResponseStream<T> {
  cancel(): void;
  on(type: 'data', handler: (message: T) => void): ResponseStream<T>;
  on(type: 'end', handler: (status?: Status) => void): ResponseStream<T>;
  on(type: 'status', handler: (status: Status) => void): ResponseStream<T>;
}
interface RequestStream<T> {
  write(message: T): RequestStream<T>;
  end(): void;
  cancel(): void;
  on(type: 'end', handler: (status?: Status) => void): RequestStream<T>;
  on(type: 'status', handler: (status: Status) => void): RequestStream<T>;
}
interface BidirectionalStream<ReqT, ResT> {
  write(message: ReqT): BidirectionalStream<ReqT, ResT>;
  end(): void;
  cancel(): void;
  on(type: 'data', handler: (message: ResT) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'end', handler: (status?: Status) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'status', handler: (status: Status) => void): BidirectionalStream<ReqT, ResT>;
}

export class ProductClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  createProduct(
    requestMessage: src_proto_product_pb.ProductItem,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.ProductItem|null) => void
  ): UnaryResponse;
  createProduct(
    requestMessage: src_proto_product_pb.ProductItem,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.ProductItem|null) => void
  ): UnaryResponse;
  readProduct(
    requestMessage: src_proto_product_pb.ProductId,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.ProductItem|null) => void
  ): UnaryResponse;
  readProduct(
    requestMessage: src_proto_product_pb.ProductId,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.ProductItem|null) => void
  ): UnaryResponse;
  readProducts(
    requestMessage: src_proto_product_pb.VoidParam,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.ProductItems|null) => void
  ): UnaryResponse;
  readProducts(
    requestMessage: src_proto_product_pb.VoidParam,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.ProductItems|null) => void
  ): UnaryResponse;
  updateProduct(
    requestMessage: src_proto_product_pb.ProductItem,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.ProductItem|null) => void
  ): UnaryResponse;
  updateProduct(
    requestMessage: src_proto_product_pb.ProductItem,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.ProductItem|null) => void
  ): UnaryResponse;
  deleteProduct(
    requestMessage: src_proto_product_pb.ProductId,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.DeleteProductResponse|null) => void
  ): UnaryResponse;
  deleteProduct(
    requestMessage: src_proto_product_pb.ProductId,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.DeleteProductResponse|null) => void
  ): UnaryResponse;
  createExampleProduct(
    requestMessage: src_proto_product_pb.VoidParam,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.ProductItem|null) => void
  ): UnaryResponse;
  createExampleProduct(
    requestMessage: src_proto_product_pb.VoidParam,
    callback: (error: ServiceError|null, responseMessage: src_proto_product_pb.ProductItem|null) => void
  ): UnaryResponse;
  watchProductUpdates(requestMessage: src_proto_product_pb.ProductId, metadata?: grpc.Metadata): ResponseStream<src_proto_product_pb.ProductUpdate>;
  batchCreateProducts(metadata?: grpc.Metadata): RequestStream<src_proto_product_pb.ProductItem>;
  monitorProductPrices(metadata?: grpc.Metadata): BidirectionalStream<src_proto_product_pb.PriceAlert, src_proto_product_pb.PriceUpdate>;
}

