// package: order
// file: src/proto/order.proto

import * as jspb from "google-protobuf";

export class OrderId extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrderId.AsObject;
  static toObject(includeInstance: boolean, msg: OrderId): OrderId.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OrderId, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrderId;
  static deserializeBinaryFromReader(message: OrderId, reader: jspb.BinaryReader): OrderId;
}

export namespace OrderId {
  export type AsObject = {
    id: string,
  }
}

export class OrderItem extends jspb.Message {
  getProductId(): number;
  setProductId(value: number): void;

  getQuantity(): number;
  setQuantity(value: number): void;

  getUnitPrice(): number;
  setUnitPrice(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrderItem.AsObject;
  static toObject(includeInstance: boolean, msg: OrderItem): OrderItem.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OrderItem, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrderItem;
  static deserializeBinaryFromReader(message: OrderItem, reader: jspb.BinaryReader): OrderItem;
}

export namespace OrderItem {
  export type AsObject = {
    productId: number,
    quantity: number,
    unitPrice: number,
  }
}

export class OrderRequest extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getUserId(): string;
  setUserId(value: string): void;

  clearItemsList(): void;
  getItemsList(): Array<OrderItem>;
  setItemsList(value: Array<OrderItem>): void;
  addItems(value?: OrderItem, index?: number): OrderItem;

  getShippingAddress(): string;
  setShippingAddress(value: string): void;

  getTotalAmount(): number;
  setTotalAmount(value: number): void;

  getStatus(): OrderStatusMap[keyof OrderStatusMap];
  setStatus(value: OrderStatusMap[keyof OrderStatusMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrderRequest.AsObject;
  static toObject(includeInstance: boolean, msg: OrderRequest): OrderRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OrderRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrderRequest;
  static deserializeBinaryFromReader(message: OrderRequest, reader: jspb.BinaryReader): OrderRequest;
}

export namespace OrderRequest {
  export type AsObject = {
    id: string,
    userId: string,
    itemsList: Array<OrderItem.AsObject>,
    shippingAddress: string,
    totalAmount: number,
    status: OrderStatusMap[keyof OrderStatusMap],
  }
}

export class OrderResponse extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getUserId(): string;
  setUserId(value: string): void;

  clearItemsList(): void;
  getItemsList(): Array<OrderItem>;
  setItemsList(value: Array<OrderItem>): void;
  addItems(value?: OrderItem, index?: number): OrderItem;

  getShippingAddress(): string;
  setShippingAddress(value: string): void;

  getTotalAmount(): number;
  setTotalAmount(value: number): void;

  getStatus(): OrderStatusMap[keyof OrderStatusMap];
  setStatus(value: OrderStatusMap[keyof OrderStatusMap]): void;

  getCreatedAt(): string;
  setCreatedAt(value: string): void;

  getUpdatedAt(): string;
  setUpdatedAt(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrderResponse.AsObject;
  static toObject(includeInstance: boolean, msg: OrderResponse): OrderResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OrderResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrderResponse;
  static deserializeBinaryFromReader(message: OrderResponse, reader: jspb.BinaryReader): OrderResponse;
}

export namespace OrderResponse {
  export type AsObject = {
    id: string,
    userId: string,
    itemsList: Array<OrderItem.AsObject>,
    shippingAddress: string,
    totalAmount: number,
    status: OrderStatusMap[keyof OrderStatusMap],
    createdAt: string,
    updatedAt: string,
  }
}

export class ListOrdersRequest extends jspb.Message {
  getUserId(): string;
  setUserId(value: string): void;

  getPage(): number;
  setPage(value: number): void;

  getLimit(): number;
  setLimit(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListOrdersRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListOrdersRequest): ListOrdersRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ListOrdersRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListOrdersRequest;
  static deserializeBinaryFromReader(message: ListOrdersRequest, reader: jspb.BinaryReader): ListOrdersRequest;
}

export namespace ListOrdersRequest {
  export type AsObject = {
    userId: string,
    page: number,
    limit: number,
  }
}

export class ListOrdersResponse extends jspb.Message {
  clearOrdersList(): void;
  getOrdersList(): Array<OrderResponse>;
  setOrdersList(value: Array<OrderResponse>): void;
  addOrders(value?: OrderResponse, index?: number): OrderResponse;

  getTotalCount(): number;
  setTotalCount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListOrdersResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListOrdersResponse): ListOrdersResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ListOrdersResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListOrdersResponse;
  static deserializeBinaryFromReader(message: ListOrdersResponse, reader: jspb.BinaryReader): ListOrdersResponse;
}

export namespace ListOrdersResponse {
  export type AsObject = {
    ordersList: Array<OrderResponse.AsObject>,
    totalCount: number,
  }
}

export class DeleteOrderResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): void;

  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteOrderResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteOrderResponse): DeleteOrderResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DeleteOrderResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteOrderResponse;
  static deserializeBinaryFromReader(message: DeleteOrderResponse, reader: jspb.BinaryReader): DeleteOrderResponse;
}

export namespace DeleteOrderResponse {
  export type AsObject = {
    success: boolean,
    message: string,
  }
}

export class OrderStatusUpdate extends jspb.Message {
  getOrderId(): string;
  setOrderId(value: string): void;

  getStatus(): OrderStatusMap[keyof OrderStatusMap];
  setStatus(value: OrderStatusMap[keyof OrderStatusMap]): void;

  getTimestamp(): string;
  setTimestamp(value: string): void;

  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrderStatusUpdate.AsObject;
  static toObject(includeInstance: boolean, msg: OrderStatusUpdate): OrderStatusUpdate.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OrderStatusUpdate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrderStatusUpdate;
  static deserializeBinaryFromReader(message: OrderStatusUpdate, reader: jspb.BinaryReader): OrderStatusUpdate;
}

export namespace OrderStatusUpdate {
  export type AsObject = {
    orderId: string,
    status: OrderStatusMap[keyof OrderStatusMap],
    timestamp: string,
    message: string,
  }
}

export interface OrderStatusMap {
  PENDING: 0;
  PROCESSING: 1;
  SHIPPED: 2;
  DELIVERED: 3;
  CANCELLED: 4;
}

export const OrderStatus: OrderStatusMap;

