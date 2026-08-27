package routes

import (
	"document-service/handlers"
	"document-service/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1/documents")
	api.Use(middleware.RequireAuth())
	{
		api.GET("", handlers.GetDocuments)
		api.POST("", handlers.CreateDocument)
		api.PUT("/:id", handlers.UpdateDocument)
		api.DELETE("/:id", handlers.DeleteDocument)
		api.GET("/download/:id", handlers.DownloadDocument)
		api.GET("/:id/text", handlers.ExtractDocumentText)
		api.POST("/sop-version", handlers.SaveSOPVersion)
		api.GET("/sop-history/:appId", handlers.GetSOPHistory)
	}
}
