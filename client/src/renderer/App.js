import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  TextareaAutosize,
  Grid,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import ReactJson from "react-json-view";
import { faker } from "@faker-js/faker";
const { ipcRenderer } = require("electron");

const App = () => {
  const [serverUrl, setServerUrl] = useState("");
  const [services, setServices] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [protoFile, setProtoFile] = useState(null);
  const [selectedService, setSelectedService] = useState("");
  const [response, setResponse] = useState(null);
  const [calling, setCalling] = useState(false);
  const [reflectionFailed, setReflectionFailed] = useState(false);
  const [isReflectionMode, setIsReflectionMode] = useState(false);

  const generateSampleValue = (field) => {
    try {
      if (!field) {
        console.log("Field is undefined");
        return null;
      }

      if (!field.type) {
        console.log("Field type is undefined", field);
        return null;
      }

      // Handle message types
      if (field.type === "TYPE_MESSAGE") {
        console.log("Field is a message type");
        return {}; // Will be handled by generateMessageObject
      }

      // Get field name safely
      const fieldName = field.name || "";
      console.log(
        `Generating sample value for field: ${fieldName}, type: ${field.type}`
      );

      // Handle basic types
      switch (field.type) {
        case "TYPE_STRING":
          if (fieldName.toLowerCase().includes("id"))
            return faker.string.uuid();
          if (fieldName.toLowerCase().includes("name"))
            return faker.commerce.productName();
          if (fieldName.toLowerCase().includes("description"))
            return faker.commerce.productDescription();
          if (fieldName.toLowerCase().includes("timestamp"))
            return new Date().toISOString();
          return faker.lorem.sentence();

        case "TYPE_INT32":
        case "TYPE_INT64":
        case "TYPE_SINT32":
        case "TYPE_SINT64":
        case "TYPE_FIXED32":
        case "TYPE_FIXED64":
          if (fieldName.toLowerCase().includes("id"))
            return faker.number.int({ min: 1, max: 1000 });
          if (fieldName.toLowerCase().includes("price"))
            return faker.number.int({ min: 1, max: 1000 });
          return faker.number.int({ min: 0, max: 100 });

        case "TYPE_FLOAT":
        case "TYPE_DOUBLE":
          if (fieldName.toLowerCase().includes("price"))
            return faker.number.float({
              min: 0.99,
              max: 999.99,
              precision: 0.01,
            });
          return faker.number.float({ min: 0, max: 100, precision: 0.01 });

        case "TYPE_BOOL":
          return faker.datatype.boolean();

        case "TYPE_ENUM":
          return 0; // Default to first enum value

        case "TYPE_BYTES":
          return ""; // Empty string for bytes

        default:
          console.log(`Unhandled field type: ${field.type}`);
          return null;
      }
    } catch (err) {
      console.error("Error in generateSampleValue:", err);
      return null;
    }
  };

  const generateSampleRequest = (method) => {
    if (!method || !method.requestType) return {};

    const generateMessageObject = (messageType) => {
      const result = {};
      console.log("Generating message object for", messageType);

      // Handle fields
      if (messageType.fields) {
        Object.entries(messageType.fields).forEach(([fieldName, field]) => {
          if (field.repeated) {
            // Generate array of 2-3 items for repeated fields
            result[fieldName] = Array.from(
              { length: faker.number.int({ min: 2, max: 3 }) },
              () => {
                if (field.type === "TYPE_MESSAGE") {
                  // For repeated message fields, generate a new message object
                  return generateMessageObject({ type: { field: [] } }); // Empty message for now
                }
                return generateSampleValue(field);
              }
            );
          } else if (field.type === "TYPE_MESSAGE") {
            // For message fields, recursively generate a message object
            result[fieldName] = generateMessageObject({
              type: { field: [] },
            }); // Empty message for now
          } else {
            result[fieldName] = generateSampleValue(field);
          }
        });
      }

      return result;
    };

    return generateMessageObject(method.requestType);
  };

  const tryServerReflection = async () => {
    if (!serverUrl) {
      setError("Please enter a server URL");
      return false;
    }

    try {
      setError("");
      setLoading(true);
      setReflectionFailed(false);
      setIsReflectionMode(false);

      const result = await ipcRenderer.invoke("try-reflection", {
        serverUrl,
      });

      console.log("Result from reflection", result);

      if (result.success) {
        setProtoFile(result.data);
        setIsReflectionMode(true);
        await loadServices(result.data);
        return true;
      } else {
        console.error("Reflection failed:", result.error);
        setReflectionFailed(true);
        setError(`Server reflection not available: ${result.error}`);
        return false;
      }
    } catch (err) {
      setReflectionFailed(true);
      setError(`Error with server reflection: ${err.message}`);
      console.error("Error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const selectProtoFile = async () => {
    try {
      const result = await ipcRenderer.invoke("select-proto-file");
      console.log("Result from selectProtoFile", result);
      if (result.success) {
        setProtoFile(result.data);
        setServices(null);
        setSelectedMethod("");
        setSelectedService("");
        setRequestMessage("");
        setIsReflectionMode(false);
        setReflectionFailed(false);
      } else {
        setError("Failed to load proto file");
      }
    } catch (err) {
      setError(`Error loading proto file: ${err.message}`);
      console.error("Error:", err);
    }
  };

  const loadServices = async (protoFileData = null) => {
    const fileToUse = protoFileData || protoFile;

    if (!fileToUse || !serverUrl) return;

    try {
      setError("");
      setServices(null);
      setLoading(true);

      const result = await ipcRenderer.invoke("load-services", {
        protoPath: fileToUse.path,
        protoContent: fileToUse.content,
        serverUrl,
        useReflection: isReflectionMode,
      });

      if (result.success) {
        setServices(result.data);
      } else {
        setError(`Failed to load services: ${result.error}`);
      }
    } catch (err) {
      setError(`Error loading services: ${err.message}`);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (event) => {
    setSelectedService(event.target.value);
    setSelectedMethod("");
    setRequestMessage("");
  };

  const handleMethodChange = (event) => {
    const methodName = event.target.value;
    setSelectedMethod(methodName);
    setResponse(null);

    const method = services.services[selectedService].methods.find(
      (m) => m.name === methodName
    );

    if (method) {
      const sampleRequest = generateSampleRequest(method);
      console.log("Sample request generated:", sampleRequest);

      if (Object.keys(sampleRequest).length === 0) {
        // For truly empty requests, add a comment to help users understand
        setRequestMessage(JSON.stringify({}));
      } else {
        setRequestMessage(JSON.stringify(sampleRequest, null, 2));
      }
    } else {
      setRequestMessage("");
    }
  };

  const callMethod = async () => {
    if (!serverUrl || !selectedService || !selectedMethod) return;

    try {
      setError("");
      setCalling(true);

      let requestData;
      try {
        requestData = JSON.parse(requestMessage);
      } catch (err) {
        setError(`Invalid JSON in request: ${err.message}`);
        setCalling(false);
        return;
      }

      const result = await ipcRenderer.invoke("call-method", {
        serverUrl,
        serviceName: selectedService,
        methodName: selectedMethod,
        requestData,
        protoPath: protoFile?.path,
        protoContent: protoFile?.content,
        useReflection: isReflectionMode,
      });

      if (result.success) {
        setResponse(result.data);
      } else {
        setError(`Error calling method: ${result.error}`);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error("Error:", err);
    } finally {
      setCalling(false);
    }
  };

  const regenerateRequest = () => {
    try {
      if (!services) {
        console.log("No services available");
        setError("No services available");
        return;
      }

      if (!selectedService) {
        console.log("No service selected");
        setError("No service selected");
        return;
      }

      if (!selectedMethod) {
        console.log("No method selected");
        setError("No method selected");
        return;
      }

      console.log("Services structure:", Object.keys(services));
      console.log("Selected service:", selectedService);
      console.log("Selected method:", selectedMethod);

      const service = services.services[selectedService];
      if (!service) {
        console.log(`Service ${selectedService} not found in`, services);
        setError(`Service ${selectedService} not found`);
        return;
      }

      console.log(
        "Service methods:",
        service.methods.map((m) => m.name)
      );
      const method = service.methods.find((m) => m.name === selectedMethod);

      if (!method) {
        console.log(
          `Method ${selectedMethod} not found in service ${selectedService}`
        );
        setError(`Method ${selectedMethod} not found`);
        return;
      }

      console.log("Method structure:", method);
      console.log("Request type:", method.requestType);

      const sampleRequest = generateSampleRequest(method);
      console.log("Generated sample request:", sampleRequest);

      if (Object.keys(sampleRequest).length === 0) {
        // For truly empty requests, add a comment to help users understand
        setRequestMessage(JSON.stringify({}));
      } else {
        setRequestMessage(JSON.stringify(sampleRequest, null, 2));
      }

      setResponse(null);
      setError("");
    } catch (err) {
      console.error("Error in regenerateRequest:", err);
      setError(`Error generating request: ${err.message}`);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        gRPC Client
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              label="Server URL"
              variant="outlined"
              fullWidth
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="localhost:50051"
              disabled={loading}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="contained"
              onClick={tryServerReflection}
              disabled={!serverUrl || loading}
              startIcon={
                loading ? <CircularProgress size={20} color="inherit" /> : null
              }
            >
              {loading ? "Loading..." : "Fetch Reflection"}
            </Button>

            <Button
              variant="outlined"
              onClick={selectProtoFile}
              disabled={loading}
            >
              {protoFile ? "Change Proto File" : "Select Proto File"}
            </Button>

            {protoFile && (
              <>
                <Chip
                  label={protoFile.path.split("/").pop()}
                  onDelete={() => setProtoFile(null)}
                />
                <Button
                  variant="contained"
                  onClick={() => loadServices()}
                  disabled={!serverUrl || !protoFile || loading}
                >
                  Load Services
                </Button>
              </>
            )}
          </Box>
        </Box>

        {reflectionFailed && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "#fff4e5", borderRadius: 1 }}>
            <Typography>
              Server reflection not available. Please select a proto file and
              load services.
            </Typography>
          </Box>
        )}
      </Paper>

      {services && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Available Services
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Service</InputLabel>
            <Select
              value={selectedService}
              onChange={handleServiceChange}
              label="Select Service"
            >
              {Object.entries(services.services).map(([key, service]) => (
                <MenuItem key={key} value={key}>
                  {service.name} ({service.package})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedService && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Method</InputLabel>
              <Select
                value={selectedMethod}
                onChange={handleMethodChange}
                label="Select Method"
              >
                {services.services[selectedService].methods.map((method) => (
                  <MenuItem key={method.name} value={method.name}>
                    {method.name}
                    <Chip
                      label={method.type}
                      size="small"
                      sx={{ ml: 1 }}
                      color={getMethodColor(method.type)}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {selectedMethod && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Request Message
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={regenerateRequest}
                      size="small"
                    >
                      Regenerate Sample Request
                    </Button>
                  </Box>
                  <TextareaAutosize
                    minRows={10}
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontFamily: "monospace",
                      fontSize: "14px",
                    }}
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={callMethod}
                    disabled={calling}
                    startIcon={
                      calling && <CircularProgress size={20} color="inherit" />
                    }
                  >
                    {calling ? "Calling..." : "Send Request"}
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Response
                  </Typography>
                  {calling ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 3 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : response ? (
                    <Box
                      sx={{
                        backgroundColor: "#2b2b2b",
                        borderRadius: 1,
                        p: 2,
                        minHeight: "200px",
                        maxHeight: "500px",
                        overflow: "auto",
                      }}
                    >
                      <ReactJson
                        src={response}
                        theme="monokai"
                        displayDataTypes={false}
                        enableClipboard={true}
                        style={{
                          fontFamily: "monospace",
                          fontSize: "14px",
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      Response will appear here after sending the request
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Show proto file content if available */}
          {protoFile && protoFile.content && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Proto File Content
              </Typography>
              <TextareaAutosize
                minRows={10}
                style={{
                  width: "100%",
                  padding: "8px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  backgroundColor: "#f5f5f5",
                }}
                value={protoFile.content}
                readOnly
              />
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
};

// Helper function to get chip color based on method type
const getMethodColor = (type) => {
  switch (type) {
    case "Unary":
      return "primary";
    case "Client Streaming":
      return "secondary";
    case "Server Streaming":
      return "success";
    case "Bidirectional Streaming":
      return "warning";
    default:
      return "default";
  }
};

export default App;
