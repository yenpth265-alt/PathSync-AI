package main

import (
	"log"

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



	routes.SetupRoutes(r)

	log.Println("University service running on port 8004")
	if err := r.Run(":8004"); err != nil {
		log.Fatalf("Could not start server: %v\n", err)
	}
}
