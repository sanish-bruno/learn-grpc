import React, { useState, useEffect, useRef } from "react";
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
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import ReactJson from "react-json-view";
import { faker } from "@faker-js/faker";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
const { ipcRenderer } = require("electron");

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    secondary: {
      main: "#ce93d8",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          "&.Mui-disabled": {
            color: "#666666",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.23)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.4)",
          },
        },
      },
    },
  },
});

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

  // New state for streaming
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamType, setStreamType] = useState(null);
  const [streamId, setStreamId] = useState(null);
  const [streamResponses, setStreamResponses] = useState([]);
  const [isConnectionActive, setIsConnectionActive] = useState(false);

  // Add a ref for auto-scrolling the response container
  const responseContainerRef = useRef(null);

  // Effect to reload services when serverUrl changes if we have a proto file
  useEffect(() => {
    console.log("calling useEffect");
    // Skip the initial render
    const shouldLoadServices = protoFile && !isReflectionMode; // Don't reload for reflection mode

    if (shouldLoadServices) {
      loadServices();
    }
    // We intentionally don't include loadServices in dependencies
    // to avoid infinite loops
  }, [protoFile, isReflectionMode]);

  // Set up stream event listener
  useEffect(() => {
    // Set up listener for stream responses
    const handleStreamResponse = (event, data) => {
      console.log("Stream response received:", data);

      if (data.type === "data") {
        // Add new response to the list
        setStreamResponses((prevResponses) => [
          ...prevResponses,
          {
            timestamp: new Date().toISOString(),
            data: data.data,
          },
        ]);
      } else if (data.type === "end") {
        // Stream ended
        setIsConnectionActive(false);
        console.log("Stream ended");
      } else if (data.type === "error") {
        // Stream error
        setError(`Stream error: ${data.error}`);
        setIsConnectionActive(false);
        console.error("Stream error:", data.error);
      }
    };

    // Add the event listener
    ipcRenderer.on("stream-response", handleStreamResponse);

    // Clean up function to remove the listener
    return () => {
      ipcRenderer.removeListener("stream-response", handleStreamResponse);
    };
  }, []);

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
        await loadServices(result.data);
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
    resetStreamState();
  };

  const handleMethodChange = (event) => {
    const methodName = event.target.value;
    setSelectedMethod(methodName);
    setResponse(null);
    resetStreamState();

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

  // Reset stream state
  const resetStreamState = () => {
    setIsStreaming(false);
    setStreamType(null);
    setStreamId(null);
    setStreamResponses([]);
    setIsConnectionActive(false);
  };

  const callMethod = async () => {
    if (!serverUrl || !selectedService || !selectedMethod) return;

    try {
      setError("");
      setCalling(true);

      // Reset responses if starting a new call
      if (!isStreaming) {
        setResponse(null);
        setStreamResponses([]);
      }

      let requestData;
      try {
        requestData = JSON.parse(requestMessage);
      } catch (err) {
        setError(`Invalid JSON in request: ${err.message}`);
        setCalling(false);
        return;
      }

      // If we're already streaming and it's a client or bidirectional stream,
      // we send a message to the existing stream
      if (
        isStreaming &&
        streamId &&
        (streamType === "CLIENT_STREAMING" || streamType === "BIDI_STREAMING")
      ) {
        const result = await ipcRenderer.invoke("stream-write", {
          streamId,
          data: requestData,
        });

        if (!result.success) {
          setError(`Error sending message to stream: ${result.error}`);
        }

        setCalling(false);
        return;
      }

      // Otherwise, this is a new call
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
        if (result.streaming) {
          // Handle streaming response
          setIsStreaming(true);
          setStreamType(result.streamType);
          setStreamId(result.streamId);
          setIsConnectionActive(true);
          console.log(`Streaming connection established: ${result.streamType}`);
        } else {
          // Handle regular unary response
          setResponse(result.data);
        }
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

  // End the stream connection
  const endStream = async () => {
    if (!streamId) return;

    try {
      setError("");

      const result = await ipcRenderer.invoke("stream-end", { streamId });

      if (result.success) {
        console.log("Stream ended successfully");
      } else {
        setError(`Error ending stream: ${result.error}`);
      }
    } catch (err) {
      setError(`Error ending stream: ${err.message}`);
      console.error("Error:", err);
    }
  };

  // Cancel the stream connection
  const cancelStream = async () => {
    if (!streamId) return;

    try {
      setError("");

      const result = await ipcRenderer.invoke("stream-cancel", { streamId });

      if (result.success) {
        console.log("Stream cancelled successfully");
        setIsConnectionActive(false);
        setStreamId(null);
      } else {
        setError(`Error cancelling stream: ${result.error}`);
      }
    } catch (err) {
      setError(`Error cancelling stream: ${err.message}`);
      console.error("Error:", err);
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

  // Helper function to truncate JSON for accordion headers
  const truncateJson = (jsonData, maxLength = 50) => {
    try {
      const str = JSON.stringify(jsonData);
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength) + "...";
    } catch (err) {
      return "Response data";
    }
  };

  // Auto-scroll to bottom when new responses come in
  useEffect(() => {
    if (
      responseContainerRef.current &&
      isStreaming &&
      streamResponses.length > 0
    ) {
      responseContainerRef.current.scrollTop =
        responseContainerRef.current.scrollHeight;
    }
  }, [streamResponses, isStreaming]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
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
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
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

              {protoFile && !isReflectionMode && (
                <>
                  <Chip
                    label={protoFile.path.split("/").pop()}
                    onDelete={() => setProtoFile(null)}
                  />
                  {loading && (
                    <Typography
                      variant="caption"
                      sx={{ ml: 1, display: "flex", alignItems: "center" }}
                    >
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Loading services...
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>

          {reflectionFailed && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "rgba(255, 152, 0, 0.1)",
                borderRadius: 1,
              }}
            >
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
                        label={formatMethodType(method.type)}
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
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 2,
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={regenerateRequest}
                        size="small"
                      >
                        Regenerate Sample Request
                      </Button>

                      {isStreaming && (
                        <>
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            Stream Type: {streamType}
                          </Typography>
                          {isConnectionActive && (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Connected"
                              color="success"
                              size="small"
                            />
                          )}
                          <IconButton
                            color="error"
                            onClick={cancelStream}
                            disabled={!isConnectionActive}
                            title="Terminate connection"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                    <TextareaAutosize
                      minRows={10}
                      style={{
                        width: "100%",
                        padding: "8px",
                        fontFamily: "monospace",
                        fontSize: "14px",
                        backgroundColor: "#2d2d2d",
                        color: "#e0e0e0",
                        border: "1px solid #555",
                        borderRadius: "4px",
                      }}
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                    />
                    <Box sx={{ display: "flex", mt: 2, gap: 1 }}>
                      {isStreaming &&
                      (streamType === "CLIENT_STREAMING" ||
                        streamType === "BIDI_STREAMING") ? (
                        <>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={callMethod}
                            disabled={calling || !isConnectionActive}
                            startIcon={
                              calling ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <SendIcon />
                              )
                            }
                          >
                            {calling ? "Sending..." : "Send Message"}
                          </Button>
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={endStream}
                            disabled={!isConnectionActive}
                          >
                            End Stream
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
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
                      )}
                    </Box>
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
                    ) : isStreaming ? (
                      // Show streaming responses as accordions
                      <Box
                        ref={responseContainerRef}
                        sx={{
                          backgroundColor: "#1a1a1a",
                          borderRadius: 1,
                          p: 2,
                          minHeight: "200px",
                          maxHeight: "500px",
                          overflow: "auto",
                          scrollBehavior: "smooth",
                        }}
                      >
                        {streamResponses.length > 0 ? (
                          <Box sx={{ width: "100%" }}>
                            {streamResponses.map((resp, index) => (
                              <Accordion
                                key={index}
                                sx={{
                                  backgroundColor: "rgba(255,255,255,0.03)",
                                  color: "rgba(255,255,255,0.9)",
                                  mb: 1,
                                  "&:before": {
                                    display: "none",
                                  },
                                  "&.Mui-expanded": {
                                    margin: "0 0 8px 0",
                                  },
                                }}
                              >
                                <AccordionSummary
                                  expandIcon={
                                    <ExpandMoreIcon
                                      sx={{ color: "rgba(255,255,255,0.7)" }}
                                    />
                                  }
                                  aria-controls={`panel${index}-content`}
                                  id={`panel${index}-header`}
                                  sx={{
                                    borderBottom:
                                      "1px solid rgba(255,255,255,0.1)",
                                    minHeight: "48px",
                                    "&.Mui-expanded": {
                                      minHeight: "48px",
                                    },
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                    sx={{ width: "100%" }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "rgba(255,255,255,0.6)" }}
                                    >
                                      {new Date(
                                        resp.timestamp
                                      ).toLocaleTimeString()}
                                    </Typography>
                                    <Typography
                                      noWrap
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "14px",
                                        flexGrow: 1,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {truncateJson(resp.data)}
                                    </Typography>
                                  </Stack>
                                </AccordionSummary>
                                <AccordionDetails
                                  sx={{
                                    p: 1,
                                    backgroundColor: "rgba(0,0,0,0.4)",
                                  }}
                                >
                                  <ReactJson
                                    src={resp.data}
                                    theme="monokai"
                                    displayDataTypes={false}
                                    enableClipboard={true}
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: "14px",
                                    }}
                                  />
                                </AccordionDetails>
                              </Accordion>
                            ))}
                          </Box>
                        ) : (
                          <Typography
                            color="rgba(255,255,255,0.7)"
                            sx={{ p: 2 }}
                          >
                            Waiting for streaming responses...
                          </Typography>
                        )}
                      </Box>
                    ) : response ? (
                      // Show unary response
                      <Box
                        sx={{
                          backgroundColor: "#1a1a1a",
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
                    backgroundColor: "#2d2d2d",
                    color: "#e0e0e0",
                    border: "1px solid #555",
                    borderRadius: "4px",
                  }}
                  value={protoFile.content}
                  readOnly
                />
              </Box>
            )}
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  );
};

// Helper function to get chip color based on method type
const getMethodColor = (type) => {
  console.log("getMethodColor", type);
  switch (type) {
    case "UNARY":
      return "primary";
    case "CLIENT_STREAMING":
      return "secondary";
    case "SERVER_STREAMING":
      return "success";
    case "BIDI_STREAMING":
      return "warning";
    default:
      return "default";
  }
};

// Helper function to format method types for display
const formatMethodType = (type) => {
  switch (type) {
    case "UNARY":
      return "Unary";
    case "CLIENT_STREAMING":
      return "Client Streaming";
    case "SERVER_STREAMING":
      return "Server Streaming";
    case "BIDI_STREAMING":
      return "Bidirectional Streaming";
    default:
      return type;
  }
};

export default App;
