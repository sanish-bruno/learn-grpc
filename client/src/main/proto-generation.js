// Export functions for proto file generation from gRPC reflection data

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
    console.log(`Processing method: ${methodName}`, methodInfo);

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

  return {
    name: serviceName,
    package: packageName,
    methods: methods,
    // Store the original reflection data for proto generation
    reflectionData: serviceInfo,
  };
}

// Helper function to get method type
function getMethodType(requestStream, responseStream) {
  if (requestStream && responseStream) return "BIDI_STREAMING";
  if (requestStream) return "CLIENT_STREAMING";
  if (responseStream) return "SERVER_STREAMING";
  return "UNARY";
}

module.exports = {
  generateProtoFileFromReflection,
  extractServiceDetailsFromReflection,
  isPrimitiveType,
  normalizePrimitiveType,
  getMethodType,
};
