package models

import (
	"time"
)

type Document struct {
	ID        string    `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    string    `gorm:"index;not null" json:"user_id"`
	Title     string    `gorm:"not null" json:"title"`
	DocType   string    `json:"doc_type"` // Personal Statement, CV, LoR
	Status    string    `gorm:"default:'ready'" json:"status"`
	Content   string    `json:"content"`
	FileURL   string    `json:"file_url"`
	FileSize  int64     `json:"file_size"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SOPVersionHistory struct {
	ID             string    `gorm:"type:uuid;primaryKey" json:"id"`
	ApplicationID  string    `gorm:"index;not null" json:"application_id"`
	VersionNumber  int       `json:"version_number"`
	Prompt         string    `json:"prompt"`
	Content        string    `json:"content"`
	Score          int       `json:"score"`
	AIFeedback     string    `json:"ai_feedback"`
	MentorFeedback string    `json:"mentor_feedback"`
	CreatedAt      time.Time `json:"created_at"`
}
