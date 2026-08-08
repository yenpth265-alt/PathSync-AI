#!/bin/bash
echo "Building orchestrator..."
go build -o orchestrator main.go

echo "Building services..."
cd auth-service && go build -o auth-service-bin . && cd ..
cd application-service && go build -o application-service-bin . && cd ..
cd document-service && go build -o document-service-bin . && cd ..
cd university-service && go build -o university-service-bin . && cd ..
cd ai-agent-service && go build -o ai-agent-service-bin . && cd ..
cd api-gateway && go build -o api-gateway-bin . && cd ..

echo "Build complete!"
