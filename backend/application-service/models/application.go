package models

import (
	"time"
)

type Application struct {
	ID              string    `gorm:"type:uuid;primaryKey" json:"id"`
	UserID          string    `gorm:"index;not null" json:"user_id"`
	UniversityID    string    `gorm:"index;not null" json:"university_id"`
	UniversityName  string    `json:"university_name"` // Denormalized for convenience
	Status          string    `gorm:"default:'todo'" json:"status"`
	Deadline        string    `json:"deadline"`
	ApplicationType string    `json:"application_type"`
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
