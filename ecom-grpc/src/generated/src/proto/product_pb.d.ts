// package: product
// file: src/proto/product.proto

import * as jspb from "google-protobuf";

export class VoidParam extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VoidParam.AsObject;
  static toObject(includeInstance: boolean, msg: VoidParam): VoidParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VoidParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VoidParam;
  static deserializeBinaryFromReader(message: VoidParam, reader: jspb.BinaryReader): VoidParam;
}

export namespace VoidParam {
  export type AsObject = {
  }
}

export class ProductId extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProductId.AsObject;
  static toObject(includeInstance: boolean, msg: ProductId): ProductId.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ProductId, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProductId;
  static deserializeBinaryFromReader(message: ProductId, reader: jspb.BinaryReader): ProductId;
}

export namespace ProductId {
  export type AsObject = {
    id: number,
  }
}

export class ProductItem extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getName(): string;
  setName(value: string): void;

  getDescription(): string;
  setDescription(value: string): void;

  getPrice(): number;
  setPrice(value: number): void;

  getCategory(): CategoryMap[keyof CategoryMap];
  setCategory(value: CategoryMap[keyof CategoryMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProductItem.AsObject;
  static toObject(includeInstance: boolean, msg: ProductItem): ProductItem.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ProductItem, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProductItem;
  static deserializeBinaryFromReader(message: ProductItem, reader: jspb.BinaryReader): ProductItem;
}

export namespace ProductItem {
  export type AsObject = {
    id: number,
    name: string,
    description: string,
    price: number,
    category: CategoryMap[keyof CategoryMap],
  }
}

export class ProductItems extends jspb.Message {
  clearProductsList(): void;
  getProductsList(): Array<ProductItem>;
  setProductsList(value: Array<ProductItem>): void;
  addProducts(value?: ProductItem, index?: number): ProductItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProductItems.AsObject;
  static toObject(includeInstance: boolean, msg: ProductItems): ProductItems.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ProductItems, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProductItems;
  static deserializeBinaryFromReader(message: ProductItems, reader: jspb.BinaryReader): ProductItems;
}

export namespace ProductItems {
  export type AsObject = {
    productsList: Array<ProductItem.AsObject>,
  }
}

export class DeleteProductResponse extends jspb.Message {
  getDeleted(): boolean;
  setDeleted(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteProductResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteProductResponse): DeleteProductResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DeleteProductResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteProductResponse;
  static deserializeBinaryFromReader(message: DeleteProductResponse, reader: jspb.BinaryReader): DeleteProductResponse;
}

export namespace DeleteProductResponse {
  export type AsObject = {
    deleted: boolean,
  }
}

export class ProductUpdate extends jspb.Message {
  hasProduct(): boolean;
  clearProduct(): void;
  getProduct(): ProductItem | undefined;
  setProduct(value?: ProductItem): void;

  getType(): ProductUpdate.UpdateTypeMap[keyof ProductUpdate.UpdateTypeMap];
  setType(value: ProductUpdate.UpdateTypeMap[keyof ProductUpdate.UpdateTypeMap]): void;

  getTimestamp(): string;
  setTimestamp(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProductUpdate.AsObject;
  static toObject(includeInstance: boolean, msg: ProductUpdate): ProductUpdate.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ProductUpdate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProductUpdate;
  static deserializeBinaryFromReader(message: ProductUpdate, reader: jspb.BinaryReader): ProductUpdate;
}

export namespace ProductUpdate {
  export type AsObject = {
    product?: ProductItem.AsObject,
    type: ProductUpdate.UpdateTypeMap[keyof ProductUpdate.UpdateTypeMap],
    timestamp: string,
  }

  export interface UpdateTypeMap {
    CREATED: 0;
    MODIFIED: 1;
    DELETED: 2;
  }

  export const UpdateType: UpdateTypeMap;
}

export class ProductBatchResponse extends jspb.Message {
  getSuccessCount(): number;
  setSuccessCount(value: number): void;

  clearFailedItemsList(): void;
  getFailedItemsList(): Array<ProductItem>;
  setFailedItemsList(value: Array<ProductItem>): void;
  addFailedItems(value?: ProductItem, index?: number): ProductItem;

  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProductBatchResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ProductBatchResponse): ProductBatchResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ProductBatchResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProductBatchResponse;
  static deserializeBinaryFromReader(message: ProductBatchResponse, reader: jspb.BinaryReader): ProductBatchResponse;
}

export namespace ProductBatchResponse {
  export type AsObject = {
    successCount: number,
    failedItemsList: Array<ProductItem.AsObject>,
    message: string,
  }
}

export class PriceAlert extends jspb.Message {
  getProductId(): number;
  setProductId(value: number): void;

  getTargetPrice(): number;
  setTargetPrice(value: number): void;

  getType(): PriceAlert.AlertTypeMap[keyof PriceAlert.AlertTypeMap];
  setType(value: PriceAlert.AlertTypeMap[keyof PriceAlert.AlertTypeMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PriceAlert.AsObject;
  static toObject(includeInstance: boolean, msg: PriceAlert): PriceAlert.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PriceAlert, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PriceAlert;
  static deserializeBinaryFromReader(message: PriceAlert, reader: jspb.BinaryReader): PriceAlert;
}

export namespace PriceAlert {
  export type AsObject = {
    productId: number,
    targetPrice: number,
    type: PriceAlert.AlertTypeMap[keyof PriceAlert.AlertTypeMap],
  }

  export interface AlertTypeMap {
    PRICE_ABOVE: 0;
    PRICE_BELOW: 1;
  }

  export const AlertType: AlertTypeMap;
}

export class PriceUpdate extends jspb.Message {
  getProductId(): number;
  setProductId(value: number): void;

  getCurrentPrice(): number;
  setCurrentPrice(value: number): void;

  getAlertTriggered(): boolean;
  setAlertTriggered(value: boolean): void;

  getTimestamp(): string;
  setTimestamp(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PriceUpdate.AsObject;
  static toObject(includeInstance: boolean, msg: PriceUpdate): PriceUpdate.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PriceUpdate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PriceUpdate;
  static deserializeBinaryFromReader(message: PriceUpdate, reader: jspb.BinaryReader): PriceUpdate;
}

export namespace PriceUpdate {
  export type AsObject = {
    productId: number,
    currentPrice: number,
    alertTriggered: boolean,
    timestamp: string,
  }
}

export interface CategoryMap {
  SMARTPHONE: 0;
  CAMERA: 1;
  LAPTOPS: 2;
  HEADPHONES: 3;
  CHARGERS: 4;
  SPEAKERS: 5;
  TELEVISIONS: 6;
  MODEMS: 7;
  KEYBOARD: 8;
  MICROPHONES: 9;
}

export const Category: CategoryMap;

