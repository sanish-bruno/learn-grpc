#!/bin/bash

# Create directories if they don't exist
mkdir -p generated

# Generate JavaScript code
protoc \
  --js_out=import_style=commonjs,binary:./generated \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:./generated \
  -I=server/multi-proto \
  server/multi-proto/*.proto

echo "Proto files generated successfully!" 