package routes

import (
	"github.com/gin-gonic/gin"
	"pathsync-ai-agent-service/handlers"
)

func RegisterRoutes(router *gin.RouterGroup) {
	agentGroup := router.Group("/agent")
	{
		agentGroup.POST("/counsel", handlers.AgentCounsel)
	}

	// Classic AI endpoints, merged in from the former ai-service (port 8005).
	aiGroup := router.Group("/ai")
	{
		aiGroup.POST("/sop-assist", handlers.SOPAssist)
		aiGroup.POST("/smart-match", handlers.SmartMatch)
		aiGroup.POST("/essay-review", handlers.EssayReview)
	}
}
