package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/api/notes", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello from Go API!")
	})
	http.ListenAndServe(":8080", nil)
}
