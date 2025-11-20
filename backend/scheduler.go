package main

import (
	"context"
	"log"
	"steamednotes/db"
	"time"
)

// StartSessionCleanupScheduler runs a daily job to clean up expired sessions
func StartSessionCleanupScheduler(ctx context.Context, queries *db.Queries) {
	ticker := time.NewTicker(24 * time.Hour) // Run daily
	defer ticker.Stop()

	// Run once at startup
	go func() {
		if err := CleanupExpiredSessions(ctx, queries); err != nil {
			log.Printf("Failed to cleanup expired sessions: %v", err)
		} else {
			log.Println("Completed initial expired sessions cleanup")
		}
	}()

	for {
		select {
		case <-ctx.Done():
			log.Println("Session cleanup scheduler stopped")
			return
		case <-ticker.C:
			log.Println("Running daily expired sessions cleanup")
			if err := CleanupExpiredSessions(ctx, queries); err != nil {
				log.Printf("Failed to cleanup expired sessions: %v", err)
			} else {
				log.Println("Completed daily expired sessions cleanup")
			}
		}
	}
}
