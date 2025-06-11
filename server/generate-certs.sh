#!/bin/bash

# Create certificates directory
mkdir -p certs

# Generate CA private key and certificate
openssl genrsa -out certs/ca.key 2048
openssl req -new -x509 -days 365 -key certs/ca.key -out certs/ca.crt -subj "/CN=localhost"

# Generate server private key and CSR
openssl genrsa -out certs/server.key 2048
openssl req -new -key certs/server.key -out certs/server.csr -subj "/CN=localhost"

# Sign server certificate with CA
openssl x509 -req -days 365 -in certs/server.csr -CA certs/ca.crt -CAkey certs/ca.key -CAcreateserial -out certs/server.crt

# Generate client private key and CSR
openssl genrsa -out certs/client.key 2048
openssl req -new -key certs/client.key -out certs/client.csr -subj "/CN=client"

# Sign client certificate with CA
openssl x509 -req -days 365 -in certs/client.csr -CA certs/ca.crt -CAkey certs/ca.key -CAcreateserial -out certs/client.crt

# Create combined certificate files
cat certs/server.crt certs/server.key > certs/server.pem
cat certs/client.crt certs/client.key > certs/client.pem

echo "Certificates generated successfully in the 'certs' directory" 