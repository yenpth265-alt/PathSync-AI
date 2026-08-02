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

		admin := api.Group("/admin")
		{
			admin.POST("/universities", handlers.CreateUniversity)
			admin.POST("/programs", handlers.CreateProgram)
			admin.POST("/scholarships", handlers.CreateScholarship)
			admin.POST("/sync-universities", func(c *gin.Context) {
				go updater.StartRealtimeUpdater()
				c.JSON(200, gin.H{"message": "Official source sync triggered in background"})
			})
		}
	}
}
