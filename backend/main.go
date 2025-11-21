package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"steamednotes/db" // Adjust based on your module path

	// "github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Dummy user struct
type User struct {
	Email    string
	Password string // Plaintext for now—hash later
}

// Note struct
type Note struct {
	ID      int
	Content string
	Owner   string
}

// Connection struct
type ConnectionData struct {
	queries *db.Queries
}

// Connection For Admin
type ConnectionDataAdmin struct {
	queries *db.Queries
	pool    *pgxpool.Pool
}

// In-memory store
var (
	secret = []byte("super-secret-key")
)

func main() {

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))

	conn, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	} else {
		log.Printf("Successfully connected to the db")
	}

	defer conn.Close()

	queries := db.New(conn)
	connData := ConnectionData{queries: queries}
	conAdminData := ConnectionDataAdmin{queries: queries, pool: conn}

	// List users handler
	http.HandleFunc("GET /api/users", func(w http.ResponseWriter, r *http.Request) {
		users, err := queries.ListUsers(r.Context())
		if err != nil {
			http.Error(w, `{"error":"Failed to list users"}`, http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users)

	})

	// Create user handler
	http.HandleFunc("POST /api/adduser", func(w http.ResponseWriter, r *http.Request) {
		var req db.CreateUserParams

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error":"Invalid input"}`, http.StatusBadRequest)
			return
		}
		// Basic validation
		if req.Username == "" || req.Email == "" || req.PasswordHash == "" {
			http.Error(w, `{"error":"Username, email, and password_hash are required"}`, http.StatusBadRequest)
			return
		}
		user, err := queries.CreateUser(r.Context(), req)
		if err != nil {
			// Handle specific errors (e.g., duplicate username/email)
			http.Error(w, `{"error":"Failed to create user: `+err.Error()+`"}`, http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(user)
	})

	http.HandleFunc("GET /api/notes", connData.authMiddleware(connData.getNotes))
	http.HandleFunc("GET /api/notes/getnote", connData.authMiddleware(connData.getNote))
	http.HandleFunc("POST /api/notes/create", connData.authMiddleware(connData.createNote))
	http.HandleFunc("PATCH /api/note/update", connData.authMiddleware(connData.updateNote))
	http.HandleFunc("DELETE /api/note/delete", connData.authMiddleware(connData.deleteNote))
	http.HandleFunc("POST /api/signin", connData.signIn)

	http.HandleFunc("GET /api/users/create", createUser)
	http.HandleFunc("POST /api/rooms/create", connData.authMiddleware(connData.createRoom))
	http.HandleFunc("GET /api/rooms/get", connData.authMiddleware(connData.getRooms))
	http.HandleFunc("GET /api/rooms/getdetails", connData.authMiddleware(connData.getRoomDetails))
	http.HandleFunc("POST /api/folders/create", connData.authMiddleware(connData.createFolder))
	http.HandleFunc("GET /api/folders/get", connData.authMiddleware(connData.getFoldersByRoom))
	http.HandleFunc("GET /api/folders/getdetails", connData.authMiddleware(connData.getFolderDetails))

	http.HandleFunc("GET /api/users/issignedin", connData.authMiddleware(isSignedIn))

	http.HandleFunc("POST /api/logout", connData.authMiddleware(connData.logout))

	// Session management endpoints
	http.HandleFunc("GET /api/sessions", connData.authMiddleware(connData.getSessions))
	http.HandleFunc("DELETE /api/sessions", connData.authMiddleware(connData.deleteSession))
	http.HandleFunc("DELETE /api/sessions/others", connData.authMiddleware(connData.deleteAllOtherSessions))
	http.HandleFunc("POST /api/change-password", connData.authMiddleware(connData.changePassword))

	http.HandleFunc("GET /api/export", exportHandler)

	http.HandleFunc("/api/ws", connData.authMiddleware(handleWebSocket))

	http.HandleFunc("POST /api/admin", connData.authMiddleware(conAdminData.adminQuery))

	// Start session cleanup scheduler
	go StartSessionCleanupScheduler(context.Background(), queries)

	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", nil)
}
