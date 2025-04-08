package main

import (
	"fmt"
	"net/http"
	"sync"
)

// Dummy user struct
type User struct {
	Username string
	Password string // Plaintext for now—hash later
}

// Note struct
type Note struct {
	ID      int
	Content string
	Owner   string
}

// In-memory store
var (
	users = []User{
		{Username: "alice", Password: "pass123"},
		{Username: "bob", Password: "secret"},
	}
	notes  []Note
	notesM sync.Mutex // Thread-safe
	nextID = 1
	secret = []byte("super-secret-key")
)

func main() {
	http.HandleFunc("/api/notes", authMiddleware(getNotes))
	http.HandleFunc("/api/notes/create", authMiddleware(createNote))
	http.HandleFunc("/api/signin", signIn)
	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", nil)
}
