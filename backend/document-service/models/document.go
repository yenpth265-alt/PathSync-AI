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
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
