@echo off
echo =======================================================
echo          PATHSYNC-AI MICROSERVICES LAUNCHER
echo =======================================================
echo.

echo Starting API Gateway (Port 8000)...
start "API Gateway (8000)" cmd /k "cd api-gateway && go run main.go"

echo Starting Auth Service (Port 8001)...
start "Auth Service (8001)" cmd /k "cd auth-service && go run main.go"

echo Starting Application Service (Port 8002)...
start "Application Service (8002)" cmd /k "cd application-service && go run main.go"

echo Starting Document Service (Port 8003)...
start "Document Service (8003)" cmd /k "cd document-service && go run main.go"

echo Starting University Service (Port 8004)...
start "University Service (8004)" cmd /k "cd university-service && go run main.go"

echo Starting AI Service (Port 8005)...
start "AI Service (8005)" cmd /k "cd ai-service && go run main.go"

echo Starting AI Agent Service (Port 8006)...
start "AI Agent Service (8006)" cmd /k "cd ai-agent-service && go run main.go"

echo.
echo All backend services have been started in separate windows!
echo - API Gateway : 8000
echo - Auth        : 8001
echo - Application : 8002
echo - Document    : 8003
echo - University  : 8004
echo - AI Service  : 8005
echo - AI Agent    : 8006
echo.
echo Keep those windows open to view logs and track errors.
echo You can now run your frontend with 'npm run dev'.
pause
