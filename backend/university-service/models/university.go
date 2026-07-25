package models

import (
	"time"
)

type University struct {
	ID             string    `gorm:"type:uuid;primaryKey" json:"id"`
	Name           string    `gorm:"not null" json:"name"`
	Country        string    `gorm:"not null" json:"country"`
	AcceptanceRate float64   `json:"acceptance_rate"`
	TuitionFee     string    `json:"tuition_fee"`
	MatchScore     int       `json:"match_score"` // Used for Smart Match UI
	MatchType      string    `json:"match_type"`  // Reach, Target, Safety
	Description    string    `json:"description"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Scholarship struct {
	ID         string    `gorm:"type:uuid;primaryKey" json:"id"`
	UniName    string    `gorm:"not null" json:"uniName"`
	Location   string    `json:"location"`
	Title      string    `gorm:"not null" json:"title"`
	Funding    string    `json:"funding"`
	Deadline   string    `json:"deadline"`
	Match      string    `json:"match"`
	Color      string    `json:"color"`
	Type       string    `json:"type"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
