package main

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

// Upgrade HTTP connection to WebSocket
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins
		// Should it be restricted in prod?
		return true
	},
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("id")

	fmt.Println(userID)

	// Upgrade connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	fmt.Println("Client connected")

	// Send a welcome message
	if err := conn.WriteMessage(websocket.TextMessage, []byte("Welcome to SteamedNotes WS!")); err != nil {
		fmt.Println("Write error:", err)
		return
	}

	// Echo loop
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Read error:", err)
			break
		}
		fmt.Printf("Received: %s\n", msg)

		// Echo back
		if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			fmt.Println("Write error:", err)
			break
		}
	}
}
