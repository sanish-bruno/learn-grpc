#!/bin/bash

# Create generated directory if it doesn't exist
mkdir -p src/generated

# Generate TypeScript code from proto files
protoc \
  --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
  --js_out=import_style=commonjs,binary:./src/generated \
  --ts_out=service=grpc-web:./src/generated \
  ./src/proto/*.proto 