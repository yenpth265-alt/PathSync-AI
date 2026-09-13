package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Falls back to a fixed dev-only value so local development keeps working
// without extra setup. Every backend service must be given the same
// JWT_SECRET env var in production or token verification breaks across
// services.
var jwtKey = getJWTSecret()

func getJWTSecret() []byte {
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		return []byte(secret)
	}
	return []byte("dev_only_insecure_secret_change_me")
}

// AccessTokenTTL is short deliberately: there was previously no refresh
// mechanism at all, so the access token had to live 24h to keep a session
// usable. Now that RefreshAccessToken (handlers/refresh.go) exists, the
// access token only needs to survive between refreshes — a stolen one goes
// stale fast, while the session itself stays alive via the (rotated,
// revocable) refresh token.
const AccessTokenTTL = 15 * time.Minute

// RefreshTokenTTL is how long a refresh token is usable before the user must
// log in again from scratch.
const RefreshTokenTTL = 30 * 24 * time.Hour

func GenerateToken(userID string, email string, fullName string, role string) (string, error) {
	expirationTime := time.Now().Add(AccessTokenTTL)
	claims := &jwt.MapClaims{
		"user_id":   userID,
		"email":     email,
		"full_name": fullName,
		"role":      role,
		"exp":       expirationTime.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

// NewRefreshToken returns a random opaque token (given to the client) and
// its SHA-256 hash (what actually gets stored in the database). The token
// itself is never persisted — a stolen database dump then lets an attacker
// recompute the hash of a guessed token, but a guessed random 256-bit value
// is not a practical attack, and it means the hash alone is useless without
// the original token.
func NewRefreshToken() (token string, tokenHash string, err error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}
	token = base64.RawURLEncoding.EncodeToString(raw)
	sum := sha256.Sum256([]byte(token))
	tokenHash = hex.EncodeToString(sum[:])
	return token, tokenHash, nil
}

// HashRefreshToken re-derives the same hash NewRefreshToken computed, so a
// presented token can be looked up by hash without ever storing the token
// itself.
func HashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func ParseToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, jwt.ErrSignatureInvalid
}
