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

// resolveSeedPassword requires an explicit password when running against a
// real database (DATABASE_URL set — Render/Supabase). A hardcoded fallback
// here is exactly what let a well-known default admin/mentor password sit
// unchanged in production: anyone who read the (public) source could log in
// as admin. The dev-only fallback only applies to the local SQLite path.
func resolveSeedPassword(envVar, devFallback string) string {
	password := os.Getenv(envVar)
	if password != "" {
		return password
	}
	if os.Getenv("DATABASE_URL") != "" {
		log.Fatalf("[Seed] %s must be set when running against a real database (refusing to seed/keep a known default password)", envVar)
	}
	return devFallback
}

// seedDefaultAdmin creates the admin account if it doesn't exist, and
// resyncs its password to the current DEFAULT_ADMIN_PASSWORD on every
// startup even if it already exists — so rotating that env var and
// redeploying actually invalidates a leaked/default password immediately,
// instead of only affecting a fresh database.
func seedDefaultAdmin() {
	password := resolveSeedPassword("DEFAULT_ADMIN_PASSWORD", "Admin123!@#")
	hash, _ := utils.HashPassword(password)

	var admin models.User
	err := DB.Where("role = ?", "admin").First(&admin).Error
	if err == nil {
		DB.Model(&admin).Update("password_hash", hash)
		return
	}

	admin = models.User{
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
	log.Println("[Admin Seed] Default admin created: admin@pathsync.ai")
}

// seedDefaultMentors mirrors seedDefaultAdmin: creates the 3 demo mentors if
// missing, and always resyncs their password to DEFAULT_MENTOR_PASSWORD.
func seedDefaultMentors() {
	password := resolveSeedPassword("DEFAULT_MENTOR_PASSWORD", "Mentor123!@#")
	hash, _ := utils.HashPassword(password)

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

		var existing models.User
		err := DB.Where("id = ?", userID).First(&existing).Error
		if err == nil {
			DB.Model(&existing).Update("password_hash", hash)
			continue
		}

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
		log.Printf("[Mentor Seed] Default mentor created: %s", m.Email)
	}
}
