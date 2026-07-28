package main

import (
	"log"
	"net/http"
	"ai-service/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.Use(corsMiddleware())
	routes.SetupRoutes(r)
	log.Println("AI Service starting on port 8005...")
	if err := r.Run(":8005"); err != nil {
		log.Fatalf("Failed to start AI Service: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
