package database

import (
	"log"
	"auth-service/models"
	"auth-service/utils"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	db, err := gorm.Open(sqlite.Open("auth.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = db.AutoMigrate(&models.User{}, &models.UserProfile{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	DB = db
	log.Println("Database connected and migrated successfully.")

	seedDefaultAdmin()
}

func seedDefaultAdmin() {
	var count int64
	DB.Model(&models.User{}).Where("role = ?", "admin").Count(&count)
	if count == 0 {
		hash, _ := utils.HashPassword("Admin123!@#")
		adminUser := models.User{
			ID:             "admin-0000-0000-0000-000000000001",
			Email:          "admin@pathsync.ai",
			PasswordHash:   hash,
			FullName:       "PathSync Super Admin",
			Role:           "admin",
			IsVerified:     true,
			IsActive:       true,
			OnboardingDone: true,
		}
		DB.Create(&adminUser)
		log.Println("[Admin Seed] Default admin created: admin@pathsync.ai / Admin123!@#")
	}
}
