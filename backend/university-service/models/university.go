package models

import (
	"time"
)

type University struct {
	ID             string    `json:"id" gorm:"primaryKey"`
	Name           string    `json:"name"`
	Country        string    `json:"country"`
	Region         string    `json:"region"`
	WorldRanking   int       `json:"world_ranking"`
	AcceptanceRate float64   `json:"acceptance_rate"`
	Type           string    `json:"type"`
	LogoURL        string    `json:"logo_url"`
	Website        string    `json:"website"`
	Description    string    `json:"description"`
	SourceURL      string    `json:"source_url"`
	SourceLabel    string    `json:"source_label"`
	SourceType     string    `json:"source_type"`
	LastVerifiedAt time.Time `json:"last_verified_at"`
	CreatedAt      time.Time `json:"created_at"`
}

type Program struct {
	ID              string     `json:"id" gorm:"primaryKey"`
	UniversityID    string     `json:"university_id"`
	University      University `json:"university" gorm:"foreignKey:UniversityID"`
	Name            string     `json:"name"`
	Degree          string     `json:"degree"`
	Duration        string     `json:"duration"`
	Language        string     `json:"language" gorm:"default:'English'"`
	TuitionPerYear  float64    `json:"tuition_per_year"`
	ApplicationFee  float64    `json:"application_fee"`
	MinGPA          float64    `json:"min_gpa"`
	MinIELTS        float64    `json:"min_ielts"`
	MinTOEFL        int        `json:"min_toefl"`
	WorkExpRequired int        `json:"work_exp_required"`
	Deadline        string     `json:"deadline"`
	HasScholarship  bool       `json:"has_scholarship"`
	Fields          string     `json:"fields"`
	ProgramURL      string     `json:"program_url"`
	SourceURL       string     `json:"source_url"`
	SourceLabel     string     `json:"source_label"`
	LastVerifiedAt  time.Time  `json:"last_verified_at"`
	CreatedAt       time.Time  `json:"created_at"`
}

type Scholarship struct {
	ID                    string     `json:"id" gorm:"primaryKey"`
	UniversityID          string     `json:"university_id"`
	University            University `json:"university" gorm:"foreignKey:UniversityID"`
	Name                  string     `json:"name"`
	Coverage              string     `json:"coverage"`
	AmountPerYear         float64    `json:"amount_per_year"`
	EligibleDegrees       string     `json:"eligible_degrees"`
	EligibleFields        string     `json:"eligible_fields"`
	EligibleNationalities string     `json:"eligible_nationalities"`
	Deadline              string     `json:"deadline"`
	Requirements          string     `json:"requirements"`
	HasLivingStipend      bool       `json:"has_living_stipend"`
	HasTravelAllowance    bool       `json:"has_travel_allowance"`
	HasHealthInsurance    bool       `json:"has_health_insurance"`
	ScholarshipURL        string     `json:"scholarship_url"`
	SourceURL             string     `json:"source_url"`
	SourceLabel           string     `json:"source_label"`
	LastVerifiedAt        time.Time  `json:"last_verified_at"`
	CreatedAt             time.Time  `json:"created_at"`
}
