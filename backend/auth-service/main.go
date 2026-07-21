package main

import (
	"log"
	"auth-service/database"
	"auth-service/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize Database
	database.ConnectDB()

	r := gin.Default()
	
	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "Auth Service is running"})
	})

	// Setup API Routes
	routes.SetupRoutes(r)

	log.Println("Auth Service starting on port 8001...")
	if err := r.Run(":8001"); err != nil {
		log.Fatalf("Failed to start Auth Service: %v", err)
	}
}
