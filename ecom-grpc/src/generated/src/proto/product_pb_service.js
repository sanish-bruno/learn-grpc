// package: product
// file: src/proto/product.proto

var src_proto_product_pb = require("../../src/proto/product_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var Product = (function () {
  function Product() {}
  Product.serviceName = "product.Product";
  return Product;
}());

Product.CreateProduct = {
  methodName: "CreateProduct",
  service: Product,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_product_pb.ProductItem,
  responseType: src_proto_product_pb.ProductItem
};

Product.ReadProduct = {
  methodName: "ReadProduct",
  service: Product,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_product_pb.ProductId,
  responseType: src_proto_product_pb.ProductItem
};

Product.ReadProducts = {
  methodName: "ReadProducts",
  service: Product,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_product_pb.VoidParam,
  responseType: src_proto_product_pb.ProductItems
};

Product.UpdateProduct = {
  methodName: "UpdateProduct",
  service: Product,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_product_pb.ProductItem,
  responseType: src_proto_product_pb.ProductItem
};

Product.DeleteProduct = {
  methodName: "DeleteProduct",
  service: Product,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_product_pb.ProductId,
  responseType: src_proto_product_pb.DeleteProductResponse
};

Product.CreateExampleProduct = {
  methodName: "CreateExampleProduct",
  service: Product,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_product_pb.VoidParam,
  responseType: src_proto_product_pb.ProductItem
};

Product.WatchProductUpdates = {
  methodName: "WatchProductUpdates",
  service: Product,
  requestStream: false,
  responseStream: true,
  requestType: src_proto_product_pb.ProductId,
  responseType: src_proto_product_pb.ProductUpdate
};

Product.BatchCreateProducts = {
  methodName: "BatchCreateProducts",
  service: Product,
  requestStream: true,
  responseStream: false,
  requestType: src_proto_product_pb.ProductItem,
  responseType: src_proto_product_pb.ProductBatchResponse
};

Product.MonitorProductPrices = {
  methodName: "MonitorProductPrices",
  service: Product,
  requestStream: true,
  responseStream: true,
  requestType: src_proto_product_pb.PriceAlert,
  responseType: src_proto_product_pb.PriceUpdate
};

exports.Product = Product;

function ProductClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

ProductClient.prototype.createProduct = function createProduct(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Product.CreateProduct, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

ProductClient.prototype.readProduct = function readProduct(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Product.ReadProduct, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

ProductClient.prototype.readProducts = function readProducts(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Product.ReadProducts, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

ProductClient.prototype.updateProduct = function updateProduct(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Product.UpdateProduct, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

ProductClient.prototype.deleteProduct = function deleteProduct(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Product.DeleteProduct, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

ProductClient.prototype.createExampleProduct = function createExampleProduct(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Product.CreateExampleProduct, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

ProductClient.prototype.watchProductUpdates = function watchProductUpdates(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(Product.WatchProductUpdates, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onMessage: function (responseMessage) {
      listeners.data.forEach(function (handler) {
        handler(responseMessage);
      });
    },
    onEnd: function (status, statusMessage, trailers) {
      listeners.status.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners.end.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners = null;
    }
  });
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

ProductClient.prototype.batchCreateProducts = function batchCreateProducts(metadata) {
  var listeners = {
    end: [],
    status: []
  };
  var client = grpc.client(Product.BatchCreateProducts, {
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport
  });
  client.onEnd(function (status, statusMessage, trailers) {
    listeners.status.forEach(function (handler) {
      handler({ code: status, details: statusMessage, metadata: trailers });
    });
    listeners.end.forEach(function (handler) {
      handler({ code: status, details: statusMessage, metadata: trailers });
    });
    listeners = null;
  });
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    write: function (requestMessage) {
      if (!client.started) {
        client.start(metadata);
      }
      client.send(requestMessage);
      return this;
    },
    end: function () {
      client.finishSend();
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

ProductClient.prototype.monitorProductPrices = function monitorProductPrices(metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.client(Product.MonitorProductPrices, {
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport
  });
  client.onEnd(function (status, statusMessage, trailers) {
    listeners.status.forEach(function (handler) {
      handler({ code: status, details: statusMessage, metadata: trailers });
    });
    listeners.end.forEach(function (handler) {
      handler({ code: status, details: statusMessage, metadata: trailers });
    });
    listeners = null;
  });
  client.onMessage(function (message) {
    listeners.data.forEach(function (handler) {
      handler(message);
    })
  });
  client.start(metadata);
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    write: function (requestMessage) {
      client.send(requestMessage);
      return this;
    },
    end: function () {
      client.finishSend();
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

exports.ProductClient = ProductClient;

