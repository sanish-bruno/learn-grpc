// package: order
// file: order.proto

import * as order_pb from "./order_pb";
import {grpc} from "@improbable-eng/grpc-web";

type OrderCreateOrder = {
  readonly methodName: string;
  readonly service: typeof Order;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof order_pb.OrderRequest;
  readonly responseType: typeof order_pb.OrderResponse;
};

type OrderGetOrder = {
  readonly methodName: string;
  readonly service: typeof Order;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof order_pb.OrderId;
  readonly responseType: typeof order_pb.OrderResponse;
};

type OrderListOrders = {
  readonly methodName: string;
  readonly service: typeof Order;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof order_pb.ListOrdersRequest;
  readonly responseType: typeof order_pb.ListOrdersResponse;
};

type OrderUpdateOrder = {
  readonly methodName: string;
  readonly service: typeof Order;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof order_pb.OrderRequest;
  readonly responseType: typeof order_pb.OrderResponse;
};

type OrderDeleteOrder = {
  readonly methodName: string;
  readonly service: typeof Order;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof order_pb.OrderId;
  readonly responseType: typeof order_pb.DeleteOrderResponse;
};

type OrderTrackOrderStatus = {
  readonly methodName: string;
  readonly service: typeof Order;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof order_pb.OrderId;
  readonly responseType: typeof order_pb.OrderStatusUpdate;
};

export class Order {
  static readonly serviceName: string;
  static readonly CreateOrder: OrderCreateOrder;
  static readonly GetOrder: OrderGetOrder;
  static readonly ListOrders: OrderListOrders;
  static readonly UpdateOrder: OrderUpdateOrder;
  static readonly DeleteOrder: OrderDeleteOrder;
  static readonly TrackOrderStatus: OrderTrackOrderStatus;
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

export class OrderClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  createOrder(
    requestMessage: order_pb.OrderRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: order_pb.OrderResponse|null) => void
  ): UnaryResponse;
  createOrder(
    requestMessage: order_pb.OrderRequest,
    callback: (error: ServiceError|null, responseMessage: order_pb.OrderResponse|null) => void
  ): UnaryResponse;
  getOrder(
    requestMessage: order_pb.OrderId,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: order_pb.OrderResponse|null) => void
  ): UnaryResponse;
  getOrder(
    requestMessage: order_pb.OrderId,
    callback: (error: ServiceError|null, responseMessage: order_pb.OrderResponse|null) => void
  ): UnaryResponse;
  listOrders(
    requestMessage: order_pb.ListOrdersRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: order_pb.ListOrdersResponse|null) => void
  ): UnaryResponse;
  listOrders(
    requestMessage: order_pb.ListOrdersRequest,
    callback: (error: ServiceError|null, responseMessage: order_pb.ListOrdersResponse|null) => void
  ): UnaryResponse;
  updateOrder(
    requestMessage: order_pb.OrderRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: order_pb.OrderResponse|null) => void
  ): UnaryResponse;
  updateOrder(
    requestMessage: order_pb.OrderRequest,
    callback: (error: ServiceError|null, responseMessage: order_pb.OrderResponse|null) => void
  ): UnaryResponse;
  deleteOrder(
    requestMessage: order_pb.OrderId,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: order_pb.DeleteOrderResponse|null) => void
  ): UnaryResponse;
  deleteOrder(
    requestMessage: order_pb.OrderId,
    callback: (error: ServiceError|null, responseMessage: order_pb.DeleteOrderResponse|null) => void
  ): UnaryResponse;
  trackOrderStatus(requestMessage: order_pb.OrderId, metadata?: grpc.Metadata): ResponseStream<order_pb.OrderStatusUpdate>;
}

