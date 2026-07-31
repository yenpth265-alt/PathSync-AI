package database

import (
	"log"
	"application-service/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	db, err := gorm.Open(sqlite.Open("application.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = db.AutoMigrate(&models.Application{}, &models.Subtask{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	DB = db
	log.Println("Database connected and migrated successfully.")
}
