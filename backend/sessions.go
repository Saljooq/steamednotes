package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net"
	"net/http"
	"net/netip"
	"regexp"
	"steamednotes/db"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// DeviceInfo contains parsed device information
type DeviceInfo struct {
	Name           string
	Type           string
	BrowserName    string
	BrowserVersion string
	OSName         string
	OSVersion      string
}

// ParseUserAgent extracts device information from user agent string
func ParseUserAgent(userAgent string) DeviceInfo {
	info := DeviceInfo{
		Name: "Unknown Device",
		Type: "desktop",
	}

	// Detect browser - more reliable detection with order of specificity
	// Check Edge first since it includes Chrome in UA
	if strings.Contains(userAgent, "Edg/") {
		re := regexp.MustCompile(`Edg/(\d+\.\d+)`)
		matches := re.FindStringSubmatch(userAgent)
		if len(matches) > 1 {
			info.BrowserName = "Edge"
			info.BrowserVersion = matches[1]
		}
	} else if strings.Contains(userAgent, "OPR/") || strings.Contains(userAgent, "Opera/") {
		re := regexp.MustCompile(`(OPR|Opera)/(\d+\.\d+)`)
		matches := re.FindStringSubmatch(userAgent)
		if len(matches) > 1 {
			info.BrowserName = "Opera"
			info.BrowserVersion = matches[2]
		}
	} else if strings.Contains(userAgent, "Chrome/") && !strings.Contains(userAgent, "Edg/") {
		re := regexp.MustCompile(`Chrome/(\d+\.\d+)`)
		matches := re.FindStringSubmatch(userAgent)
		if len(matches) > 1 {
			info.BrowserName = "Chrome"
			info.BrowserVersion = matches[1]
		}
	} else if strings.Contains(userAgent, "Firefox/") {
		re := regexp.MustCompile(`Firefox/(\d+\.\d+)`)
		matches := re.FindStringSubmatch(userAgent)
		if len(matches) > 1 {
			info.BrowserName = "Firefox"
			info.BrowserVersion = matches[1]
		}
	} else if strings.Contains(userAgent, "Safari/") && !strings.Contains(userAgent, "Chrome/") {
		re := regexp.MustCompile(`Safari/(\d+\.\d+)`)
		matches := re.FindStringSubmatch(userAgent)
		if len(matches) > 1 {
			info.BrowserName = "Safari"
			info.BrowserVersion = matches[1]
		}
	} else if strings.Contains(userAgent, "MSIE") {
		re := regexp.MustCompile(`MSIE (\d+\.\d+)`)
		matches := re.FindStringSubmatch(userAgent)
		if len(matches) > 1 {
			info.BrowserName = "IE"
			info.BrowserVersion = matches[1]
		}
	}

	// Detect OS
	osPatterns := map[string]string{
		"Windows": `Windows NT (\d+\.\d+)`,
		"Mac":     `Mac OS X (\d+[._]\d+)`,
		"Linux":   `Linux`,
		"Android": `Android (\d+\.\d+)`,
		"iOS":     `iPhone OS (\d+[._]\d+)`,
	}

	for os, pattern := range osPatterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(userAgent)
		if len(matches) > 0 {
			info.OSName = os
			if len(matches) > 1 {
				info.OSVersion = strings.ReplaceAll(matches[1], "_", ".")
			}
			break
		}
	}

	// Determine device type
	if strings.Contains(strings.ToLower(userAgent), "mobile") ||
		strings.Contains(strings.ToLower(userAgent), "android") ||
		strings.Contains(strings.ToLower(userAgent), "iphone") {
		info.Type = "mobile"
	} else if strings.Contains(strings.ToLower(userAgent), "tablet") ||
		strings.Contains(strings.ToLower(userAgent), "ipad") {
		info.Type = "tablet"
	}

	// Create device name
	if info.BrowserName != "" && info.OSName != "" {
		info.Name = info.BrowserName + " on " + info.OSName
	} else if info.OSName != "" {
		info.Name = info.OSName
	}

	return info
}

// GenerateSessionToken creates a secure random session token
func GenerateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// GetClientIP extracts the real client IP address
func GetClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (for reverse proxies)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

// CreateSession creates a new user session in the database
func CreateSession(ctx context.Context, queries *db.Queries, userID int32, r *http.Request) (db.UserSession, error) {
	// Generate session token
	token, err := GenerateSessionToken()
	if err != nil {
		return db.UserSession{}, err
	}

	// Parse user agent
	deviceInfo := ParseUserAgent(r.Header.Get("User-Agent"))

	// Get client IP
	clientIP := GetClientIP(r)
	var ipAddr *netip.Addr
	if parsedIP, err := netip.ParseAddr(clientIP); err == nil {
		ipAddr = &parsedIP
	}

	// Create session
	return queries.CreateSession(ctx, db.CreateSessionParams{
		UserID:         userID,
		SessionToken:   token,
		DeviceName:     pgtype.Text{String: deviceInfo.Name, Valid: true},
		DeviceType:     pgtype.Text{String: deviceInfo.Type, Valid: true},
		BrowserName:    pgtype.Text{String: deviceInfo.BrowserName, Valid: deviceInfo.BrowserName != ""},
		BrowserVersion: pgtype.Text{String: deviceInfo.BrowserVersion, Valid: deviceInfo.BrowserVersion != ""},
		OsName:         pgtype.Text{String: deviceInfo.OSName, Valid: deviceInfo.OSName != ""},
		OsVersion:      pgtype.Text{String: deviceInfo.OSVersion, Valid: deviceInfo.OSVersion != ""},
		IpAddress:      ipAddr,
		UserAgent:      pgtype.Text{String: r.Header.Get("User-Agent"), Valid: true},
		ExpiresAt:      pgtype.Timestamp{Time: time.Now().Add(7 * 24 * time.Hour), Valid: true},
	})
}

// ValidateAndUpdateSession checks if a session is valid and updates its last used time
func ValidateAndUpdateSession(ctx context.Context, queries *db.Queries, token string) (db.UserSession, error) {
	fmt.Printf("Validating session with token: %s\n", token[:min(len(token), 20)]+"...")

	// Parse JWT to get session ID
	claims := &Claims{}
	parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return secret, nil
	})
	if err != nil {
		fmt.Printf("JWT parsing error: %v\n", err)
		return db.UserSession{}, err
	}
	if !parsedToken.Valid {
		fmt.Printf("Invalid JWT token\n")
		return db.UserSession{}, fmt.Errorf("invalid token")
	}

	fmt.Printf("JWT claims - Email: %s, ID: %s, SessionID: %s\n", claims.Email, claims.ID, claims.SessionID)

	// Get session by ID from JWT claims
	sessionID, err := strconv.Atoi(claims.SessionID)
	if err != nil {
		fmt.Printf("Session ID conversion error: %v\n", err)
		return db.UserSession{}, err
	}

	fmt.Printf("Looking for session ID: %d\n", sessionID)

	// Get session by ID
	session, err := queries.GetSessionByID(ctx, int32(sessionID))
	if err != nil {
		fmt.Printf("Session lookup error: %v\n", err)
		return db.UserSession{}, err
	}

	fmt.Printf("Found session: ID=%d, Active=%v, Expires=%v\n", session.ID, session.IsActive, session.ExpiresAt.Time)

	// Check if session is expired
	if session.ExpiresAt.Time.Before(time.Now()) {
		fmt.Printf("Session expired\n")
		return db.UserSession{}, http.ErrNoCookie
	}

	if time.Until(session.ExpiresAt.Time) < (time.Hour * 24 * 5) {
		updatedSessionid, err := queries.UpdateSessionLastUsedAndExpiry(ctx, session.ID)
		if err != nil {
			fmt.Printf("Session update error: %v\n", err)
			return db.UserSession{}, err
		}
		fmt.Printf("Session validated and updated successfully\n")
		return db.UserSession{ID: updatedSessionid}, nil
	}

	// Update last used time and extend if needed
	updatedSessionid, err := queries.UpdateSessionLastUsed(ctx, session.ID)
	if err != nil {
		fmt.Printf("Session update error: %v\n", err)
		return db.UserSession{}, err
	}

	fmt.Printf("Session validated and updated successfully\n")
	return db.UserSession{ID: updatedSessionid}, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GetSessionForUser retrieves all active sessions for a user
func GetSessionForUser(ctx context.Context, queries *db.Queries, userID int32) ([]db.UserSession, error) {
	return queries.GetSessionsByUser(ctx, userID)
}

// DeleteSession removes a specific session
func DeleteSession(ctx context.Context, queries *db.Queries, sessionID, userID int32) error {
	return queries.DeleteSession(ctx, db.DeleteSessionParams{
		ID:     sessionID,
		UserID: userID,
	})
}

// DeleteAllOtherSessions removes all sessions except the current one
func DeleteAllOtherSessions(ctx context.Context, queries *db.Queries, currentSessionID, userID int32) error {
	return queries.DeleteAllSessionsExceptCurrent(ctx, db.DeleteAllSessionsExceptCurrentParams{
		UserID: userID,
		ID:     currentSessionID,
	})
}

// CleanupExpiredSessions removes all expired sessions
func CleanupExpiredSessions(ctx context.Context, queries *db.Queries) error {
	return queries.CleanupExpiredSessions(ctx)
}
