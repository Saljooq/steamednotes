package main

import (
	// "context"
	"net/http"
	"strconv"

	"github.com/golang-jwt/jwt/v5"
)

// Claims for JWT
type Claims struct {
	Email     string `json:"email"`
	ID        string `json:"id"`
	SessionID string `json:"session_id"`
	jwt.RegisteredClaims
}

// Auth middleware with database connection
func (connData ConnectionData) authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("token")
		if err != nil {
			http.Error(w, "Unauthorized - no token", http.StatusUnauthorized)
			return
		}

		// First validate JWT
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

		// Validate session in database
		ctx := r.Context()
		session, err := ValidateAndUpdateSession(ctx, connData.queries, cookie.Value)
		if err != nil {
			http.Error(w, "Unauthorized - invalid session", http.StatusUnauthorized)
			return
		}

		// Set headers for downstream handlers
		r.Header.Set("email", claims.Email)
		r.Header.Set("id", claims.ID)
		r.Header.Set("session_id", strconv.Itoa(int(session.ID)))

		next(w, r)
	}
}
