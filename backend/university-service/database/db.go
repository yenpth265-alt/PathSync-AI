package database

import (
	"log"
	"time"

	"university-service/models"

	"github.com/google/uuid"
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

	SeedData()
}

func SeedData() {
	var count int64
	DB.Model(&models.University{}).Count(&count)
	if count > 0 {
		return // Already seeded
	}

	unis := []models.University{
		{ID: uuid.NewString(), Name: "Harvard University", Country: "USA", Region: "northAmerica", WorldRanking: 1, AcceptanceRate: 3.7, Type: "private", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "MIT", Country: "USA", Region: "northAmerica", WorldRanking: 2, AcceptanceRate: 4.0, Type: "private", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "Stanford University", Country: "USA", Region: "northAmerica", WorldRanking: 3, AcceptanceRate: 4.3, Type: "private", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "University of Cambridge", Country: "UK", Region: "westernEurope", WorldRanking: 5, AcceptanceRate: 21.0, Type: "public", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "University of Oxford", Country: "UK", Region: "westernEurope", WorldRanking: 4, AcceptanceRate: 17.5, Type: "public", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "ETH Zurich", Country: "Switzerland", Region: "centralEurope", WorldRanking: 7, AcceptanceRate: 27.0, Type: "public", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "National University of Singapore", Country: "Singapore", Region: "southeastAsia", WorldRanking: 8, AcceptanceRate: 17.0, Type: "public", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "University of Toronto", Country: "Canada", Region: "northAmerica", WorldRanking: 21, AcceptanceRate: 43.0, Type: "public", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "Imperial College London", Country: "UK", Region: "westernEurope", WorldRanking: 6, AcceptanceRate: 14.0, Type: "public", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "University of Melbourne", Country: "Australia", Region: "oceania", WorldRanking: 33, AcceptanceRate: 70.0, Type: "public", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "Technical University of Munich", Country: "Germany", Region: "centralEurope", WorldRanking: 37, AcceptanceRate: 8.0, Type: "public", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "Yale University", Country: "USA", Region: "northAmerica", WorldRanking: 12, AcceptanceRate: 4.7, Type: "private", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "University of British Columbia", Country: "Canada", Region: "northAmerica", WorldRanking: 46, AcceptanceRate: 52.0, Type: "public", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "Seoul National University", Country: "South Korea", Region: "eastAsia", WorldRanking: 41, AcceptanceRate: 16.0, Type: "public", CreatedAt: time.Now()},
		{ID: uuid.NewString(), Name: "University of Sydney", Country: "Australia", Region: "oceania", WorldRanking: 41, AcceptanceRate: 30.0, Type: "public", CreatedAt: time.Now()},
	}

	for i := range unis {
		DB.Create(&unis[i])
	}

	// Seed Programs
	programs := []models.Program{
		{ID: uuid.NewString(), UniversityID: unis[0].ID, Name: "Computer Science MS", Degree: "master", TuitionPerYear: 54000, MinGPA: 3.7, MinIELTS: 7.0, Deadline: "2025-12-01", CreatedAt: time.Now()},
		{ID: uuid.NewString(), UniversityID: unis[0].ID, Name: "Business Administration MBA", Degree: "mba", TuitionPerYear: 73000, MinGPA: 3.5, WorkExpRequired: 3, CreatedAt: time.Now()},
		{ID: uuid.NewString(), UniversityID: unis[1].ID, Name: "Computer Science PhD", Degree: "phd", TuitionPerYear: 0, MinGPA: 3.8, Deadline: "2025-12-15", CreatedAt: time.Now()},
		{ID: uuid.NewString(), UniversityID: unis[2].ID, Name: "Artificial Intelligence MS", Degree: "master", TuitionPerYear: 60000, MinGPA: 3.7, CreatedAt: time.Now()},
		{ID: uuid.NewString(), UniversityID: unis[3].ID, Name: "Master of Engineering", Degree: "master", TuitionPerYear: 35000, MinGPA: 3.7, MinIELTS: 7.5, CreatedAt: time.Now()},
		{ID: uuid.NewString(), UniversityID: unis[6].ID, Name: "Computer Science MS", Degree: "master", TuitionPerYear: 18000, MinGPA: 3.3, MinIELTS: 6.5, CreatedAt: time.Now()},
		{ID: uuid.NewString(), UniversityID: unis[10].ID, Name: "Data Engineering MS", Degree: "master", TuitionPerYear: 3000, MinGPA: 3.3, MinIELTS: 6.5, CreatedAt: time.Now()},
	}
	for i := range programs {
		DB.Create(&programs[i])
	}

	// Seed Scholarships
	scholarships := []models.Scholarship{
		{ID: uuid.NewString(), UniversityID: unis[0].ID, Name: "Harvard Financial Aid", Coverage: "partial", CreatedAt: time.Now()},
		{ID: uuid.NewString(), UniversityID: unis[3].ID, Name: "Gates Cambridge Scholarship", Coverage: "full", CreatedAt: time.Now()},
		{ID: uuid.NewString(), UniversityID: unis[10].ID, Name: "DAAD", Coverage: "full", CreatedAt: time.Now()},
		{ID: uuid.NewString(), UniversityID: unis[6].ID, Name: "Singapore International Graduate Award", Coverage: "full", CreatedAt: time.Now()},
	}
	for i := range scholarships {
		DB.Create(&scholarships[i])
	}
}
