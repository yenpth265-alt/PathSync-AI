package utils

import (
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

func GenerateToken(userID string, email string, fullName string, role string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
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
