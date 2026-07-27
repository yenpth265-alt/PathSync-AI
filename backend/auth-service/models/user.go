package models

import (
	"time"
)

type User struct {
	ID           string    `gorm:"type:uuid;primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	FullName     string    `gorm:"not null" json:"full_name"`
	Role         string    `gorm:"default:'student'" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
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
