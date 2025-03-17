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

  const generateSampleValue = (field) => {
    // Handle message types
    if (field.type === "TYPE_MESSAGE") {
      return {}; // Will be handled by generateMessageObject
    }

    // Handle basic types
    switch (field.type) {
      case "TYPE_STRING":
        if (field.name.toLowerCase().includes("id")) return faker.string.uuid();
        if (field.name.toLowerCase().includes("name"))
          return faker.commerce.productName();
        if (field.name.toLowerCase().includes("description"))
          return faker.commerce.productDescription();
        if (field.name.toLowerCase().includes("timestamp"))
          return new Date().toISOString();
        return faker.lorem.sentence();

      case "TYPE_INT32":
      case "TYPE_INT64":
        if (field.name.toLowerCase().includes("id"))
          return faker.number.int({ min: 1, max: 1000 });
        if (field.name.toLowerCase().includes("price"))
          return faker.number.int({ min: 1, max: 1000 });
        return faker.number.int({ min: 0, max: 100 });

      case "TYPE_FLOAT":
      case "TYPE_DOUBLE":
        if (field.name.toLowerCase().includes("price"))
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

      default:
        return null;
    }
  };

  const generateSampleRequest = (method) => {
    if (!method || !method.requestType) return {};

    const generateMessageObject = (messageType) => {
      const result = {};

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
            result[fieldName] = generateMessageObject({ type: { field: [] } }); // Empty message for now
          } else {
            result[fieldName] = generateSampleValue(field);
          }
        });
      }

      return result;
    };

    return generateMessageObject(method.requestType);
  };

  const selectProtoFile = async () => {
    try {
      const result = await ipcRenderer.invoke("select-proto-file");
      if (result.success) {
        setProtoFile(result.data);
        setServices(null);
        setSelectedMethod("");
        setSelectedService("");
        setRequestMessage("");
      } else {
        setError("Failed to load proto file");
      }
    } catch (err) {
      setError(`Error loading proto file: ${err.message}`);
      console.error("Error:", err);
    }
  };

  const loadServices = async () => {
    if (!protoFile || !serverUrl) return;

    try {
      setError("");
      setServices(null);
      setLoading(true);

      const result = await ipcRenderer.invoke("load-services", {
        protoPath: protoFile.path,
        serverUrl,
      });

      if (result.success) {
        setServices(result.data);
        setSelectedMethod("");
        setSelectedService("");
        setRequestMessage("");
      } else {
        setError(`Error loading services: ${result.error}`);
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

    if (services && selectedService) {
      const service = services.services[selectedService];
      const method = service.methods.find((m) => m.name === methodName);
      if (method) {
        const sampleRequest = generateSampleRequest(method);
        setRequestMessage(JSON.stringify(sampleRequest, null, 2));
      }
    }
  };

  const callMethod = async () => {
    if (!selectedService || !selectedMethod || !requestMessage) return;

    try {
      setCalling(true);
      setError("");
      setResponse(null);

      const result = await ipcRenderer.invoke("call-method", {
        serverUrl,
        serviceName: selectedService,
        methodName: selectedMethod,
        request: requestMessage,
      });

      if (result.success) {
        setResponse(result.data);
      } else {
        setError(`Error calling method: ${result.error}`);
      }
    } catch (err) {
      setError(`Error calling method: ${err.message}`);
      console.error("Error:", err);
    } finally {
      setCalling(false);
    }
  };

  const regenerateRequest = () => {
    if (services && selectedService && selectedMethod) {
      const service = services.services[selectedService];
      const method = service.methods.find((m) => m.name === selectedMethod);
      if (method) {
        const sampleRequest = generateSampleRequest(method);
        setRequestMessage(JSON.stringify(sampleRequest, null, 2));
        setResponse(null);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          gRPC Client
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                onClick={selectProtoFile}
                color="secondary"
              >
                Select Proto File
              </Button>
              {protoFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Loaded: {protoFile.path}
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="gRPC Server URL"
              variant="outlined"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="localhost:50051"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={loadServices}
              disabled={!serverUrl || !protoFile || loading}
            >
              {loading ? "Loading..." : "Load Services"}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {services && (
          <Box>
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
                        calling && (
                          <CircularProgress size={20} color="inherit" />
                        )
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
                value={services.protoContent}
                readOnly
              />
            </Box>
          </Box>
        )}
      </Paper>
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
