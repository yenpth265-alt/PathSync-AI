package main

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// contextUserID is where identity() stores the caller's verified user id so
// the rate limiter and the proxy both read one value instead of each
// re-parsing the token.
const contextUserID = "userID"

// identity verifies the bearer token once per request and records who the
// caller is. It deliberately runs before rateLimit: the limiter has to key off
// an identity the client cannot choose, and an X-User-ID arriving from the
// client is exactly such a forgeable value — so it is stripped here and only
// ever re-set from verified claims.
//
// An invalid or absent token is not rejected here; each downstream service
// still does its own verification. The gateway only needs to know whether it
// can attribute the request to an account.
func identity() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Header.Del("X-User-ID")

		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return jwtSecret(), nil
		})
		if err != nil || !token.Valid {
			c.Next()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if userID, ok := claims["user_id"].(string); ok && userID != "" {
				c.Set(contextUserID, userID)
				c.Request.Header.Set("X-User-ID", userID)
			}
		}
		c.Next()
	}
}

// Rate limiting is in-memory and therefore per-instance: two gateway instances
// each grant the configured budget. That is accepted for now — a shared store
// (Redis) is not part of the stack yet, and the job here is to stop one client
// from draining the paid Gemini quota, not to enforce a billing-grade quota.

type bucket struct {
	tokens   float64
	lastSeen time.Time
}

// limiter is a token bucket per caller: each key refills at rate tokens per
// second up to capacity, and every request costs one token. Capacity equals
// the per-minute budget, so a caller may burst that many requests once and
// then settles into the steady rate.
type limiter struct {
	mu       sync.Mutex
	buckets  map[string]*bucket
	rate     float64
	capacity float64
}

func newLimiter(perMinute int) *limiter {
	l := &limiter{
		buckets:  make(map[string]*bucket),
		rate:     float64(perMinute) / 60.0,
		capacity: float64(perMinute),
	}
	go l.collectIdleBuckets()
	return l
}

func (l *limiter) allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	b, ok := l.buckets[key]
	if !ok {
		l.buckets[key] = &bucket{tokens: l.capacity - 1, lastSeen: now}
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

// collectIdleBuckets drops buckets nobody has touched for a while, so a
// long-running gateway does not accumulate one entry per IP that ever
// connected. A dropped bucket is equivalent to a full one, which is correct:
// after the idle window the caller would have refilled to capacity anyway.
func (l *limiter) collectIdleBuckets() {
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

// rateLimit caps each caller at perMinute requests within the given scope.
// Scopes are independent budgets, so spending the AI allowance does not also
// lock the caller out of reading their own applications.
//
// The caller is the authenticated account when identity() could verify one and
// the client IP otherwise — an account cannot dodge its budget by rotating
// IPs, and signed-out traffic is still capped.
func rateLimit(perMinute int, scope string) gin.HandlerFunc {
	l := newLimiter(perMinute)
	return func(c *gin.Context) {
		if !l.allow(scope + "|" + callerKey(c)) {
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Bạn đang thao tác quá nhanh. Vui lòng thử lại sau khoảng một phút.",
			})
			return
		}
		c.Next()
	}
}

func callerKey(c *gin.Context) string {
	if userID := c.GetString(contextUserID); userID != "" {
		return "user:" + userID
	}
	return "ip:" + c.ClientIP()
}
