package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"steamednotes/db"
	"strconv"
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
func (conn ConnectionData) signIn(w http.ResponseWriter, r *http.Request) {
	var creds User
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	user, err := conn.queries.FindUserByEmail(r.Context(), creds.Email)

	if err != nil {
		http.Error(w, "Invalid email", http.StatusInternalServerError)
		return
	} else {
		fmt.Printf("Found user with email %s\n", creds.Email)
	}

	if user.PasswordHash == creds.Password {
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
			Email: creds.Email,
			ID:    strconv.Itoa(int(user.ID)),
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
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

		fmt.Printf("Signed in as %s", creds.Email)

		json.NewEncoder(w).Encode(map[string]string{"username": user.Username})
		return
	}
	http.Error(w, "Invalid credentials", http.StatusUnauthorized)
}

func createUser(w http.ResponseWriter, r *http.Request) {

}

type CreateRoomRequest struct {
	RoomName string `json:"roomname"`
}

func (conn ConnectionData) createRoom(w http.ResponseWriter, r *http.Request) {

	userID := r.Header.Get("id")

	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	var room CreateRoomRequest

	if err := json.NewDecoder(r.Body).Decode(&room); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err = conn.queries.CreateRoom(r.Context(), db.CreateRoomParams{Name: room.RoomName, UserID: int32(iuserID)})

	if err != nil {
		http.Error(w, "Invalid request, perhaps name already used", http.StatusConflict)
		fmt.Printf("Error in creating a room: %s", err.Error())
	} else {
		w.WriteHeader(http.StatusCreated)
	}
}

func (conn ConnectionData) getRooms(w http.ResponseWriter, r *http.Request) {

	userID := r.Header.Get("id")

	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	fmt.Printf("Processing getRooms for %d\n", iuserID)

	rooms, err := conn.queries.FindRoomsByUser(r.Context(), int32(iuserID))

	if err != nil {
		fmt.Printf("Error fetching rooms. Error: %s", err.Error())
		json.NewEncoder(w).Encode([]db.Room{})
	} else {
		json.NewEncoder(w).Encode(rooms)
	}

}

func createFolder(w http.ResponseWriter, r *http.Request) {}
func getFolder(w http.ResponseWriter, r *http.Request)    {}

func isSignedIn(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"Result": "Success"})
}
