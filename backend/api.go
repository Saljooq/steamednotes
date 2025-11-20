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

	fmt.Printf("Attempting login for email: %s\n", creds.Email)
	user, err := conn.queries.FindUserByEmail(r.Context(), creds.Email)

	if err != nil {
		fmt.Printf("Error finding user by email: %v\n", err)
		http.Error(w, "Invalid email", http.StatusInternalServerError)
		return
	} else {
		fmt.Printf("Found user with email %s, ID: %d\n", creds.Email, user.ID)
		fmt.Printf("Stored password hash: %s\n", user.PasswordHash)
		fmt.Printf("Provided password: %s\n", creds.Password)
	}

	if user.PasswordHash == creds.Password {
		fmt.Printf("Password match for user %s\n", creds.Email)
		// Create session in database
		session, err := CreateSession(r.Context(), conn.queries, user.ID, r)
		if err != nil {
			fmt.Printf("Failed to create session: %v\n", err)
			http.Error(w, "Failed to create session: "+err.Error(), http.StatusInternalServerError)
			return
		}
		fmt.Printf("Session created successfully with ID %d\n", session.ID)

		// Create JWT with session ID
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
			Email:     creds.Email,
			ID:        strconv.Itoa(int(user.ID)),
			SessionID: strconv.Itoa(int(session.ID)),
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
			Expires:  time.Now().Add(7 * 24 * time.Hour), // Match session expiry
			HttpOnly: true,                               // Prevent JS access
			Path:     "/",
			Secure:   false, // Allow for HTTP (set to true in production with HTTPS)
			SameSite: http.SameSiteLaxMode,
		})

		fmt.Printf("Signed in as %s with session %d\n", creds.Email, session.ID)

		json.NewEncoder(w).Encode(map[string]string{
			"username":   user.Username,
			"session_id": strconv.Itoa(int(session.ID)),
		})
		return
	} else {
		fmt.Printf("Password mismatch for user %s. Expected: %s, Got: %s\n", creds.Email, user.PasswordHash, creds.Password)
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
	// Get session ID from headers
	sessionIDStr := r.Header.Get("session_id")
	userIDStr := r.Header.Get("id")

	if sessionIDStr != "" && userIDStr != "" {
		sessionID, err1 := strconv.Atoi(sessionIDStr)
		userID, err2 := strconv.Atoi(userIDStr)

		if err1 == nil && err2 == nil {
			// Deactivate the specific session
			conn.queries.DeactivateSession(r.Context(), db.DeactivateSessionParams{
				ID:     int32(sessionID),
				UserID: int32(userID),
			})
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Expires:  time.Unix(0, 0), // Unix epoch: Jan 1, 1970
		MaxAge:   -1,              // Immediately delete in all browsers
		HttpOnly: true,
		Path:     "/",
	})
}

// SessionDTO represents a clean session for JSON response
type SessionDTO struct {
	ID             int32  `json:"id"`
	UserID         int32  `json:"user_id"`
	DeviceName     string `json:"device_name"`
	DeviceType     string `json:"device_type"`
	BrowserName    string `json:"browser_name"`
	BrowserVersion string `json:"browser_version"`
	OSName         string `json:"os_name"`
	OSVersion      string `json:"os_version"`
	IPAddress      string `json:"ip_address"`
	UserAgent      string `json:"user_agent"`
	CreatedAt      string `json:"created_at"`
	LastUsedAt     string `json:"last_used_at"`
	ExpiresAt      string `json:"expires_at"`
	IsActive       bool   `json:"is_active"`
}

// Get all sessions for the current user
func (conn ConnectionData) getSessions(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("id")
	fmt.Printf("Getting sessions for user ID: %s\n", userIDStr)

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		fmt.Printf("Invalid user ID error: %v\n", err)
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	sessions, err := GetSessionForUser(r.Context(), conn.queries, int32(userID))
	if err != nil {
		fmt.Printf("Failed to get sessions: %v\n", err)
		http.Error(w, "Failed to get sessions", http.StatusInternalServerError)
		return
	}

	fmt.Printf("Found %d sessions for user %d\n", len(sessions), userID)

	// Convert to clean DTOs
	sessionDTOs := make([]SessionDTO, len(sessions))
	for i, session := range sessions {
		sessionDTOs[i] = SessionDTO{
			ID:             session.ID,
			UserID:         session.UserID,
			DeviceName:     session.DeviceName.String,
			DeviceType:     session.DeviceType.String,
			BrowserName:    session.BrowserName.String,
			BrowserVersion: session.BrowserVersion.String,
			OSName:         session.OsName.String,
			OSVersion:      session.OsVersion.String,
			IPAddress:      session.IpAddress.String(),
			UserAgent:      session.UserAgent.String,
			CreatedAt:      session.CreatedAt.Time.Format(time.RFC3339),
			LastUsedAt:     session.LastUsedAt.Time.Format(time.RFC3339),
			ExpiresAt:      session.ExpiresAt.Time.Format(time.RFC3339),
			IsActive:       session.IsActive.Bool,
		}

		fmt.Printf("Session %d: ID=%d, Device=%s, Browser=%s, Active=%v\n",
			i+1, session.ID, session.DeviceName.String, session.BrowserName.String, session.IsActive.Bool)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessionDTOs)
}

// Delete a specific session
func (conn ConnectionData) deleteSession(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Get session ID from query parameter
	sessionIDStr := r.URL.Query().Get("session_id")
	if sessionIDStr == "" {
		http.Error(w, "Missing session_id parameter", http.StatusBadRequest)
		return
	}

	sessionID, err := strconv.Atoi(sessionIDStr)
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}

	err = DeleteSession(r.Context(), conn.queries, int32(sessionID), int32(userID))
	if err != nil {
		http.Error(w, "Failed to delete session", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Session deleted successfully"})
}

// Delete all sessions except current
func (conn ConnectionData) deleteAllOtherSessions(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	currentSessionIDStr := r.Header.Get("session_id")
	currentSessionID, err := strconv.Atoi(currentSessionIDStr)
	if err != nil {
		http.Error(w, "Invalid current session ID", http.StatusBadRequest)
		return
	}

	err = DeleteAllOtherSessions(r.Context(), conn.queries, int32(currentSessionID), int32(userID))
	if err != nil {
		http.Error(w, "Failed to delete other sessions", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Other sessions deleted successfully"})
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// Change password without invalidating sessions
func (conn ConnectionData) changePassword(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Validate input
	if req.CurrentPassword == "" || req.NewPassword == "" {
		http.Error(w, "Current password and new password are required", http.StatusBadRequest)
		return
	}

	// Get current user
	user, err := conn.queries.FindUserById(r.Context(), int32(userID))
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Verify current password
	if user.PasswordHash != req.CurrentPassword {
		http.Error(w, "Current password is incorrect", http.StatusUnauthorized)
		return
	}

	// Update password (keeping sessions active)
	err = conn.queries.UpdateUserPassword(r.Context(), db.UpdateUserPasswordParams{
		ID:           int32(userID),
		PasswordHash: req.NewPassword,
	})
	if err != nil {
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Password updated successfully"})
}

func isSignedIn(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"Result": "Success"})
}
