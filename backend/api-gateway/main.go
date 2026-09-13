package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func getEnvOrDefault(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvIntOrDefault(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		if parsed, err := strconv.Atoi(value); err == nil && parsed > 0 {
			return parsed
		}
		log.Printf("ignoring invalid %s=%q, using %d", key, os.Getenv(key), fallback)
	}
	return fallback
}

var (
	AuthServiceURL       = getEnvOrDefault("AUTH_SERVICE_URL", "http://127.0.0.1:8001")
	ApplicationServiceURL = getEnvOrDefault("APPLICATION_SERVICE_URL", "http://127.0.0.1:8002")
	DocumentServiceURL    = getEnvOrDefault("DOCUMENT_SERVICE_URL", "http://127.0.0.1:8003")
	UniversityServiceURL  = getEnvOrDefault("UNIVERSITY_SERVICE_URL", "http://127.0.0.1:8004")
	AIAgentServiceURL     = getEnvOrDefault("AI_AGENT_SERVICE_URL", "http://127.0.0.1:8006")
)

// Per-caller request budgets, per minute. The AI budget is much smaller than
// the general one because every request behind /ai and /agent costs money at
// the Gemini API; the auth budget is small to blunt credential stuffing and
// OTP spam. All three are env-tunable so a demo can be loosened without a
// redeploy of new code.
var (
	generalRPM = getEnvIntOrDefault("RATE_LIMIT_RPM", 120)
	aiRPM      = getEnvIntOrDefault("RATE_LIMIT_AI_RPM", 12)
	authRPM    = getEnvIntOrDefault("RATE_LIMIT_AUTH_RPM", 10)
)

// jwtSecret must match the JWT_SECRET configured on every backend service —
// the gateway only uses it to extract an identity hint for downstream
// logging; each service independently re-verifies the token itself.
func jwtSecret() []byte {
	return []byte(getEnvOrDefault("JWT_SECRET", "dev_only_insecure_secret_change_me"))
}

func main() {
	r := gin.Default()

	// 1. CORS Middleware
	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return true // Allow all origins (Vercel, Localhost, etc.)
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 2. Identify the caller from the verified token, then hold every caller
	// to a request budget. identity must come first so the limiter keys off
	// an account the client cannot forge.
	r.Use(identity())

	// 3. Health Check for Gateway itself
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "API Gateway is running"})
	})

	aiLimit := rateLimit(aiRPM, "ai")
	authLimit := rateLimit(authRPM, "auth")

	// 4. Routing / Proxying logic
	api := r.Group("/api/v1")
	api.Use(rateLimit(generalRPM, "general"))
	{
		// Auth Routes -> Proxy to Auth Service (Port 8001)
		api.Any("/auth", authLimit, proxy(AuthServiceURL))
		api.Any("/auth/*path", authLimit, proxy(AuthServiceURL))
		api.Any("/profile", proxy(AuthServiceURL))
		api.Any("/profile/*path", proxy(AuthServiceURL))
		api.Any("/mentors", proxy(AuthServiceURL))
		api.Any("/mentors/*path", proxy(AuthServiceURL))
		api.Any("/bookings", proxy(AuthServiceURL))
		api.Any("/bookings/*path", proxy(AuthServiceURL))

		// Application Routes -> Proxy to Application Service (Port 8002)
		api.Any("/applications", proxy(ApplicationServiceURL))
		api.Any("/applications/*path", proxy(ApplicationServiceURL))
		api.Any("/subtasks", proxy(ApplicationServiceURL))
		api.Any("/subtasks/*path", proxy(ApplicationServiceURL))

		// Document Routes -> Proxy to Document Service (Port 8003)
		api.Any("/documents", proxy(DocumentServiceURL))
		api.Any("/documents/*path", proxy(DocumentServiceURL))

		// University Routes -> Proxy to University Service (Port 8004)
		api.Any("/universities", proxy(UniversityServiceURL))
		api.Any("/universities/*path", proxy(UniversityServiceURL))
		api.Any("/programs", proxy(UniversityServiceURL))
		api.Any("/programs/*path", proxy(UniversityServiceURL))
		api.Any("/scholarships", proxy(UniversityServiceURL))
		api.Any("/scholarships/*path", proxy(UniversityServiceURL))

		// Admin Proxy Routes
		api.Any("/admin/users", proxy(AuthServiceURL))
		api.Any("/admin/users/*path", proxy(AuthServiceURL))
		api.Any("/admin/universities", proxy(UniversityServiceURL))
		api.Any("/admin/universities/*path", proxy(UniversityServiceURL))
		api.Any("/admin/programs", proxy(UniversityServiceURL))
		api.Any("/admin/programs/*path", proxy(UniversityServiceURL))
		api.Any("/admin/scholarships", proxy(UniversityServiceURL))
		api.Any("/admin/scholarships/*path", proxy(UniversityServiceURL))
		api.Any("/admin/sync-universities", proxy(UniversityServiceURL))

		// AI / Agent Routes -> Proxy to AI Agent Service (Port 8006)
		api.Any("/agent", aiLimit, proxy(AIAgentServiceURL))
		api.Any("/agent/*path", aiLimit, proxy(AIAgentServiceURL))

		// Classic AI Routes -> merged into AI Agent Service (Port 8006)
		api.Any("/ai", aiLimit, proxy(AIAgentServiceURL))
		api.Any("/ai/*path", aiLimit, proxy(AIAgentServiceURL))
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("API Gateway starting on port %s...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start API Gateway: %v", err)
	}
}

// proxy returns a Gin middleware that proxies the request to the targetURL
func proxy(targetURL string) gin.HandlerFunc {
	target, err := url.Parse(targetURL)
	if err != nil {
		log.Fatalf("Invalid target URL: %v", err)
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	return func(c *gin.Context) {
		// identity() has already stripped any client-supplied X-User-ID and
		// re-set it from verified claims, so downstream services never see a
		// forged one.

		// Modify the request path if needed.
		// For example, if target is http://localhost:8001, and request is /api/v1/auth/login
		// The proxy will naturally forward it as http://localhost:8001/api/v1/auth/login
		// This is perfectly fine if the downstream services also listen on /api/v1/...

		c.Request.URL.Host = target.Host
		c.Request.URL.Scheme = target.Scheme
		c.Request.Header.Set("X-Forwarded-Host", c.Request.Header.Get("Host"))
		c.Request.Host = target.Host

		// Use the reverse proxy to handle the request
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}
