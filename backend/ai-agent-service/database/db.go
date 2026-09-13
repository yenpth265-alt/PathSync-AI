package database

import (
	"log"
	"time"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

type SwarmSession struct {
	ID                string         `gorm:"primaryKey" json:"id"`
	UserID            string         `json:"user_id"`
	UserPrompt        string         `json:"user_prompt"`
	GPA               float64        `json:"gpa"`
	IELTS             float64        `json:"ielts"`
	Field             string         `json:"field"`
	FinalSynthesis    string         `json:"final_synthesis"`
	RecommendedAction string         `json:"recommended_action"`
	ProgramsJSON      string         `json:"programs_json"`
	CreatedAt         time.Time      `json:"created_at"`
	Logs              []SwarmStepLog `gorm:"foreignKey:SessionID" json:"logs"`
}

type SwarmStepLog struct {
	ID            string    `gorm:"primaryKey" json:"id"`
	SessionID     string    `gorm:"index" json:"session_id"`
	StepIndex     int       `json:"step_index"`
	AgentName     string    `json:"agent_name"`
	RoleTitle     string    `json:"role_title"`
	Status        string    `json:"status"`
	Thought       string    `json:"thought"`
	Output        string    `json:"output"`
	CitationsJSON string    `json:"citations_json"`
	Timestamp     string    `json:"timestamp"`
	CreatedAt     time.Time `json:"created_at"`
}

type AgentMessageHistory struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	UserID    string    `gorm:"index" json:"user_id"`
	SessionID string    `gorm:"index" json:"session_id"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	NodesJSON string    `json:"nodes_json"`
	CreatedAt time.Time `json:"created_at"`
}

// ExtractionMetric records one call to the Action Extractor
// (ExtractActions, handlers/actions.go) so the "3,2 giây/tệp" style claim in
// the pitch can be measured from real usage instead of asserted. One row per
// call; p50/p95/avg are computed on read (handlers/metrics.go) rather than
// maintained incrementally, since extraction volume is low enough that a
// full table scan is cheap.
type ExtractionMetric struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	UserID       string    `gorm:"index" json:"user_id"`
	InputKind    string    `json:"input_kind"` // "pdf_text", "pdf_file", "image"
	FileSize     int       `json:"file_size_bytes"`
	ActionsFound int       `json:"actions_found"`
	AvgConfidence float64  `json:"avg_confidence"`
	LatencyMS    int64     `json:"latency_ms"`
	Success      bool      `json:"success"`
	CreatedAt    time.Time `gorm:"index" json:"created_at"`
}

func InitDB() {
	var err error
	dsn := os.Getenv("DATABASE_URL")

	if dsn != "" {
		DB, err = gorm.Open(postgres.New(postgres.Config{
			DSN:                  dsn,
			PreferSimpleProtocol: true,
		}), &gorm.Config{})
	} else {
		DB, err = gorm.Open(sqlite.Open("pathsync-agent.db"), &gorm.Config{})
	}
	if err != nil {
		log.Fatalf("Failed to connect to agent database: %v", err)
	}

	err = DB.AutoMigrate(&SwarmSession{}, &SwarmStepLog{}, &AgentMessageHistory{}, &ExtractionMetric{})
	if err != nil {
		log.Fatalf("Failed to auto migrate agent database: %v", err)
	}
	log.Println("[Agent DB] SQLite pathsync-agent.db initialized successfully.")
}
