package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"pathsync-ai-agent-service/database"
	"pathsync-ai-agent-service/handlers"
	"pathsync-ai-agent-service/routes"
)

func main() {
	// Tải file .env từ thư mục gốc
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found or error loading it, using system environment variables")
	}

	// This was never called — database.DB stayed nil for the whole process,
	// so every swarm endpoint (which writes/reads through database.DB)
	// panicked on every call.
	database.InitDB()

	r := gin.Default()

	// Build the LLM client once. A missing credential is not fatal — handlers
	// serve degraded responses instead.
	handlers.InitLLM()

	// API v1 group
	v1 := r.Group("/api/v1")
	routes.RegisterRoutes(v1)

	port := os.Getenv("AI_AGENT_SERVICE_PORT")
	if port == "" {
		port = "8006"
	}

	log.Printf("AI Agent Service running on port %s", port)
	r.Run(":" + port)
}
