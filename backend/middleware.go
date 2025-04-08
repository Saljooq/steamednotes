package main

import (
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

// Claims for JWT
type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// Auth middleware
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("token")
		if err != nil {
			http.Error(w, "Unauthorized - no token", http.StatusUnauthorized)
			return
		}
		token, err := jwt.ParseWithClaims(cookie.Value, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return secret, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized - invalid token", http.StatusUnauthorized)
			return
		}
		claims, ok := token.Claims.(*Claims)
		if !ok {
			http.Error(w, "Unauthorized - invalid claims", http.StatusUnauthorized)
			return
		}
		r.Header.Set("Username", claims.Username) // Pass username downstream
		next(w, r)
	}
}
