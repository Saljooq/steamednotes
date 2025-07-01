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

func (conn ConnectionData) getNote(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("id")
	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	// Get room_id from query parameter
	noteIDStr := r.URL.Query().Get("note_id")
	if noteIDStr == "" {
		http.Error(w, "Missing note_id parameter", http.StatusBadRequest)
		return
	}

	// Convert room_id to integer
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note_id", http.StatusBadRequest)
		return
	}

	note, err := conn.queries.FindNotesById(r.Context(), int32(noteID))

	if note.UserID != int32(iuserID) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err != nil {
		http.Error(w, "Error in getting note by id", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(note)
}

type UpdateNoteRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	ID      int32  `json:"id"`
}

func (conn ConnectionData) updateNote(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("id")
	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	var noteUpdate UpdateNoteRequest

	if err := json.NewDecoder(r.Body).Decode(&noteUpdate); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		println(err.Error())
		return
	}

	err = conn.queries.UpdateNoteNameAndContent(r.Context(), db.UpdateNoteNameAndContentParams{
		Title:   noteUpdate.Title,
		Content: noteUpdate.Content,
		ID:      noteUpdate.ID,
		UserID:  int32(iuserID),
	})

	if err != nil {
		http.Error(w, "Something went wrong, unable to update note", http.StatusBadRequest)
	}

}

func (conn ConnectionData) deleteNote(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("id")
	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	// Get room_id from query parameter
	noteIDStr := r.URL.Query().Get("note_id")
	if noteIDStr == "" {
		http.Error(w, "Missing note_id parameter", http.StatusBadRequest)
		return
	}

	// Convert room_id to integer
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note_id", http.StatusBadRequest)
		return
	}

	err = conn.queries.DeleteNote(r.Context(), db.DeleteNoteParams{
		ID:     int32(noteID),
		UserID: int32(iuserID),
	})

	if err != nil {
		http.Error(w, "Error deleting note", http.StatusBadRequest)
		return
	}

}

// Get all notes for signed-in user
func (conn ConnectionData) getNotes(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("id")
	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	// Get room_id from query parameter
	folderIDStr := r.URL.Query().Get("folder_id")
	if folderIDStr == "" {
		http.Error(w, "Missing folder_id parameter", http.StatusBadRequest)
		return
	}

	// Convert room_id to integer
	folderID, err := strconv.Atoi(folderIDStr)
	if err != nil {
		http.Error(w, "Invalid folder_id", http.StatusBadRequest)
		return
	}

	res, err := conn.queries.FindNotesByFolder(r.Context(),
		db.FindNotesByFolderParams{FolderID: int32(folderID), UserID: int32(iuserID)})

	if err != nil {
		http.Error(w, "Error in getting folders by room", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(res)
}

func (conn ConnectionData) getFolderDetails(w http.ResponseWriter, r *http.Request) {

	userID := r.Header.Get("id")
	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	// Get room_id from query parameter
	folderIDStr := r.URL.Query().Get("folder_id")
	if folderIDStr == "" {
		http.Error(w, "Missing folder_id parameter", http.StatusBadRequest)
		return
	}

	// Convert room_id to integer
	folderID, err := strconv.Atoi(folderIDStr)
	if err != nil {
		http.Error(w, "Invalid folder_id", http.StatusBadRequest)
		return
	}

	folder, err := conn.queries.FindFolderById(r.Context(), int32(folderID))

	if err != nil {
		http.Error(w, "Error finding folder by id", http.StatusBadRequest)
		return
	}

	if folder.UserID != int32(iuserID) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode(folder)
}

type CreateNoteRequest struct {
	Name     string `json:"note_name"`
	FolderId int32  `json:"folder_id"`
}

// Create a note
func (conn ConnectionData) createNote(w http.ResponseWriter, r *http.Request) {

	userID := r.Header.Get("id")

	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	var note CreateNoteRequest

	if err := json.NewDecoder(r.Body).Decode(&note); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		println(err.Error())
		return
	}

	folder, err := conn.queries.FindFolderById(r.Context(), note.FolderId)

	if err != nil {
		http.Error(w, "Error getting room details", http.StatusBadRequest)
		return
	}

	if folder.UserID != int32(iuserID) {
		http.Error(w, "Unauthorized request - no write access to folder", http.StatusForbidden)
		return
	}

	res, err := conn.queries.CreateNote(r.Context(),
		db.CreateNoteParams{
			RoomID:     folder.RoomID,
			UserID:     int32(iuserID),
			Title:      note.Name,
			Content:    "",
			FolderName: folder.Name,
			RoomName:   folder.RoomName,
			FolderID:   folder.ID,
		})

	if err != nil {
		http.Error(w, "Error in creating a new folder", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(res)

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
	RoomName string `json:"room_name"`
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
		return
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

type CreateFolderRequest struct {
	RoomId int32  `json:"room_id"`
	Name   string `json:"folder_name"`
}

func (conn ConnectionData) createFolder(w http.ResponseWriter, r *http.Request) {

	userID := r.Header.Get("id")

	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	var folder CreateFolderRequest

	if err := json.NewDecoder(r.Body).Decode(&folder); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		println(err.Error())
		return
	}

	room, err := conn.queries.FindRoomById(r.Context(), folder.RoomId)

	if err != nil {
		http.Error(w, "Error getting room details", http.StatusBadRequest)
		return
	}

	res, err := conn.queries.CreateFolder(r.Context(),
		db.CreateFolderParams{
			RoomID:   folder.RoomId,
			UserID:   int32(iuserID),
			Name:     folder.Name,
			RoomName: room.Name})

	if err != nil {
		http.Error(w, "Error in creating a new folder", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(res)
}

func (conn ConnectionData) getFoldersByRoom(w http.ResponseWriter, r *http.Request) {

	userID := r.Header.Get("id")
	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	// Get room_id from query parameter
	roomIDStr := r.URL.Query().Get("room_id")
	if roomIDStr == "" {
		http.Error(w, "Missing room_id parameter", http.StatusBadRequest)
		return
	}

	// Convert room_id to integer
	roomID, err := strconv.Atoi(roomIDStr)
	if err != nil {
		http.Error(w, "Invalid room_id", http.StatusBadRequest)
		return
	}

	res, err := conn.queries.FindFoldersByRoom(r.Context(),
		db.FindFoldersByRoomParams{RoomID: int32(roomID), UserID: int32(iuserID)})

	if err != nil {
		http.Error(w, "Error in getting folders by room", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(res)
}

type RoomDetailsRes struct {
	RoomName string `json:"room_name"`
}

func (conn ConnectionData) getRoomDetails(w http.ResponseWriter, r *http.Request) {

	userID := r.Header.Get("id")
	iuserID, err := strconv.Atoi(userID)

	if err != nil {
		http.Error(w, "User validation error, user id is not the right format", http.StatusBadRequest)
		return
	}

	// Get room_id from query parameter
	roomIDStr := r.URL.Query().Get("room_id")
	if roomIDStr == "" {
		http.Error(w, "Missing room_id parameter", http.StatusBadRequest)
		return
	}

	// Convert room_id to integer
	roomID, err := strconv.Atoi(roomIDStr)
	if err != nil {
		http.Error(w, "Invalid room_id", http.StatusBadRequest)
		return
	}

	room, err := conn.queries.FindRoomById(r.Context(), int32(roomID))

	if err != nil {
		http.Error(w, "Error finding room by id", http.StatusBadRequest)
		return
	}

	if room.UserID != int32(iuserID) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode(RoomDetailsRes{RoomName: room.Name})
}

func (conn ConnectionData) logout(w http.ResponseWriter, r *http.Request) {

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Expires:  time.Unix(0, 0), // Unix epoch: Jan 1, 1970
		MaxAge:   -1,              // Immediately delete in all browsers
		HttpOnly: true,
		Path:     "/",
	})
}

func isSignedIn(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"Result": "Success"})
}
