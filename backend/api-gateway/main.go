package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Define internal service URLs
const (
	AuthServiceURL       = "http://localhost:8001"
	ApplicationServiceURL = "http://localhost:8002"
	DocumentServiceURL    = "http://localhost:8003"
	UniversityServiceURL  = "http://localhost:8004"
)

func main() {
	r := gin.Default()

	// 1. CORS Middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Allow Frontend
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 2. Health Check for Gateway itself
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "API Gateway is running"})
	})

	// 3. Routing / Proxying logic
	api := r.Group("/api/v1")
	{
		// Auth Routes -> Proxy to Auth Service (Port 8001)
		api.Any("/auth", proxy(AuthServiceURL))
		api.Any("/auth/*path", proxy(AuthServiceURL))

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
	}

	log.Println("API Gateway starting on port 8000...")
	if err := r.Run(":8000"); err != nil {
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
		// Example: Optional JWT validation could go here before Proxying
		// If valid, we could inject user_id into headers: c.Request.Header.Set("X-User-ID", userID)

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
