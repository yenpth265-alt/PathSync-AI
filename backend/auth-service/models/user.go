package models

import (
	"time"
)

type User struct {
	ID               string    `gorm:"type:uuid;primaryKey" json:"id"`
	Email            string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash     string    `gorm:"not null" json:"-"`
	FullName         string    `gorm:"not null" json:"full_name"`
	Role             string    `gorm:"default:'student'" json:"role"`
	// Academic Profile
	GPA              float64   `json:"gpa" gorm:"default:0"`
	WorkExperience   int       `json:"work_experience" gorm:"default:0"`
	CurrentMajor     string    `json:"current_major" gorm:"default:''"`
	TargetDegree     string    `json:"target_degree" gorm:"default:''"`
	EducationLevel   string    `json:"education_level" gorm:"default:''"`
	// Test Scores (stored as JSON string)
	TestScores       string    `json:"test_scores" gorm:"default:'[]'"`
	// Preferences
	FieldsOfInterest string    `json:"fields_of_interest" gorm:"default:'[]'"`
	PreferredRegions string    `json:"preferred_regions" gorm:"default:'[]'"`
	BudgetRange      string    `json:"budget_range" gorm:"default:''"`
	IntendedYear     int       `json:"intended_year" gorm:"default:0"`
	IntendedTerm     string    `json:"intended_term" gorm:"default:''"`
	JourneyType      string    `json:"journey_type" gorm:"default:'exploring'"`
	OnboardingDone   bool      `json:"onboarding_done" gorm:"default:false"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type UserProfile struct {
	ID            string    `gorm:"type:uuid;primaryKey" json:"id"`
	UserID        string    `gorm:"uniqueIndex;not null" json:"user_id"`
	GPA           float64   `json:"gpa"`
	IELTS         string    `json:"ielts"`
	SATScore      int       `json:"sat_score"`
	TargetMajor   string    `json:"target_major"`
	TargetCountry string    `json:"target_country"`
	HighSchool    string    `json:"high_school"`
	Budget        string    `json:"budget"`
	Bio           string    `json:"bio"`
	UpdatedAt     time.Time `json:"updated_at"`
}
