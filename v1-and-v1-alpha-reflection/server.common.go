package main

import (
  "log"
  "net"

  "google.golang.org/grpc"
)

func serveOn(addr string, register func(*grpc.Server)) {
  lis, err := net.Listen("tcp", addr)
  if err != nil { log.Fatal(err) }
  s := grpc.NewServer()
  register(s)
  log.Printf("listening on %s", addr)
  if err := s.Serve(lis); err != nil { log.Fatal(err) }
}
