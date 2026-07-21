package database

import (
	"log"
	"university-service/models"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	db, err := gorm.Open(sqlite.Open("university.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = db.AutoMigrate(&models.University{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	DB = db
	log.Println("Database connected and migrated successfully.")

	seedData()
}

func seedData() {
	var count int64
	DB.Model(&models.University{}).Count(&count)
	if count == 0 {
		universities := []models.University{
			{
				ID: uuid.NewString(), Name: "Harvard University", Country: "United States", AcceptanceRate: 4.0, TuitionFee: "$54,000", MatchScore: 65, MatchType: "Reach", Description: "Ivy League research university in Cambridge, Massachusetts.",
			},
			{
				ID: uuid.NewString(), Name: "University of Melbourne", Country: "Australia", AcceptanceRate: 70.0, TuitionFee: "AUD 45,000", MatchScore: 92, MatchType: "Safety", Description: "Public research university located in Melbourne.",
			},
			{
				ID: uuid.NewString(), Name: "Sciences Po Paris", Country: "France", AcceptanceRate: 20.0, TuitionFee: "€14,000", MatchScore: 85, MatchType: "Target", Description: "International research university in France.",
			},
			{
				ID: uuid.NewString(), Name: "Stanford University", Country: "United States", AcceptanceRate: 3.9, TuitionFee: "$56,000", MatchScore: 60, MatchType: "Reach", Description: "Private research university in Stanford, California.",
			},
		}

		for _, u := range universities {
			DB.Create(&u)
		}
		log.Println("Seeded mocked universities data.")
	}
}
