package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID               string    `gorm:"type:uuid;primaryKey" json:"id"`
	Email            string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash     string    `gorm:"not null" json:"-"`
	FullName         string    `gorm:"not null" json:"full_name"`
	Role             string    `gorm:"default:'student'" json:"role"`
	IsVerified       bool      `gorm:"default:false" json:"is_verified"`
	IsActive         bool      `gorm:"default:true" json:"is_active"`
	OTPCode          string    `gorm:"default:''" json:"-"`
	OTPExpiresAt     time.Time `json:"-"`
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
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	// Soft delete: DeleteUser used to permanently erase the row with no
	// recycle bin — a single compromised admin session was enough to wipe
	// every real account with no way back. GORM turns Delete()/Find() into
	// UPDATE deleted_at / WHERE deleted_at IS NULL automatically once this
	// field exists, so "deleted" rows are recoverable from within the app.
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
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

type MentorProfile struct {
	ID                 string    `gorm:"type:uuid;primaryKey" json:"id"`
	UserID             string    `gorm:"uniqueIndex;not null" json:"user_id"`
	User               User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	University         string    `json:"university"`
	Scholarship        string    `json:"scholarship"`
	HourlyRate         int       `json:"hourly_rate" gorm:"default:120000"`
	Bio                string    `json:"bio"`
	VerificationStatus string    `json:"verification_status" gorm:"default:'verified'"`
	Rating             float64   `json:"rating" gorm:"default:5.0"`
	ReviewsCount       int       `json:"reviews_count" gorm:"default:12"`
	CalendarSlots      string    `json:"calendar_slots" gorm:"default:'[\"T2 19:00\", \"T4 20:00\", \"T6 18:30\", \"CN 10:00\"]'"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type Booking struct {
	ID               string    `gorm:"type:uuid;primaryKey" json:"id"`
	MenteeID         string    `json:"mentee_id"`
	MenteeName       string    `json:"mentee_name"`
	MentorID         string    `json:"mentor_id"`
	MentorName       string    `json:"mentor_name"`
	University       string    `json:"university"`
	SlotTime         string    `json:"slot_time"`
	Status           string    `json:"status" gorm:"default:'pending'"` // 'pending', 'confirmed', 'completed', 'cancelled'
	EssayDraft       string    `json:"essay_draft"`
	AiPreFeedback    string    `json:"ai_pre_feedback"`
	MentorFeedback   string    `json:"mentor_feedback"`
	Price            int       `json:"price" gorm:"default:120000"`
	StudentGPA       float64   `json:"student_gpa"`
	StudentIELTS     string    `json:"student_ielts"`
	TargetUniversity string    `json:"target_university" gorm:"default:''"`
	TargetMajor      string    `json:"target_major" gorm:"default:''"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type BookingHistoryLog struct {
	ID        string    `gorm:"type:uuid;primaryKey" json:"id"`
	BookingID string    `gorm:"index;not null" json:"booking_id"`
	OldStatus string    `json:"old_status"`
	NewStatus string    `json:"new_status"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`
}
