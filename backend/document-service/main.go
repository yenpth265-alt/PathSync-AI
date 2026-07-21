package main

import (
	"log"
	"document-service/database"
	"document-service/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	database.ConnectDB()

	r := gin.Default()
	
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "Document Service is running"})
	})

	routes.SetupRoutes(r)

	log.Println("Document Service starting on port 8003...")
	if err := r.Run(":8003"); err != nil {
		log.Fatalf("Failed to start Document Service: %v", err)
	}
}
