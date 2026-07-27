package handlers

import (
	"fmt"
	"net/http"
	"university-service/database"
	"university-service/models"

	"github.com/gin-gonic/gin"
)

func GetUniversities(c *gin.Context) {
	var universities []models.University
	
	// simple search by name if provided
	search := c.Query("search")
	if search != "" {
		database.DB.Where("name LIKE ?", "%"+search+"%").Find(&universities)
	} else {
		database.DB.Find(&universities)
	}

	c.JSON(http.StatusOK, gin.H{"data": universities})
}

func GetScholarships(c *gin.Context) {
	var scholarships []models.Scholarship
	
	search := c.Query("search")
	if search != "" {
		database.DB.Where("title LIKE ? OR uni_name LIKE ?", "%"+search+"%", "%"+search+"%").Find(&scholarships)
	} else {
		database.DB.Find(&scholarships)
	}

	c.JSON(http.StatusOK, gin.H{"data": scholarships})
}

type SmartMatchInput struct {
	GPA      float64 `json:"gpa"`
	IELTS    string  `json:"ielts"`
	Major    string  `json:"major"`
	Location string  `json:"location"`
}

type SmartMatchResult struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Country    string `json:"country"`
	MatchScore int    `json:"match_score"`
	Match      string `json:"match"`
	MatchType  string `json:"type"`
	TuitionFee string `json:"tuition_fee"`
}

func SmartMatch(c *gin.Context) {
	var input SmartMatchInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var universities []models.University
	database.DB.Find(&universities)

	var results []SmartMatchResult

	for _, u := range universities {
		score := u.MatchScore
		matchType := u.MatchType

		// Dynamically adjust score based on GPA
		if input.GPA > 0 {
			if input.GPA >= 3.8 {
				score += 5
			} else if input.GPA >= 3.5 {
				score += 2
			} else if input.GPA < 3.2 && u.AcceptanceRate < 10 {
				score -= 15
				matchType = "Reach"
			}
		}

		// Adjust based on location preference
		if input.Location != "" && u.Country != "" {
			if len(input.Location) >= 3 && (u.Country == input.Location || len(u.Country) >= 3 && u.Country[:3] == input.Location[:3]) {
				score += 8
			}
		}

		if score > 99 {
			score = 99
		} else if score < 40 {
			score = 45
		}

		// Categorize match type if not set
		if u.AcceptanceRate < 10 {
			matchType = "Reach"
		} else if u.AcceptanceRate < 35 {
			matchType = "Target"
		} else {
			matchType = "Safety"
		}

		results = append(results, SmartMatchResult{
			ID:         u.ID,
			Name:       u.Name,
			Country:    u.Country,
			MatchScore: score,
			Match:      fmt.Sprintf("%d%%", score),
			MatchType:  matchType,
			TuitionFee: u.TuitionFee,
		})
	}

	// Simple bubble sort descending by MatchScore
	for i := 0; i < len(results); i++ {
		for j := i + 1; j < len(results); j++ {
			if results[j].MatchScore > results[i].MatchScore {
				results[i], results[j] = results[j], results[i]
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": results})
}
