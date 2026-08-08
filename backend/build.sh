#!/bin/bash
set -e

echo "Building orchestrator..."
go mod tidy
go build -o orchestrator main.go

echo "Building services..."
for svc in auth-service application-service document-service university-service ai-agent-service api-gateway; do
    echo "--> Building $svc..."
    (cd $svc && go mod tidy && go build -o ${svc}-bin .)
done

echo "Build complete!"
