package routes

import (
	"github.com/gin-gonic/gin"
	"university-service/handlers"
	"university-service/updater"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")
	{
		api.GET("/sources", func(c *gin.Context) {
			c.JSON(200, gin.H{"data": updater.LoadOfficialSources()})
		})
		api.GET("/universities", handlers.GetUniversities)
		api.GET("/universities/:id", handlers.GetUniversityDetail)

		api.GET("/programs", handlers.GetPrograms)
		api.GET("/programs/:id", handlers.GetProgramDetail)
		api.GET("/programs/:id/fit", handlers.GetProgramFit)

		api.GET("/scholarships", handlers.GetScholarships)
		api.GET("/scholarships/:id", handlers.GetScholarshipDetail)
	}
}
