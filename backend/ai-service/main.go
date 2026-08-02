package main

import (
	"log"
	"ai-service/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	routes.SetupRoutes(r)
	log.Println("AI Service starting on port 8005...")
	if err := r.Run(":8005"); err != nil {
		log.Fatalf("Failed to start AI Service: %v", err)
	}
}
