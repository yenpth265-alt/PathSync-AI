#!/bin/bash

echo ""
echo -e "\e[36m=========================================\e[0m"
echo -e "\e[36m     PathSync-AI - Starting Up...        \e[0m"
echo -e "\e[36m=========================================\e[0m"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "\e[31m[ERROR] Docker is not running! Please start Docker Desktop first.\e[0m"
    read -p "Press Enter to exit"
    exit 1
fi

echo -e "\e[33m[1/2] Building & starting all services...\e[0m"
docker compose up --build -d

echo ""
echo -e "\e[33m[2/2] Waiting for services to be ready...\e[0m"
sleep 5

echo ""
echo -e "\e[32m=========================================\e[0m"
echo -e "\e[32m  ALL SERVICES RUNNING!                  \e[0m"
echo -e "\e[32m=========================================\e[0m"
echo ""
echo -e "\e[37m  Open your browser and go to:\e[0m"
echo ""
echo -e "\e[36m  >>> http://localhost:5173 <<<\e[0m"
echo ""
echo -e "\e[90m  Press Ctrl+C or run 'docker compose down' to stop.\e[0m"
echo ""

# Open browser on Windows (Git Bash) or Mac or Linux
if command -v start > /dev/null 2>&1; then
    start http://localhost:5173
elif command -v open > /dev/null 2>&1; then
    open http://localhost:5173
elif command -v xdg-open > /dev/null 2>&1; then
    xdg-open http://localhost:5173
fi
