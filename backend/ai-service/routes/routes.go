package routes
import (
	"ai-service/handlers"
	"github.com/gin-gonic/gin"
)
func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")
	{
		api.POST("/ai/chat", handlers.Chat)
		api.POST("/ai/sop-assist", handlers.SOPAssist)
		api.POST("/ai/smart-match", handlers.SmartMatch)
		api.POST("/ai/essay-review", handlers.EssayReview)
		api.POST("/ai/mentor-pre-review", handlers.MentorPreReview)
		api.POST("/ai/interview-sim", handlers.InterviewSim)
	}
}
