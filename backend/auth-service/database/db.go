package database

import (
	"fmt"
	"log"
	"auth-service/models"
	"auth-service/utils"

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
		db, err = gorm.Open(sqlite.Open("auth.db"), &gorm.Config{})
	}
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = db.AutoMigrate(&models.User{}, &models.UserProfile{}, &models.MentorProfile{}, &models.Booking{}, &models.BookingHistoryLog{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	DB = db
	log.Println("Database connected and migrated successfully.")

	seedDefaultAdmin()
	seedDefaultMentors()
}

func seedDefaultAdmin() {
	var count int64
	DB.Model(&models.User{}).Where("role = ?", "admin").Count(&count)
	if count == 0 {
		password := os.Getenv("DEFAULT_ADMIN_PASSWORD")
		if password == "" {
			password = "Admin123!@#"
		}
		hash, _ := utils.HashPassword(password)
		admin := models.User{
			ID:             "00000000-0000-0000-0000-000000000001",
			Email:          "admin@pathsync.ai",
			PasswordHash:   hash,
			FullName:       "PathSync Super Admin",
			Role:           "admin",
			IsVerified:     true,
			IsActive:       true,
			OnboardingDone: true,
		}
		DB.Create(&admin)
		log.Println("[Admin Seed] Default admin created: admin@pathsync.ai — set DEFAULT_ADMIN_PASSWORD env var to override the seeded password, and change it after first login.")
	}
}

func seedDefaultMentors() {
	var count int64
	DB.Model(&models.User{}).Where("role = ?", "mentor").Count(&count)
	if count == 0 {
		hash, _ := utils.HashPassword("Mentor123!@#")
		mentors := []struct {
			Email       string
			Name        string
			University  string
			Scholarship string
			Rate        int
			Bio         string
		}{
			{"mentor.anh@pathsync.ai", "Nguyễn Minh Anh", "Harvard University", "Harvard Presidential Fellowship", 150000, "Cựu sinh viên Harvard Thạc sĩ Khoa học Máy tính. Hỗ trợ định hướng và chữa luận học bổng Mỹ."},
			{"mentor.nam@pathsync.ai", "Trần Đức Nam", "MIT", "MIT Merit Scholarship", 140000, "Học sinh xuất sắc MIT ngành AI & Robotics. Chuyên tư vấn hồ sơ STEM và phỏng vấn giả lập."},
			{"mentor.yen@pathsync.ai", "Lê Hoàng Yến", "National University of Singapore", "ASEAN Undergraduate Scholarship", 120000, "Cựu du học sinh NUS Singapore. Hỗ trợ săn học bổng toàn phần khu vực Châu Á & Singapore."},
		}

		for idx, m := range mentors {
			userID := fmt.Sprintf("11111111-0000-0000-0000-00000000000%d", idx+1)
			u := models.User{
				ID:             userID,
				Email:          m.Email,
				PasswordHash:   hash,
				FullName:       m.Name,
				Role:           "mentor",
				IsVerified:     true,
				IsActive:       true,
				OnboardingDone: true,
			}
			DB.Create(&u)

			mp := models.MentorProfile{
				ID:                 fmt.Sprintf("22222222-0000-0000-0000-00000000000%d", idx+1),
				UserID:             userID,
				University:         m.University,
				Scholarship:        m.Scholarship,
				HourlyRate:         m.Rate,
				Bio:                m.Bio,
				VerificationStatus: "verified",
				Rating:             4.9,
				ReviewsCount:       18 + idx*5,
			}
			DB.Create(&mp)
		}
		log.Println("[Mentor Seed] 3 Default mentors created (mentor.anh@pathsync.ai / Mentor123!@#)")
	}
}
