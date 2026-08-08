package routes

import (
	"github.com/gin-gonic/gin"
	"pathsync-ai-agent-service/handlers"
)

func RegisterRoutes(router *gin.RouterGroup) {
	agentGroup := router.Group("/agent")
	{
		agentGroup.POST("/counsel", handlers.AgentCounsel)
		agentGroup.POST("/swarm", handlers.AgentSwarm)
		agentGroup.GET("/swarm/sessions", handlers.GetSwarmHistory)
		agentGroup.GET("/swarm/sessions/:id", handlers.GetSwarmSessionDetail)
	}

	// Classic AI endpoints, merged in from the former ai-service (port 8005).
	aiGroup := router.Group("/ai")
	{
		aiGroup.POST("/sop-assist", handlers.SOPAssist)
		aiGroup.POST("/smart-match", handlers.SmartMatch)
		aiGroup.POST("/essay-review", handlers.EssayReview)
		aiGroup.POST("/extract-cv", handlers.ExtractCV)
		aiGroup.POST("/interview-sim", handlers.InterviewSim)
	}
}
