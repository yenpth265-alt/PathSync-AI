#!/bin/bash
echo "Starting PathSync-AI Microservices and Frontend..."

# Kill any existing processes running on our ports (optional, useful for restarts)
# Note: This is a simple script, in production you'd use Docker Compose.

echo "[1/6] Starting API Gateway (Port 8000)..."
cd backend/api-gateway
go run main.go &
sleep 1

echo "[2/6] Starting Auth Service (Port 8001)..."
cd ../auth-service
go run main.go &
sleep 1

echo "[3/6] Starting Application Service (Port 8002)..."
cd ../application-service
go run main.go &
sleep 1

echo "[4/6] Starting Document Service (Port 8003)..."
cd ../document-service
go run main.go &
sleep 1

echo "[5/6] Starting University Service (Port 8004)..."
cd ../university-service
go run main.go &
sleep 1

echo "[6/6] Starting Frontend (React/Vite)..."
cd ../../frontend
npm run dev &

echo "================================================================"
echo "All services are starting up in the background!"
echo "Frontend URL: http://localhost:5173"
echo "API Gateway: http://localhost:8000"
echo ""
echo "To stop all services, press Ctrl+C or close this terminal window."
echo "================================================================"

# Wait for all background processes
wait
