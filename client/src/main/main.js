const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = require("electron-is-dev");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
// Import the reflection module - note: instantiate with grpcReflection.Client, not GrpcReflection
const grpcReflection = require("grpc-reflection-js");

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

// Handle gRPC reflection
ipcMain.handle("try-reflection", async (event, { serverUrl }) => {
  let reflection = null;

  try {
    console.log(
      `Attempting to connect to gRPC server at ${serverUrl} with reflection...`
    );

    // Create the reflection client
    reflection = new grpcReflection.Client(
      serverUrl,
      grpc.credentials.createInsecure()
    );

    // List all services to check if reflection is supported
    console.log("Listing services via reflection...");
    const services = await reflection.listServices();
    console.log(`Found ${services.length} services via reflection:`, services);

    // Skip reflection service itself
    const filteredServices = services.filter(
      (service) => service !== "grpc.reflection.v1alpha.ServerReflection"
    );

    if (filteredServices.length === 0) {
      return {
        success: false,
        error: "No services found via reflection",
        reflectionSupported: true,
      };
    }

    // Process each service to extract methods and types
    const serviceDetails = {};

    for (const service of filteredServices) {
      try {
        console.log(`Processing service: ${service}`);

        // Get service descriptor data from reflection
        const serviceInfo = await reflection.fileContainingSymbol(service);
        console.log(
          `Got service info for ${service}:`,
          JSON.stringify(serviceInfo, null, 2)
        );

        // Parse service info
        const packageName = service.substring(0, service.lastIndexOf("."));
        const serviceName = service.substring(service.lastIndexOf(".") + 1);
        console.log(`Package: ${packageName}, Service: ${serviceName}`);

        // Extract all service details
        const serviceData = extractServiceDetailsFromReflection(
          serviceInfo,
          packageName,
          serviceName,
          service
        );

        if (serviceData) {
          serviceDetails[service] = serviceData;
          console.log(
            `Successfully processed service ${service} with ${serviceData.methods.length} methods`
          );
        } else {
          console.warn(`Failed to extract details for service ${service}`);
        }
      } catch (err) {
        console.error(`Error processing service ${service}:`, err);
      }
    }

    // Check if we have any successfully processed services
    if (Object.keys(serviceDetails).length === 0) {
      console.warn("No services were processed successfully");
      return {
        success: false,
        error: "No valid services could be processed via reflection",
        reflectionSupported: true,
      };
    }

    // Generate proto file content from service details
    const protoContent = generateProtoFileFromReflection(serviceDetails);

    // Save the proto content to a temporary file for debugging
    const tempProtoPath = path.join(
      app.getPath("temp"),
      `reflection_${Date.now()}.proto`
    );
    fs.writeFileSync(tempProtoPath, protoContent);
    console.log(`Saved reflection proto file to: ${tempProtoPath}`);

    return {
      success: true,
      data: {
        // services: serviceDetails,
        content: protoContent,
        path: tempProtoPath,
        fromReflection: true,
      },
    };
  } catch (err) {
    console.error("Reflection error:", err);
    return {
      success: false,
      error: err.message,
      reflectionSupported: false,
    };
  } finally {
    // Always close the reflection client if it was created
    if (reflection) {
      try {
        if (typeof reflection.close === "function") {
          reflection.close();
          console.log("Reflection client closed successfully");
        } else {
          console.log(
            "Reflection client doesn't have a close method, skipping"
          );
        }
      } catch (err) {
        console.error("Error closing reflection client:", err);
      }
    }
  }
});

// Extract service details from reflection data
function extractServiceDetailsFromReflection(
  serviceInfo,
  packageName,
  serviceName,
  fullServiceName
) {
  // Check if the serviceInfo has the expected structure
  if (
    !serviceInfo ||
    !serviceInfo.nested ||
    !serviceInfo.nested[packageName] ||
    !serviceInfo.nested[packageName].nested
  ) {
    console.warn(
      `Service info doesn't have expected structure for ${fullServiceName}`
    );
    return null;
  }

  const packageContent = serviceInfo.nested[packageName].nested;

  // Find the service definition
  if (!packageContent[serviceName] || !packageContent[serviceName].methods) {
    console.warn(`Service definition not found for ${serviceName}`);
    return null;
  }

  const serviceDefinition = packageContent[serviceName];
  const methodsObj = serviceDefinition.methods;

  // Process methods
  const methods = Object.entries(methodsObj).map(([methodName, methodInfo]) => {
    return {
      name: methodName,
      requestStream: !!methodInfo.requestStream,
      responseStream: !!methodInfo.responseStream,
      type: getMethodType(
        !!methodInfo.requestStream,
        !!methodInfo.responseStream
      ),
      requestType: methodInfo.requestType,
      responseType: methodInfo.responseType,
    };
  });

  // Extract all message types used by this service
  const messages = extractMessagesFromReflection(serviceInfo, packageName);

  // Collect message types specifically relevant to this service
  const relevantMessages = {};

  // Add messages that are used as request or response types
  methods.forEach((method) => {
    const requestTypeName = method.requestType.split(".").pop();
    const responseTypeName = method.responseType.split(".").pop();

    // Add the request type if it exists in the extracted messages
    Object.keys(messages).forEach((messageName) => {
      const simpleName = messageName.split(".").pop();
      if (simpleName === requestTypeName || simpleName === responseTypeName) {
        relevantMessages[messageName] = messages[messageName];
        console.log(
          `Added relevant message: ${messageName} to service ${serviceName}`
        );
      }
    });
  });

  console.log(
    `Found ${
      Object.keys(relevantMessages).length
    } relevant messages for service ${serviceName}`
  );

  return {
    name: serviceName,
    package: packageName,
    methods: methods,
    messages: relevantMessages,
    // Store the original reflection data for proto generation
    reflectionData: serviceInfo,
  };
}

// Generate a proto file from reflection data
function generateProtoFileFromReflection(serviceDetails) {
  // Start with proto syntax declaration
  let protoContent = `syntax = "proto3";\n\n`;

  // Track all processed types to avoid duplicates
  const processedTypes = new Set();
  const processedEnums = new Set();

  // Process each service
  for (const [fullServiceName, serviceData] of Object.entries(serviceDetails)) {
    const packageName = serviceData.package;

    // Add package declaration if not already added
    if (!protoContent.includes(`package ${packageName};`)) {
      protoContent += `package ${packageName};\n\n`;
    }

    // Get the reflection data for this service
    const serviceInfo = serviceData.reflectionData;

    if (
      serviceInfo &&
      serviceInfo.nested &&
      serviceInfo.nested[packageName] &&
      serviceInfo.nested[packageName].nested
    ) {
      const packageTypes = serviceInfo.nested[packageName].nested;

      // Process all enum types first
      for (const [typeName, typeInfo] of Object.entries(packageTypes)) {
        if (typeInfo.values && !processedEnums.has(typeName)) {
          console.log(`Processing enum: ${typeName}`);
          protoContent += generateEnumDefinition(typeName, typeInfo);
          processedEnums.add(typeName);
        }
      }

      // Process all message types next
      for (const [typeName, typeInfo] of Object.entries(packageTypes)) {
        if (
          typeInfo.fields &&
          !processedTypes.has(typeName) &&
          !processedEnums.has(typeName)
        ) {
          console.log(`Processing message: ${typeName}`);
          protoContent += generateMessageDefinition(typeName, typeInfo);
          processedTypes.add(typeName);
        }
      }

      // Finally, add the service definition
      if (
        packageTypes[serviceData.name] &&
        packageTypes[serviceData.name].methods
      ) {
        console.log(`Processing service: ${serviceData.name}`);
        protoContent += generateServiceDefinition(
          serviceData.name,
          packageTypes[serviceData.name].methods
        );
      }
    }
  }

  // Log the complete generated proto file content for debugging
  console.log("\n===== GENERATED PROTO FILE CONTENT =====");
  console.log(protoContent);
  console.log("======================================\n");

  return protoContent;
}

// Helper function to generate enum definition
function generateEnumDefinition(enumName, enumInfo) {
  console.log(`Generating enum definition for ${enumName}`);
  console.log(`Enum info:`, JSON.stringify(enumInfo, null, 2));

  // Get the simple name (without package)
  const simpleName = enumName.includes(".")
    ? enumName.split(".").pop()
    : enumName;
  console.log(`Using enum name: ${simpleName}`);

  let enumDef = `enum ${simpleName} {\n`;

  // Add enum values directly from the enumInfo object
  if (enumInfo && enumInfo.values) {
    console.log(`Found enum values for ${enumName}:`, enumInfo.values);
    const valueCount = Object.keys(enumInfo.values).length;
    console.log(`Enum ${enumName} has ${valueCount} values`);

    // Add all the enum values in order
    for (const [valueName, value] of Object.entries(enumInfo.values)) {
      console.log(`Adding enum value: ${valueName} = ${value}`);
      enumDef += `  ${valueName} = ${value};\n`;
    }
  } else {
    // Default enum value if none provided
    console.log(
      `No enum values found for ${enumName}, adding default UNSPECIFIED value`
    );
    enumDef += `  UNSPECIFIED = 0;\n`;
  }

  enumDef += `}\n\n`;
  return enumDef;
}

// Helper function to generate message definition
function generateMessageDefinition(messageName, typeInfo) {
  console.log(`Generating message definition for: ${messageName}`);
  let messageDef = `message ${messageName} {\n`;

  // Add all fields
  if (typeInfo.fields) {
    console.log(
      `Message ${messageName} has ${Object.keys(typeInfo.fields).length} fields`
    );
    let fieldNumber = 1;
    for (const [fieldName, field] of Object.entries(typeInfo.fields)) {
      console.log(`Processing field: ${fieldName}`, field);

      // Determine repeated status
      const repeated = field.rule === "repeated" ? "repeated " : "";
      if (field.rule === "repeated") {
        console.log(`Field ${fieldName} is repeated`);
      }

      // Determine field type
      let fieldType = field.typeName || field.type;
      console.log(`Field ${fieldName} initial type: ${fieldType}`);

      // For primitive types, use the type directly; for complex types, use the type name
      if (isPrimitiveType(fieldType)) {
        fieldType = normalizePrimitiveType(fieldType);
        console.log(
          `Field ${fieldName} is primitive, normalized to: ${fieldType}`
        );
      } else {
        // If it's a complex type, use the simple name
        const typeNameParts = fieldType.split(".");
        const originalFieldType = fieldType;
        fieldType = typeNameParts[typeNameParts.length - 1];
        console.log(
          `Field ${fieldName} is complex, simplified from ${originalFieldType} to: ${fieldType}`
        );
      }

      // Get field ID from reflection data - reflection uses 'id' not 'number'
      const fieldId = field.id || field.number || fieldNumber++;
      console.log(`Field ${fieldName} assigned id: ${fieldId}`);

      messageDef += `  ${repeated}${fieldType} ${fieldName} = ${fieldId};\n`;
    }
  } else {
    console.log(`Message ${messageName} has no fields`);
  }

  // Add nested types if any
  if (typeInfo.nested && Object.keys(typeInfo.nested).length > 0) {
    console.log(
      `Message ${messageName} has nested types: ${Object.keys(
        typeInfo.nested
      ).join(", ")}`
    );

    // Process all nested types
    for (const [nestedName, nestedType] of Object.entries(typeInfo.nested)) {
      console.log(`Processing nested type: ${nestedName}`, nestedType);

      // Handle nested enums
      if (nestedType.values) {
        console.log(`Processing nested enum: ${nestedName}`);
        messageDef += processNestedEnum(nestedName, nestedType, 2);
      }
      // Handle nested messages
      else if (nestedType.fields) {
        console.log(`Processing nested message: ${nestedName}`);
        messageDef += processNestedMessage(nestedName, nestedType, 2);
      }
      // Handle other nested types, like nested enums with specific structure
      else if (nestedType.type === "enum" && nestedType.values) {
        console.log(`Processing nested enum alternative format: ${nestedName}`);
        messageDef += processNestedEnum(nestedName, nestedType, 2);
      }
    }
  }

  messageDef += `}\n\n`;
  return messageDef;
}

// Helper function to process a nested enum
function processNestedEnum(enumName, enumInfo, indentLevel) {
  const indent = " ".repeat(indentLevel);
  let enumDef = `${indent}enum ${enumName} {\n`;

  // Add enum values
  if (enumInfo.values) {
    for (const [valueName, value] of Object.entries(enumInfo.values)) {
      enumDef += `${indent}  ${valueName} = ${value};\n`;
    }
  }

  enumDef += `${indent}}\n\n`;
  return enumDef;
}

// Helper function to process a nested message
function processNestedMessage(messageName, messageInfo, indentLevel) {
  const indent = " ".repeat(indentLevel);
  let nestedMessageDef = `${indent}message ${messageName} {\n`;

  // Process fields
  if (messageInfo.fields) {
    for (const [fieldName, field] of Object.entries(messageInfo.fields)) {
      const repeated = field.rule === "repeated" ? "repeated " : "";
      let fieldType = field.typeName || field.type;

      // Simplify complex types
      if (!isPrimitiveType(fieldType)) {
        const typeNameParts = fieldType.split(".");
        fieldType = typeNameParts[typeNameParts.length - 1];
      }

      const fieldId = field.id || field.number || 1;
      nestedMessageDef += `${indent}  ${repeated}${fieldType} ${fieldName} = ${fieldId};\n`;
    }
  }

  // Process nested types within the nested message recursively
  if (messageInfo.nested && Object.keys(messageInfo.nested).length > 0) {
    for (const [subNestedName, subNestedType] of Object.entries(
      messageInfo.nested
    )) {
      // Handle nested enums
      if (subNestedType.values) {
        nestedMessageDef += processNestedEnum(
          subNestedName,
          subNestedType,
          indentLevel + 2
        );
      }
      // Handle nested messages
      else if (subNestedType.fields) {
        nestedMessageDef += processNestedMessage(
          subNestedName,
          subNestedType,
          indentLevel + 2
        );
      }
    }
  }

  nestedMessageDef += `${indent}}\n\n`;
  return nestedMessageDef;
}

// Generate service definition for proto file
function generateServiceDefinition(serviceName, methods) {
  console.log(`Generating service definition for: ${serviceName}`);
  console.log(`Service has ${Object.keys(methods).length} methods`);

  let definition = `service ${serviceName} {\n`;

  // Add all methods
  for (const [methodName, methodInfo] of Object.entries(methods)) {
    // console.log(`Processing method: ${methodName}`, methodInfo);

    const requestType = extractTypeName(methodInfo.requestType);
    const responseType = extractTypeName(methodInfo.responseType);

    console.log(
      `Method ${methodName} request type: ${methodInfo.requestType} -> ${requestType}`
    );
    console.log(
      `Method ${methodName} response type: ${methodInfo.responseType} -> ${responseType}`
    );

    // Handle streaming
    const requestStream = methodInfo.requestStream ? "stream " : "";
    const responseStream = methodInfo.responseStream ? "stream " : "";

    if (methodInfo.requestStream) {
      console.log(`Method ${methodName} has request streaming`);
    }

    if (methodInfo.responseStream) {
      console.log(`Method ${methodName} has response streaming`);
    }

    const methodLine = `  rpc ${methodName} (${requestStream}${requestType}) returns (${responseStream}${responseType});`;
    console.log(`Adding method line: ${methodLine}`);
    definition += `${methodLine}\n`;
  }

  definition += `}\n\n`;
  console.log(`Completed service definition for: ${serviceName}`);
  return definition;
}

// Extract short type name from a fully qualified name
function extractTypeName(fullTypeName) {
  if (!fullTypeName) return "VoidParam";

  // Remove leading dot if present
  const typeName = fullTypeName.startsWith(".")
    ? fullTypeName.substring(1)
    : fullTypeName;

  // Get the last part of the type name
  const parts = typeName.split(".");
  return parts[parts.length - 1];
}

// Extract type information from a protobuf type
// function extractTypeInfo(type) {
//   if (!type) {
//     return { type: "unknown", name: "Unknown" };
//   }

//   // Handle primitive types
//   if (typeof type === "string") {
//     return {
//       type: "primitive",
//       name: type,
//       isPrimitive: true,
//     };
//   }

//   // For complex types (usually objects)
//   return {
//     type: "message",
//     name: type.name || "Unknown",
//     isPrimitive: false,
//     // Include additional type info if available
//     fields: type.fields || [],
//     nested: type.nested || {},
//   };
// }

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

// Call a gRPC method
ipcMain.handle(
  "call-method",
  async (
    event,
    {
      serverUrl,
      serviceName,
      methodName,
      requestData,
      protoPath,
      useReflection,
    }
  ) => {
    try {
      // Use proto file to call the method
      const result = await callMethodWithProtoFile(
        serverUrl,
        serviceName,
        methodName,
        requestData,
        protoPath
      );

      // If this is a streaming method, we need to start the stream
      if (result.streaming) {
        console.log(
          `Method ${methodName} is a streaming method (${result.streamType})`
        );
        // Start the stream and get the streamId
        const streamResult = result.startStream(event);
        // Return streaming information to the client
        return {
          success: true,
          streaming: true,
          streamType: result.streamType,
          streamId: streamResult.streamId,
        };
      }

      // For regular unary calls, just return the result
      return result;
    } catch (err) {
      console.error("Error calling method:", err);
      return { success: false, error: err.message };
    }
  }
);

// Extract services from reflection data
// function extractServicesFromReflection(serviceInfo, packageName) {
//   const services = {};

//   try {
//     if (
//       serviceInfo.nested &&
//       serviceInfo.nested[packageName] &&
//       serviceInfo.nested[packageName].nested
//     ) {
//       const packageLevel = serviceInfo.nested[packageName].nested;

//       // Find all service definitions in the package
//       Object.keys(packageLevel).forEach((key) => {
//         const item = packageLevel[key];

//         // If it has methods, it's a service
//         if (item.methods) {
//           const fullServiceName = `${packageName}.${key}`;
//           services[fullServiceName] = {
//             name: key,
//             methods: item.methods,
//           };
//         }
//       });
//     }
//   } catch (e) {
//     console.error("Error extracting services from reflection data:", e);
//   }

//   return services;
// }

// Extract message definitions from reflection data
function extractMessagesFromReflection(serviceInfo, packageName) {
  const messages = {};

  try {
    if (
      serviceInfo.nested &&
      serviceInfo.nested[packageName] &&
      serviceInfo.nested[packageName].nested
    ) {
      const packageLevel = serviceInfo.nested[packageName].nested;

      // Find all message definitions in the package
      Object.keys(packageLevel).forEach((key) => {
        const item = packageLevel[key];

        // If it has fields or is a nested structure, it's likely a message
        if (item.fields || (item.nested && !item.methods)) {
          const fullMessageName = `${packageName}.${key}`;
          messages[fullMessageName] = {
            format: "Protocol Buffer 3 DescriptorProto",
            type: item,
          };
        }
      });
    }
  } catch (e) {
    console.error("Error extracting messages from reflection data:", e);
  }

  return messages;
}

// Helper function to get method type
function getMethodType(requestStream, responseStream) {
  if (requestStream && responseStream) return "BIDI_STREAMING";
  if (requestStream) return "CLIENT_STREAMING";
  if (responseStream) return "SERVER_STREAMING";
  return "UNARY";
}

// Helper function to check if a type is a primitive type
function isPrimitiveType(typeName) {
  if (!typeName) return false;

  return [
    "double",
    "float",
    "int32",
    "int64",
    "uint32",
    "uint64",
    "sint32",
    "sint64",
    "fixed32",
    "fixed64",
    "sfixed32",
    "sfixed64",
    "bool",
    "string",
    "bytes",
  ].includes(typeName);
}

// Helper function to normalize primitive type names
function normalizePrimitiveType(typeName) {
  if (!typeName) return "string";

  // Integer types
  if (
    typeName === "int32" ||
    typeName === "int64" ||
    typeName === "uint32" ||
    typeName === "uint64" ||
    typeName === "sint32" ||
    typeName === "sint64" ||
    typeName === "fixed32" ||
    typeName === "fixed64" ||
    typeName === "sfixed32" ||
    typeName === "sfixed64"
  ) {
    return "int32";
  }

  return typeName;
}

// Call a gRPC method using a proto file
async function callMethodWithProtoFile(
  serverUrl,
  serviceName,
  methodName,
  requestData,
  protoPath
) {
  try {
    console.log(`Using proto file: ${protoPath}`);
    console.log(`Calling ${serviceName}.${methodName}...`);

    // Load the proto file
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [path.dirname(protoPath)],
    });

    // Load the gRPC package definition
    const grpcObj = grpc.loadPackageDefinition(packageDefinition);

    // Parse the service name to navigate the package structure
    const [packageName, serviceClassName] = serviceName.split(".");

    // Get the service class
    const serviceClient = grpcObj[packageName][serviceClassName];
    if (!serviceClient) {
      throw new Error(
        `Service class ${serviceName} not found in proto definition`
      );
    }

    // Get method metadata to determine if it's a streaming method
    const methodInfo = Object.entries(serviceClient.service).find(
      ([name]) => name === methodName
    )?.[1];

    if (!methodInfo) {
      throw new Error(
        `Method ${methodName} not found in service ${serviceName}`
      );
    }

    const isClientStreaming = methodInfo.requestStream;
    const isServerStreaming = methodInfo.responseStream;

    // Create a client instance
    const client = new serviceClient(
      serverUrl,
      grpc.credentials.createInsecure()
    );

    console.log(`Client created successfully. Calling method: ${methodName}`);
    console.log(`Request data:`, JSON.stringify(requestData, null, 2));
    console.log(
      `Method type: client streaming: ${isClientStreaming}, server streaming: ${isServerStreaming}`
    );

    // Handle different call types based on streaming flags
    // Case 1: Unary call (no streaming)
    if (!isClientStreaming && !isServerStreaming) {
      return new Promise((resolve, reject) => {
        client[methodName](requestData, (err, response) => {
          if (err) {
            console.error(`gRPC error calling ${methodName}:`, err);
            reject(err);
          } else {
            console.log(`Received response from ${methodName}:`, response);
            resolve({ success: true, data: response });
          }
        });
      });
    }
    // Case 2: Server streaming (client sends one request, server sends multiple responses)
    else if (!isClientStreaming && isServerStreaming) {
      return handleServerStreaming(client, methodName, requestData);
    }
    // Case 3: Client streaming (client sends multiple requests, server sends one response)
    else if (isClientStreaming && !isServerStreaming) {
      return handleClientStreaming(client, methodName, requestData);
    }
    // Case 4: Bidirectional streaming (both client and server send multiple messages)
    else {
      return handleBidirectionalStreaming(client, methodName, requestData);
    }
  } catch (err) {
    console.error(`Error in callMethodWithProtoFile:`, err);
    throw err;
  }
}

// Handle server streaming (client sends one request, server sends multiple responses)
function handleServerStreaming(client, methodName, requestData) {
  return {
    success: true,
    streaming: true,
    streamType: "SERVER_STREAMING",
    startStream: (event) => {
      try {
        console.log(`Starting server streaming for ${methodName}`);
        const call = client[methodName](requestData);

        // Set up event listeners for the stream
        call.on("data", (response) => {
          console.log(`Received streaming response:`, response);
          event.sender.send("stream-response", {
            type: "data",
            methodName,
            data: response,
          });
        });

        call.on("end", () => {
          console.log(`Server stream ended for ${methodName}`);
          event.sender.send("stream-response", {
            type: "end",
            methodName,
          });
        });

        call.on("error", (error) => {
          console.error(`Error in server stream for ${methodName}:`, error);
          event.sender.send("stream-response", {
            type: "error",
            methodName,
            error: error.message,
          });
        });

        // Store the call for cancellation
        const streamId = Date.now().toString();
        activeStreams[streamId] = call;

        return { streamId };
      } catch (err) {
        console.error(`Error starting server stream:`, err);
        throw err;
      }
    },
  };
}

// Handle client streaming (client sends multiple requests, server sends one response)
function handleClientStreaming(client, methodName, initialRequestData) {
  return {
    success: true,
    streaming: true,
    streamType: "CLIENT_STREAMING",
    startStream: (event) => {
      try {
        console.log(`Starting client streaming for ${methodName}`);

        // Create a client stream
        const call = client[methodName]((error, response) => {
          if (error) {
            console.error(`Error in client stream for ${methodName}:`, error);
            event.sender.send("stream-response", {
              type: "error",
              methodName,
              error: error.message,
            });
          } else {
            console.log(`Received final response for client stream:`, response);
            event.sender.send("stream-response", {
              type: "data",
              methodName,
              data: response,
            });
            event.sender.send("stream-response", {
              type: "end",
              methodName,
            });
          }
        });

        // If initial data was provided, write it to the stream
        if (initialRequestData) {
          call.write(initialRequestData);
        }

        // Store the call for later writing and ending
        const streamId = Date.now().toString();
        activeStreams[streamId] = call;

        return { streamId };
      } catch (err) {
        console.error(`Error starting client stream:`, err);
        throw err;
      }
    },
  };
}

// Handle bidirectional streaming (both client and server send multiple messages)
function handleBidirectionalStreaming(client, methodName, initialRequestData) {
  return {
    success: true,
    streaming: true,
    streamType: "BIDI_STREAMING",
    startStream: (event) => {
      try {
        console.log(`Starting bidirectional streaming for ${methodName}`);

        // Create a bidirectional stream
        const call = client[methodName]();

        // Set up event listeners for the stream
        call.on("data", (response) => {
          console.log(`Received bidirectional streaming response:`, response);
          event.sender.send("stream-response", {
            type: "data",
            methodName,
            data: response,
          });
        });

        call.on("end", () => {
          console.log(`Bidirectional stream ended for ${methodName}`);
          event.sender.send("stream-response", {
            type: "end",
            methodName,
          });
        });

        call.on("error", (error) => {
          console.error(
            `Error in bidirectional stream for ${methodName}:`,
            error
          );
          event.sender.send("stream-response", {
            type: "error",
            methodName,
            error: error.message,
          });
        });

        // If initial data was provided, write it to the stream
        if (initialRequestData) {
          call.write(initialRequestData);
        }

        // Store the call for later writing and ending
        const streamId = Date.now().toString();
        activeStreams[streamId] = call;

        return { streamId };
      } catch (err) {
        console.error(`Error starting bidirectional stream:`, err);
        throw err;
      }
    },
  };
}

// Store active streams for management
const activeStreams = {};

// Add IPC handlers for stream management
ipcMain.handle("stream-write", (event, { streamId, data }) => {
  try {
    const stream = activeStreams[streamId];
    if (!stream) {
      return { success: false, error: "Stream not found" };
    }

    console.log(`Writing to stream ${streamId}:`, data);
    stream.write(data);
    return { success: true };
  } catch (err) {
    console.error(`Error writing to stream:`, err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("stream-end", (event, { streamId }) => {
  try {
    const stream = activeStreams[streamId];
    if (!stream) {
      return { success: false, error: "Stream not found" };
    }

    console.log(`Ending stream ${streamId}`);
    stream.end();
    delete activeStreams[streamId];
    return { success: true };
  } catch (err) {
    console.error(`Error ending stream:`, err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("stream-cancel", (event, { streamId }) => {
  try {
    const stream = activeStreams[streamId];
    if (!stream) {
      return { success: false, error: "Stream not found" };
    }

    console.log(`Cancelling stream ${streamId}`);
    stream.cancel();
    delete activeStreams[streamId];
    return { success: true };
  } catch (err) {
    console.error(`Error cancelling stream:`, err);
    return { success: false, error: err.message };
  }
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
