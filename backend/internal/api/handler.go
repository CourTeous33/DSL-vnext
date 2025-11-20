package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"workflow-platform/internal/engine"
)

type WorkflowHandler struct {
	DB *sql.DB
}

func NewWorkflowHandler(db *sql.DB) *WorkflowHandler {
	return &WorkflowHandler{DB: db}
}

type SavedWorkflow struct {
	ID         string          `json:"id"`
	Name       string          `json:"name"`
	Definition engine.Workflow `json:"definition"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

func (h *WorkflowHandler) SaveWorkflow(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ID         string          `json:"id"`
		Name       string          `json:"name"`
		Definition engine.Workflow `json:"definition"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	fmt.Printf("Received Save Request: ID=%s, Name=%s, Nodes=%d\n", req.ID, req.Name, len(req.Definition.Nodes))

	// Upsert workflow
	query := `
		INSERT INTO workflows (id, name, definition, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (id) DO UPDATE
		SET name = $2, definition = $3, updated_at = NOW()
	`

	defJSON, err := json.Marshal(req.Definition)
	if err != nil {
		http.Error(w, "Failed to marshal definition", http.StatusInternalServerError)
		return
	}

	_, err = h.DB.Exec(query, req.ID, req.Name, defJSON)
	if err != nil {
		fmt.Printf("Error saving workflow: %v\n", err)
		http.Error(w, "Failed to save workflow", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "saved"})
}

func (h *WorkflowHandler) ListWorkflows(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := h.DB.Query("SELECT id, name, created_at, updated_at FROM workflows ORDER BY updated_at DESC")
	if err != nil {
		http.Error(w, "Failed to list workflows", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var workflows []SavedWorkflow
	for rows.Next() {
		var wf SavedWorkflow
		if err := rows.Scan(&wf.ID, &wf.Name, &wf.CreatedAt, &wf.UpdatedAt); err != nil {
			continue
		}
		workflows = append(workflows, wf)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workflows)
}

func (h *WorkflowHandler) GetWorkflow(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	var wf SavedWorkflow
	var defJSON []byte
	err := h.DB.QueryRow("SELECT id, name, definition, created_at, updated_at FROM workflows WHERE id = $1", id).
		Scan(&wf.ID, &wf.Name, &defJSON, &wf.CreatedAt, &wf.UpdatedAt)

	if err == sql.ErrNoRows {
		http.Error(w, "Workflow not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Failed to get workflow", http.StatusInternalServerError)
		return
	}

	if err := json.Unmarshal(defJSON, &wf.Definition); err != nil {
		http.Error(w, "Failed to unmarshal definition", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wf)
}
