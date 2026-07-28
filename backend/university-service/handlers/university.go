package handlers

import (
	"net/http"
	"strconv"
	"time"

	"university-service/database"
	"university-service/models"

	"github.com/gin-gonic/gin"
)

func GetUniversities(c *gin.Context) {
	var unis []models.University
	query := database.DB.Model(&models.University{})

	if region := c.Query("region"); region != "" {
		query = query.Where("region = ?", region)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ?", "%"+search+"%")
	}
	if uniType := c.Query("type"); uniType != "" {
		query = query.Where("type = ?", uniType)
	}

	query.Find(&unis)
	c.JSON(http.StatusOK, gin.H{"data": unis})
}

func GetUniversityDetail(c *gin.Context) {
	id := c.Param("id")
	var uni models.University
	if err := database.DB.Where("id = ?", id).First(&uni).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	var programs []models.Program
	database.DB.Where("university_id = ?", id).Find(&programs)

	var scholarships []models.Scholarship
	database.DB.Where("university_id = ?", id).Find(&scholarships)

	c.JSON(http.StatusOK, gin.H{
		"data":         uni,
		"programs":     programs,
		"scholarships": scholarships,
	})
}

func GetPrograms(c *gin.Context) {
	var programs []models.Program
	query := database.DB.Preload("University")

	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ?", "%"+search+"%")
	}
	if degree := c.Query("degree"); degree != "" {
		query = query.Where("degree = ?", degree)
	}
	if minGpaStr := c.Query("min_gpa"); minGpaStr != "" {
		if minGpa, err := strconv.ParseFloat(minGpaStr, 64); err == nil {
			query = query.Where("min_gpa <= ?", minGpa)
		}
	}
	if maxTuitionStr := c.Query("max_tuition"); maxTuitionStr != "" {
		if maxTuition, err := strconv.ParseFloat(maxTuitionStr, 64); err == nil {
			query = query.Where("tuition_per_year <= ?", maxTuition)
		}
	}

	query.Find(&programs)
	
	// Optional filtering for region in memory for simplicity
	region := c.Query("region")
	if region != "" {
		var filtered []models.Program
		for _, p := range programs {
			if p.University.Region == region {
				filtered = append(filtered, p)
			}
		}
		programs = filtered
	}
	
	c.JSON(http.StatusOK, gin.H{"data": programs})
}

func GetProgramDetail(c *gin.Context) {
	id := c.Param("id")
	var prog models.Program
	if err := database.DB.Preload("University").Where("id = ?", id).First(&prog).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": prog})
}

func GetScholarships(c *gin.Context) {
	var scholarships []models.Scholarship
	query := database.DB.Preload("University")
	
	if coverage := c.Query("coverage"); coverage != "" {
		query = query.Where("coverage = ?", coverage)
	}
	
	query.Find(&scholarships)
	c.JSON(http.StatusOK, gin.H{"data": scholarships})
}

func GetScholarshipDetail(c *gin.Context) {
	id := c.Param("id")
	var sch models.Scholarship
	if err := database.DB.Preload("University").Where("id = ?", id).First(&sch).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": sch})
}

func GetProgramFit(c *gin.Context) {
	id := c.Param("id")
	var prog models.Program
	if err := database.DB.Preload("University").Where("id = ?", id).First(&prog).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	gpaStr := c.Query("gpa")
	ieltsStr := c.Query("ielts")
	workExpStr := c.Query("work_exp")

	score := 50
	strengths := []string{}
	gaps := []string{}

	if gpa, err := strconv.ParseFloat(gpaStr, 64); err == nil {
		if gpa >= prog.MinGPA {
			score += 30
			strengths = append(strengths, "GPA meets or exceeds requirement")
		} else {
			score -= 20
			gaps = append(gaps, "GPA is below requirement")
		}
	}

	if ielts, err := strconv.ParseFloat(ieltsStr, 64); err == nil && prog.MinIELTS > 0 {
		if ielts >= prog.MinIELTS {
			score += 10
			strengths = append(strengths, "IELTS score meets requirement")
		} else {
			score -= 10
			gaps = append(gaps, "IELTS score is below requirement")
		}
	}

	if workExp, err := strconv.Atoi(workExpStr); err == nil && prog.WorkExpRequired > 0 {
		if workExp >= prog.WorkExpRequired {
			score += 10
			strengths = append(strengths, "Work experience meets requirement")
		} else {
			score -= 10
			gaps = append(gaps, "More work experience needed")
		}
	}
	
	if score > 100 {
		score = 100
	} else if score < 0 {
		score = 0
	}

	tier := "target"
	if score >= 80 {
		tier = "safe"
	} else if score < 50 {
		tier = "reach"
	}

	c.JSON(http.StatusOK, gin.H{
		"score":     score,
		"tier":      tier,
		"strengths": strengths,
		"gaps":      gaps,
	})
}
