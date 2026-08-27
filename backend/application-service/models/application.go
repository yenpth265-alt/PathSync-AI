package models

import (
	"time"
)

type Application struct {
	ID              string    `gorm:"type:uuid;primaryKey" json:"id"`
	UserID          string    `gorm:"index;not null" json:"user_id"`
	UniversityID    string    `gorm:"index;not null" json:"university_id"`
	UniversityName  string    `json:"university_name"` // Denormalized for convenience
	Country         string    `json:"country"`         // Denormalized for convenience
	Status          string    `gorm:"default:'todo'" json:"status"`
	AppStatus       string    `json:"app_status" gorm:"default:'draft'"`
	ProgramID       string    `json:"program_id" gorm:"default:''"`
	FitScore        int       `json:"fit_score" gorm:"default:0"`
	FitTier         string    `json:"fit_tier" gorm:"default:''"`
	SOPContent      string    `json:"sop_content" gorm:"type:text;default:''"`
	SOPPrompt       string    `json:"sop_prompt" gorm:"type:text;default:''"`
	SOPWordLimit    int       `json:"sop_word_limit" gorm:"default:500"`
	Deadline        string    `json:"deadline"`
	ApplicationType string    `json:"application_type"`
	Notes           string    `json:"notes"`
	AttachmentURL   string    `json:"attachment_url"`
	Subtasks        []Subtask `gorm:"foreignKey:ApplicationID" json:"subtasks"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type Subtask struct {
	ID            string    `gorm:"type:uuid;primaryKey" json:"id"`
	ApplicationID string    `gorm:"index;not null" json:"application_id"`
	Title         string    `gorm:"not null" json:"title"`
	IsCompleted   bool      `gorm:"default:false" json:"is_completed"`
	DueDate       string    `json:"due_date"`
	CreatedAt     time.Time `json:"created_at"`
}
