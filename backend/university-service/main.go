package main

import (
	"log"
	"university-service/database"
	"university-service/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	database.ConnectDB()

	r := gin.Default()
	
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "University Service is running"})
	})

	routes.SetupRoutes(r)

	log.Println("University Service starting on port 8004...")
	if err := r.Run(":8004"); err != nil {
		log.Fatalf("Failed to start University Service: %v", err)
	}
}
