package models

import (
	"time"

	"gorm.io/gorm"
)

type Application struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	ColumnID   string         `json:"column"` // "todo", "inprogress", "completed"
	University string         `json:"university"`
	Location   string         `json:"location"`
	Type       string         `json:"type"`
	Deadline   string         `json:"deadline"`
	Progress   int            `json:"progress"`
	TotalTasks int            `json:"totalTasks"`
	Subtasks   []Task         `gorm:"foreignKey:ApplicationID" json:"subtasks"`
}

type Task struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	ApplicationID uint           `json:"application_id"`
	Title         string         `json:"title"`
	Date          string         `json:"date"`
	Status        string         `json:"status"` // "Urgent", "Soon", "On Track"
	Completed     bool           `json:"completed"`
}
