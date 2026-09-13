package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// This service's own rate limit — defense in depth alongside api-gateway's.
// The gateway limiter (backend/api-gateway/middleware.go) only protects
// traffic that actually passes through it; a review found that every backend
// service (this one included) is also independently reachable at its own
// public URL (Render gives each microservice its own address, and
// docker-compose publishes each service's port directly), which would let a
// caller who knows/finds that URL hit the paid Gemini-backed endpoints with
// no limit at all. This is the same token-bucket design as the gateway's,
// duplicated rather than shared because these services intentionally have no
// shared Go module (see project conventions — auth/JWT logic is already
// duplicated per-service the same way).

type rateBucket struct {
	tokens   float64
	lastSeen time.Time
}

type rateLimiter struct {
	mu       sync.Mutex
	buckets  map[string]*rateBucket
	rate     float64
	capacity float64
}

func newRateLimiter(perMinute int) *rateLimiter {
	l := &rateLimiter{
		buckets:  make(map[string]*rateBucket),
		rate:     float64(perMinute) / 60.0,
		capacity: float64(perMinute),
	}
	go l.sweep()
	return l
}

func (l *rateLimiter) allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	b, ok := l.buckets[key]
	if !ok {
		l.buckets[key] = &rateBucket{tokens: l.capacity - 1, lastSeen: now}
		return true
	}

	b.tokens += now.Sub(b.lastSeen).Seconds() * l.rate
	if b.tokens > l.capacity {
		b.tokens = l.capacity
	}
	b.lastSeen = now

	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

func (l *rateLimiter) sweep() {
	const idleWindow = 10 * time.Minute
	ticker := time.NewTicker(idleWindow)
	defer ticker.Stop()
	for range ticker.C {
		l.mu.Lock()
		for key, b := range l.buckets {
			if time.Since(b.lastSeen) > idleWindow {
				delete(l.buckets, key)
			}
		}
		l.mu.Unlock()
	}
}

// RateLimit caps each caller at perMinute requests. It must run after
// RequireAuth so c.GetString("userID") is populated — an account cannot dodge
// its budget by rotating IPs, and requests that somehow reach this without
// passing RequireAuth still fall back to IP.
func RateLimit(perMinute int) gin.HandlerFunc {
	l := newRateLimiter(perMinute)
	return func(c *gin.Context) {
		key := c.GetString("userID")
		if key == "" {
			key = c.ClientIP()
		}
		if !l.allow(key) {
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Bạn đang thao tác quá nhanh. Vui lòng thử lại sau khoảng một phút.",
			})
			return
		}
		c.Next()
	}
}
