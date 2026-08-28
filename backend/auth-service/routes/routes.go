package routes

import (
	"auth-service/handlers"
	"auth-service/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/send-otp", handlers.SendOTP)
		auth.POST("/verify-otp", handlers.VerifyOTP)
		auth.POST("/login", handlers.Login)
	}

	admin := r.Group("/api/v1/admin")
	admin.Use(middleware.RequireAuth(), middleware.RequireAdmin())
	{
		admin.GET("/users", handlers.GetAdminUsers)
		admin.GET("/users/deleted", handlers.GetDeletedUsers)
		admin.PUT("/users/:id/role", handlers.UpdateUserRole)
		admin.PUT("/users/:id/status", handlers.UpdateUserStatus)
		admin.PUT("/users/:id/restore", handlers.RestoreUser)
		admin.DELETE("/users/:id", handlers.DeleteUser)
	}
	
	profile := r.Group("/api/v1/profile")
	{
		profile.GET("", handlers.GetMyProfile)
		profile.PUT("", handlers.UpdateMyProfile)
		profile.GET("/completion", handlers.GetProfileCompletion)
	}

	mentors := r.Group("/api/v1/mentors")
	{
		mentors.GET("", handlers.GetMentors)
		mentors.PUT("/profile", handlers.UpdateMentorProfile)
	}

	bookings := r.Group("/api/v1/bookings")
	bookings.Use(middleware.RequireAuth())
	{
		bookings.POST("", handlers.CreateBooking)
		bookings.GET("", handlers.GetBookings)
		bookings.PUT("/:id/status", handlers.UpdateBookingStatus)
		bookings.GET("/:id/history", handlers.GetBookingHistory)
	}
}
