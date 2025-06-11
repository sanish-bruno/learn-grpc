const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = require("electron-is-dev");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const grpcReflection = require("grpc-reflection-js");

const isMessageDefinition = (message) =>
  message.format === "Protocol Buffer 3 DescriptorProto";

const isEnumDefinition = (message) =>
  message.format === "Protocol Buffer 3 EnumDescriptorProto";

const isServiceDefinition = (message) => !!message.service;

const isMethodDefinition = (message) =>
  !isMessageDefinition(message) &&
  !isEnumDefinition(message) &&
  !isServiceDefinition(message);

const getMethodType = (requestStream, responseStream) => {
  if (requestStream && responseStream) return "BIDI_STREAMING";
  if (requestStream) return "CLIENT_STREAMING";
  if (responseStream) return "SERVER_STREAMING";
  return "UNARY";
};

const getMethodsFromPackageDefinition = (packageDefinition) => {
  return Object.values(packageDefinition)
    .filter(isMethodDefinition)
    .flatMap(Object.values);
};

class GrpcCore {
  constructor() {
    this.connections = new Map();
  }

  async getMethodsFromProtoFile({ protoPath }) {
    const packageDefinition = await protoLoader.load(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [path.dirname(protoPath)],
    });
    const methods = getMethodsFromPackageDefinition(packageDefinition);
    console.log("methods", methods);
    const methodsWithType = methods.map((m) => ({
      ...m,
      type: getMethodType(m.requestStream, m.responseStream),
    }));
    console.log("methodsWithType", methodsWithType);
    return methodsWithType;
  }

  async getMethodsFromReflection({ serverUrl }) {
    console.log("serverUrl", serverUrl);
    const client = new grpcReflection.Client(serverUrl);
    const services = await client.listServices();
    console.log("services", services);
  }

  end(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    connection.end();
  }

  cancel(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    connection.cancel();
  }

  cancelAll() {
    this.connections.forEach((c) => c.cancel());
  }
}

const grpcCore = new GrpcCore();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Handle proto file selection
ipcMain.handle("select-proto-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Proto Files", extensions: ["proto"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const protoPath = result.filePaths[0];
    const protoContent = fs.readFileSync(protoPath, "utf8");
    return {
      success: true,
      data: {
        path: protoPath,
        content: protoContent,
      },
    };
  }
  return { success: false, error: "No file selected" };
});

ipcMain.handle("start", (event, options) => {
  grpcCore.start(options);
});

ipcMain.handle("send-message", (event, options) => {
  grpcCore.sendMessage(options);
});

ipcMain.handle("end", (event, options) => {
  grpcCore.end(options);
});

ipcMain.handle("cancel", (event, options) => {
  grpcCore.cancel(options);
});

ipcMain.handle("cancel-all", (event, options) => {
  grpcCore.cancelAll(options);
});

ipcMain.handle("load-services", (event, options) => {
  grpcCore.getMethodsFromProtoFile(options);
});

ipcMain.handle("try-reflection", (event, options) => {
  console.log("handling reflection");
  return grpcCore.getMethodsFromReflection(options);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
