package db

import (
	"log"
	"pathsync-backend/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("pathsync.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected.")

	// Auto Migrate the schemas
	err = DB.AutoMigrate(&models.Application{}, &models.Task{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database migrated successfully.")
	
	seedDatabase()
}

func seedDatabase() {
	var count int64
	DB.Model(&models.Application{}).Count(&count)
	
	// Seed only if empty
	if count == 0 {
		log.Println("Seeding database with mock data...")
		
		app1 := models.Application{
			ColumnID: "todo", University: "University of Melbourne", Location: "AU Australia", 
			Type: "Scholarship Application", Deadline: "Aug 15, 2026", Progress: 0, TotalTasks: 2,
			Subtasks: []models.Task{
				{Title: "Write personal statement (1000 words)", Date: "Jul 10, 2026", Status: "Urgent", Completed: false},
				{Title: "Request two academic references", Date: "Jul 18, 2026", Status: "Soon", Completed: false},
			},
		}
		
		app2 := models.Application{
			ColumnID: "inprogress", University: "Harvard University", Location: "US United States", 
			Type: "Early Action", Deadline: "Nov 1, 2026", Progress: 1, TotalTasks: 2,
			Subtasks: []models.Task{
				{Title: "Submit Common App essay", Date: "Jul 5, 2026", Status: "Urgent", Completed: true},
				{Title: "SAT score submission (target 1550+)", Date: "Jul 8, 2026", Status: "Urgent", Completed: false},
			},
		}
		
		app3 := models.Application{
			ColumnID: "completed", University: "Sciences Po Paris", Location: "FR France", 
			Type: "Exchange Semester", Deadline: "Jun 30, 2026", Progress: 2, TotalTasks: 2,
			Subtasks: []models.Task{
				{Title: "Nomination by home university", Date: "May 1, 2026", Status: "On Track", Completed: true},
				{Title: "Online application form submitted", Date: "Jun 1, 2026", Status: "On Track", Completed: true},
			},
		}
		
		DB.Create(&app1)
		DB.Create(&app2)
		DB.Create(&app3)
		
		log.Println("Database seeded successfully.")
	}
}
