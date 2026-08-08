package database

import (
	"log"
	"document-service/models"

	"os"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := os.Getenv("DATABASE_URL")
	var db *gorm.DB
	var err error

	if dsn != "" {
		db, err = gorm.Open(postgres.New(postgres.Config{
			DSN:                  dsn,
			PreferSimpleProtocol: true,
		}), &gorm.Config{})
	} else {
		db, err = gorm.Open(sqlite.Open("document.db"), &gorm.Config{})
	}
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = db.AutoMigrate(&models.Document{}, &models.SOPVersionHistory{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	DB = db
	log.Println("Database connected and migrated successfully.")
}
