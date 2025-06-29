package main

import (
	"archive/zip"
	"bytes"
	"net/http"
	"path/filepath"
	"strings"
)

type Note2 struct {
	Title   string
	Content string
}

type Room struct {
	Name  string
	Notes []Note2
}

func getUserData(userID string) []Room {
	return []Room{
		{
			Name: "room1",
			Notes: []Note2{
				{"note1", "This is the first note."},
				{"note2", "Another note here."},
			},
		},
		{
			Name: "room2",
			Notes: []Note2{
				{"noteA", "Important content for note A."},
			},
		},
	}
}

func exportHandler(w http.ResponseWriter, r *http.Request) {
	userID := "someUserID" // Replace with session-based user ID
	data := getUserData(userID)

	var buf bytes.Buffer
	zipWriter := zip.NewWriter(&buf)

	for _, room := range data {
		roomPath := sanitize(room.Name) + "/"
		for _, note := range room.Notes {
			filePath := filepath.Join(roomPath, sanitize(note.Title)+".txt")

			f, err := zipWriter.Create(filePath)
			if err != nil {
				http.Error(w, "Failed to write zip entry", http.StatusInternalServerError)
				return
			}
			_, err = f.Write([]byte(note.Content))
			if err != nil {
				http.Error(w, "Failed to write file content", http.StatusInternalServerError)
				return
			}
		}
	}

	if err := zipWriter.Close(); err != nil {
		http.Error(w, "Failed to finalize zip", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", `attachment; filename="notes_export.zip"`)
	w.Write(buf.Bytes())
}

func sanitize(name string) string {
	// Remove or replace invalid filename characters
	return strings.Map(func(r rune) rune {
		if r == '/' || r == '\\' || r == ':' || r == '*' || r == '?' || r == '"' || r == '<' || r == '>' || r == '|' {
			return '-'
		}
		return r
	}, name)
}
