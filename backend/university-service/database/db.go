package database

import (
	"log"

	"university-service/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("university.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(&models.University{}, &models.Program{}, &models.Scholarship{})
	if err != nil {
		log.Fatalf("Failed to auto migrate: %v", err)
	}
}

// SeedData has been removed to enforce 100% REAL data via AI Scraper / Updater

