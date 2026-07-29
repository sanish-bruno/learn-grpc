package main

import (
  "google.golang.org/grpc"
  "google.golang.org/grpc/reflection"
)

func main() {
  // v1 ONLY
  serveOn(":50051", func(s *grpc.Server) {
    // Register a simple service first (reflection needs at least one service)
    RegisterEchoService(s)
    // Register only v1 reflection service
    reflection.RegisterV1(s)
  })
}
