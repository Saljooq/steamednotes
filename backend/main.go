package main

import (
	"encoding/json"
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
)

func main() {
	http.HandleFunc("/api/notes", getNotes)
	http.HandleFunc("/api/notes/create", createNote)
	http.HandleFunc("/api/signin", signIn)
	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", nil)
}

// Get all notes for signed-in user
func getNotes(w http.ResponseWriter, r *http.Request) {
	username := r.Header.Get("X-Username") // Temp auth
	if username == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	notesM.Lock()
	defer notesM.Unlock()
	var userNotes []Note
	for _, note := range notes {
		if note.Owner == username {
			userNotes = append(userNotes, note)
		}
	}
	json.NewEncoder(w).Encode(userNotes)
}

// Create a note
func createNote(w http.ResponseWriter, r *http.Request) {
	username := r.Header.Get("X-Username")
	if username == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var note Note
	if err := json.NewDecoder(r.Body).Decode(&note); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	notesM.Lock()
	defer notesM.Unlock()
	note.ID = nextID
	note.Owner = username
	nextID++
	notes = append(notes, note)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(note)
}

// Sign in
func signIn(w http.ResponseWriter, r *http.Request) {
	var creds User
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	for _, user := range users {
		if user.Username == creds.Username && user.Password == creds.Password {
			w.WriteHeader(http.StatusOK)
			fmt.Fprintf(w, "Signed in as %s", creds.Username)
			return
		}
	}
	http.Error(w, "Invalid credentials", http.StatusUnauthorized)
}
