package routes

import (
	"university-service/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")
	{
		api.GET("/universities", handlers.GetUniversities)
		api.GET("/universities/:id", handlers.GetUniversityDetail)
		
		api.GET("/programs", handlers.GetPrograms)
		api.GET("/programs/:id", handlers.GetProgramDetail)
		api.GET("/programs/:id/fit", handlers.GetProgramFit)
		
		api.GET("/scholarships", handlers.GetScholarships)
		api.GET("/scholarships/:id", handlers.GetScholarshipDetail)
	}
}
