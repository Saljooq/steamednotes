package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"

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

// In-memory store
var (
	// users = []User{
	// 	{Username: "alice", Password: "pass123"},
	// 	{Username: "bob", Password: "secret"},
	// }
	notes  []Note
	notesM sync.Mutex // Thread-safe
	nextID = 1
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

	// HTTP server
	// mux := http.NewServeMux()

	queries := db.New(conn)
	conData := ConnectionData{queries: queries}

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

	http.HandleFunc("GET /api/notes", authMiddleware(getNotes))
	http.HandleFunc("POST /api/notes/create", authMiddleware(createNote))
	http.HandleFunc("POST /api/signin", conData.signIn)

	http.HandleFunc("GET /api/users/create", createUser)
	http.HandleFunc("POST /api/rooms/create", authMiddleware(conData.createRoom))
	http.HandleFunc("GET /api/rooms/get", authMiddleware(conData.getRooms))
	http.HandleFunc("POST /api/folders/create", authMiddleware(createFolder))
	http.HandleFunc("GET /api/folders/get", authMiddleware(getFolder))

	http.HandleFunc("GET /api/users/issignedin", authMiddleware(isSignedIn))


	http.HandleFunc("POST /api/logout", authMiddleware(conData.logout))
	// await fetch('/api/logout', { method: 'POST', credentials: 'include' })
	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", nil)
}
