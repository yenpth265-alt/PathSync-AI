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

	err = db.AutoMigrate(&models.University{}, &models.Scholarship{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	DB = db
	log.Println("Database connected and migrated successfully.")

	seedData()
	seedScholarships()
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

func seedScholarships() {
	var count int64
	DB.Model(&models.Scholarship{}).Count(&count)
	if count == 0 {
		scholarships := []models.Scholarship{
			{ID: uuid.NewString(), UniName: "Massachusetts Institute of Technology", Location: "Cambridge, MA, USA", Title: "MIT Excellence Scholarship", Funding: "Full Ride", Deadline: "Dec 15, 2026", Match: "95%", Color: "#8b0000", Type: "Scholarship"},
			{ID: uuid.NewString(), UniName: "Stanford University", Location: "Stanford, CA, USA", Title: "Knight-Hennessy Scholars", Funding: "Full Tuition + Stipend", Deadline: "Oct 12, 2026", Match: "92%", Color: "#8c1515", Type: "Scholarship"},
			{ID: uuid.NewString(), UniName: "Harvard University", Location: "Cambridge, MA, USA", Title: "Harvard College Financial Aid", Funding: "100% Need-Based", Deadline: "Jan 1, 2027", Match: "88%", Color: "#a51c30", Type: "Financial Aid"},
			{ID: uuid.NewString(), UniName: "University of Oxford", Location: "Oxford, UK", Title: "Clarendon Fund Scholarships", Funding: "Full Tuition", Deadline: "Jan 20, 2027", Match: "85%", Color: "#002147", Type: "Scholarship"},
			{ID: uuid.NewString(), UniName: "National University of Singapore", Location: "Singapore", Title: "ASEAN Undergraduate Scholarship", Funding: "Tuition + Allowance", Deadline: "Feb 28, 2027", Match: "98%", Color: "#ef7c00", Type: "Scholarship"},
		}

		for _, s := range scholarships {
			DB.Create(&s)
		}
		log.Println("Seeded mocked scholarships data.")
	}
}
