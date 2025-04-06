package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

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
