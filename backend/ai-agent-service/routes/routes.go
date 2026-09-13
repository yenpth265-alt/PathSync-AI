package routes

import (
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"pathsync-ai-agent-service/handlers"
	"pathsync-ai-agent-service/middleware"
)

// serviceRateLimitRPM defaults to the same AI budget api-gateway uses
// (RATE_LIMIT_AI_RPM). This service-level copy exists because Render/
// docker-compose expose every backend service at its own public URL, not
// only through the gateway — see middleware/ratelimit.go.
func serviceRateLimitRPM() int {
	const fallback = 12
	if v := os.Getenv("SERVICE_RATE_LIMIT_AI_RPM"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return fallback
}

func RegisterRoutes(router *gin.RouterGroup) {
	rateLimit := middleware.RateLimit(serviceRateLimitRPM())

	agentGroup := router.Group("/agent")
	agentGroup.Use(middleware.RequireAuth(), rateLimit)
	{
		agentGroup.POST("/counsel", handlers.AgentCounsel)
		agentGroup.POST("/swarm", handlers.AgentSwarm)
		agentGroup.GET("/swarm/sessions", handlers.GetSwarmHistory)
		agentGroup.GET("/swarm/sessions/:id", handlers.GetSwarmSessionDetail)
	}

	// Classic AI endpoints, merged in from the former ai-service (port 8005).
	aiGroup := router.Group("/ai")
	aiGroup.Use(middleware.RequireAuth(), rateLimit)
	{
		aiGroup.POST("/sop-assist", handlers.SOPAssist)
		aiGroup.POST("/smart-match", handlers.SmartMatch)
		aiGroup.POST("/essay-review", handlers.EssayReview)
		aiGroup.POST("/extract-cv", handlers.ExtractCV)
		aiGroup.POST("/extract-actions", handlers.ExtractActions)
		aiGroup.POST("/interview-sim", handlers.InterviewSim)

		// Admin-only: real p50/p95 latency for the Action Extractor, computed
		// from recorded calls (see actions.go: recordExtractionMetric)
		// instead of the pitch's asserted "3,2 giây/tệp" average.
		aiGroup.GET("/admin/extraction-metrics", middleware.RequireAdmin(), handlers.GetExtractionMetrics)
	}
}
