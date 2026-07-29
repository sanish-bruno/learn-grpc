package main

import (
  "google.golang.org/grpc"
  "google.golang.org/grpc/reflection"
)

func main() {
  // Expose reflection v1alpha only
  serveOn(":50052", func(s *grpc.Server) {
    // Register a simple service first (reflection needs at least one service)
    RegisterEchoService(s)
    // Register only v1 reflection service
    reflection.Register(s)
  })
}
