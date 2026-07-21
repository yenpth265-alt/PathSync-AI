package handlers

import (
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
