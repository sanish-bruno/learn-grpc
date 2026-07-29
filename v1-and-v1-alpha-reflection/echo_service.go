package main

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
)

// RegisterEchoService registers a simple health service with the gRPC server
// This provides a minimal service that reflection can work with
func RegisterEchoService(s *grpc.Server) {
	// Register the health service which is a standard gRPC service
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(s, healthServer)
}
