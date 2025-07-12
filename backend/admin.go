package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// QueryRequest is the expected JSON payload
type QueryRequest struct {
	Query string `json:"query"`
}

// QueryResponse contains the query results or error
type QueryResponse struct {
	Columns []string        `json:"columns"`
	Rows    [][]interface{} `json:"rows"`
	Error   string          `json:"error,omitempty"`
}

func (conn ConnectionDataAdmin) adminQuery(w http.ResponseWriter, r *http.Request) {

	// we check if user is indeed admin
	userEmail := r.Header.Get("email")
	res, err := conn.queries.CheckIfAdmin(r.Context(), userEmail)
	if err != nil || res != userEmail {
		http.Error(w, "You are not admin", http.StatusForbidden)
		return
	}

	var req QueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic security: Allow only SELECT queries
	query := strings.TrimSpace(req.Query)
	if !strings.HasPrefix(strings.ToUpper(query), "SELECT") {
		http.Error(w, "Only SELECT queries are allowed", http.StatusForbidden)
		return
	}

	rows, err := conn.pool.Query(r.Context(), query)
	if err != nil {
		http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusBadRequest)
		return
	}
	defer rows.Close()

	// Get column names
	columns := rows.FieldDescriptions()
	columnNames := make([]string, len(columns))
	for i, col := range columns {
		columnNames[i] = col.Name
	}

	// Fetch rows
	var resultRows [][]interface{}
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			http.Error(w, fmt.Sprintf("Error scanning row: %v", err), http.StatusInternalServerError)
			return
		}
		resultRows = append(resultRows, values)
	}

	// Check for errors after iteration
	if err := rows.Err(); err != nil {
		http.Error(w, fmt.Sprintf("Row iteration error: %v", err), http.StatusInternalServerError)
		return
	}

	// Send response
	resp := QueryResponse{
		Columns: columnNames,
		Rows:    resultRows,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
