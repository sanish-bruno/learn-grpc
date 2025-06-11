// package: order
// file: src/proto/order.proto

var src_proto_order_pb = require("../../src/proto/order_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var Order = (function () {
  function Order() {}
  Order.serviceName = "order.Order";
  return Order;
}());

Order.CreateOrder = {
  methodName: "CreateOrder",
  service: Order,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_order_pb.OrderRequest,
  responseType: src_proto_order_pb.OrderResponse
};

Order.GetOrder = {
  methodName: "GetOrder",
  service: Order,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_order_pb.OrderId,
  responseType: src_proto_order_pb.OrderResponse
};

Order.ListOrders = {
  methodName: "ListOrders",
  service: Order,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_order_pb.ListOrdersRequest,
  responseType: src_proto_order_pb.ListOrdersResponse
};

Order.UpdateOrder = {
  methodName: "UpdateOrder",
  service: Order,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_order_pb.OrderRequest,
  responseType: src_proto_order_pb.OrderResponse
};

Order.DeleteOrder = {
  methodName: "DeleteOrder",
  service: Order,
  requestStream: false,
  responseStream: false,
  requestType: src_proto_order_pb.OrderId,
  responseType: src_proto_order_pb.DeleteOrderResponse
};

Order.TrackOrderStatus = {
  methodName: "TrackOrderStatus",
  service: Order,
  requestStream: false,
  responseStream: true,
  requestType: src_proto_order_pb.OrderId,
  responseType: src_proto_order_pb.OrderStatusUpdate
};

exports.Order = Order;

function OrderClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

OrderClient.prototype.createOrder = function createOrder(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Order.CreateOrder, {
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

OrderClient.prototype.getOrder = function getOrder(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Order.GetOrder, {
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

OrderClient.prototype.listOrders = function listOrders(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Order.ListOrders, {
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

OrderClient.prototype.updateOrder = function updateOrder(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Order.UpdateOrder, {
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

OrderClient.prototype.deleteOrder = function deleteOrder(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Order.DeleteOrder, {
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

OrderClient.prototype.trackOrderStatus = function trackOrderStatus(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(Order.TrackOrderStatus, {
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

exports.OrderClient = OrderClient;

