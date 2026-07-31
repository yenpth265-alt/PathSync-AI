package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("my_super_secret_key_change_in_prod")

func GenerateToken(userID string, email string, fullName string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &jwt.MapClaims{
		"user_id":   userID,
		"email":     email,
		"full_name": fullName,
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
