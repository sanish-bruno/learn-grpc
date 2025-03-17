const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = require("electron-is-dev");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

let currentProto = null;
let currentServices = {};

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

// Helper function to extract type information
function extractTypeInfo(type) {
  if (!type) return null;

  const typeInfo = {
    name: type.type?.name || type.name,
    fields: {},
    nested: {},
  };

  // Extract field information from protobuf format
  if (type.type?.field) {
    type.type.field.forEach((field) => {
      typeInfo.fields[field.name] = {
        name: field.name,
        type: field.type,
        typeName: field.typeName,
        label: field.label,
        repeated: field.label === "LABEL_REPEATED",
        number: field.number,
      };
    });
  }

  // Extract nested type information
  if (type.type?.nestedType) {
    type.type.nestedType.forEach((nestedType) => {
      typeInfo.nested[nestedType.name] = extractTypeInfo({ type: nestedType });
    });
  }

  // Extract enum information
  if (type.type?.enumType) {
    type.type.enumType.forEach((enumType) => {
      typeInfo.nested[enumType.name] = {
        name: enumType.name,
        type: "enum",
        values:
          enumType.value?.map((v) => ({
            name: v.name,
            number: v.number,
          })) || [],
      };
    });
  }

  return typeInfo;
}

// Handle gRPC service loading
ipcMain.handle("load-services", async (event, { protoPath, serverUrl }) => {
  try {
    // Load the proto file with all type information
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [path.dirname(protoPath)],
    });

    currentProto = grpc.loadPackageDefinition(packageDefinition);
    currentServices = {};

    // Find all services in the proto file
    const services = {};
    for (const [pkgName, pkg] of Object.entries(currentProto)) {
      for (const [serviceName, service] of Object.entries(pkg)) {
        if (service.service) {
          const fullServiceName = `${pkgName}.${serviceName}`;
          services[fullServiceName] = {
            name: serviceName,
            package: pkgName,
            methods: Object.entries(service.service).map(([name, method]) => ({
              name,
              requestStream: method.requestStream,
              responseStream: method.responseStream,
              type: getMethodType(method.requestStream, method.responseStream),
              requestType: extractTypeInfo(method.requestType),
              responseType: extractTypeInfo(method.responseType),
            })),
          };
          // Store service constructor
          currentServices[fullServiceName] = service;
        }
      }
    }

    return {
      success: true,
      data: {
        services,
        protoContent: fs.readFileSync(protoPath, "utf8"),
      },
    };
  } catch (err) {
    console.error("Error:", err);
    return { success: false, error: err.message };
  }
});

// Handle gRPC method calls
ipcMain.handle(
  "call-method",
  async (event, { serverUrl, serviceName, methodName, request }) => {
    try {
      if (!currentServices[serviceName]) {
        throw new Error(`Service ${serviceName} not found`);
      }

      const client = new currentServices[serviceName](
        serverUrl,
        grpc.credentials.createInsecure()
      );

      const method = client[methodName].bind(client);
      if (!method) {
        throw new Error(
          `Method ${methodName} not found in service ${serviceName}`
        );
      }

      // Parse the request if it's a string
      const requestData =
        typeof request === "string" ? JSON.parse(request) : request;

      // Handle different types of methods
      const serviceInfo = currentServices[serviceName].service[methodName];
      if (!serviceInfo.requestStream && !serviceInfo.responseStream) {
        // Unary call
        return await new Promise((resolve, reject) => {
          method(requestData, (err, response) => {
            if (err) reject(err);
            else resolve({ success: true, data: response });
          });
        });
      } else if (!serviceInfo.requestStream && serviceInfo.responseStream) {
        // Server streaming
        return new Promise((resolve, reject) => {
          const call = method(requestData);
          const responses = [];

          call.on("data", (response) => {
            responses.push(response);
          });

          call.on("error", (err) => {
            reject(err);
          });

          call.on("end", () => {
            resolve({ success: true, data: responses });
          });
        });
      } else {
        throw new Error(
          "Client streaming and bidirectional streaming not implemented yet"
        );
      }
    } catch (err) {
      console.error("Error:", err);
      return { success: false, error: err.message };
    }
  }
);

// Helper function to determine method type
function getMethodType(requestStream, responseStream) {
  if (!requestStream && !responseStream) return "Unary";
  if (requestStream && !responseStream) return "Client Streaming";
  if (!requestStream && responseStream) return "Server Streaming";
  return "Bidirectional Streaming";
}

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
