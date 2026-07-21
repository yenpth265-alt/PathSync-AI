package main

import (
	"log"
	"application-service/database"
	"application-service/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	database.ConnectDB()

	r := gin.Default()
	
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "Application Service is running"})
	})

	routes.SetupRoutes(r)

	log.Println("Application Service starting on port 8002...")
	if err := r.Run(":8002"); err != nil {
		log.Fatalf("Failed to start Application Service: %v", err)
	}
}
