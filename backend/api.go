package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Get all notes for signed-in user
func getNotes(w http.ResponseWriter, r *http.Request) {
	username := r.Header.Get("Username")
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

// Get all notes for signed-in user
func health(w http.ResponseWriter, r *http.Request) {
	username := r.Header.Get("Username")
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
	username := r.Header.Get("Username")
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
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
				Username: creds.Username,
				RegisteredClaims: jwt.RegisteredClaims{
					ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
				},
			})
			tokenString, err := token.SignedString(secret)
			if err != nil {
				http.Error(w, "Server error", http.StatusInternalServerError)
				return
			}
			http.SetCookie(w, &http.Cookie{
				Name:     "token",
				Value:    tokenString,
				Expires:  time.Now().Add(24 * time.Hour),
				HttpOnly: true, // Prevent JS access
				Path:     "/",
			})
			fmt.Fprintf(w, "Signed in as %s", creds.Username)
			return
		}
	}
	http.Error(w, "Invalid credentials", http.StatusUnauthorized)
}
