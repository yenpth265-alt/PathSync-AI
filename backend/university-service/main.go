package main

import (
	"log"
	"net/http"

	"university-service/database"
	"university-service/routes"
	"university-service/updater"

	"github.com/gin-gonic/gin"
)

func main() {
	database.InitDB()

	// Khởi chạy hệ thống tự động cập nhật dữ liệu Realtime API các trường Đại học
	updater.StartRealtimeUpdater()

	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	routes.SetupRoutes(r)

	log.Println("University service running on port 8004")
	if err := r.Run(":8004"); err != nil {
		log.Fatalf("Could not start server: %v\n", err)
	}
}
