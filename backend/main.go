package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"workflow-platform/engine"
	"workflow-platform/nodes"
)

func main() {
	http.HandleFunc("/api/execute", enableCors(handleExecute))
	fmt.Println("Starting Workflow Platform Backend on :8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func enableCors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("Request: %s %s\n", r.Method, r.URL.Path)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func handleExecute(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var wf engine.Workflow
	if err := json.NewDecoder(r.Body).Decode(&wf); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	fmt.Printf("Received workflow: %s with %d nodes\n", wf.ID, len(wf.Nodes))

	// Create ExecutionContext
	execCtx := engine.NewExecutionContext(wf.ID)

	// Define Vertex Factory
	factory := func(nodeType engine.NodeType) (engine.Vertex, error) {
		switch nodeType {
		case engine.NodeTypeLLM:
			return &nodes.LLMVertex{}, nil
		case engine.NodeTypeResult:
			return &nodes.ResultVertex{}, nil
		case engine.NodeTypeStart:
			// Start node can be a simple pass-through or specific logic
			return &nodes.LLMVertex{}, nil // Re-using LLMVertex as a dummy for now, or implement a PassThrough
		case engine.NodeTypeTask:
			return &nodes.LLMVertex{}, nil // Default to LLM for generic tasks for now
		default:
			return nil, fmt.Errorf("unknown node type: %s", nodeType)
		}
	}

	// Run BSP Engine Synchronously for now to return results immediately
	if err := engine.ExecuteBSP(wf, execCtx, factory); err != nil {
		fmt.Printf("Workflow execution failed: %v\n", err)
		http.Error(w, fmt.Sprintf("Workflow execution failed: %v", err), http.StatusInternalServerError)
		return
	}

	fmt.Println("Workflow execution completed successfully.")

	w.Header().Set("Content-Type", "application/json")
	// Return the results map directly
	json.NewEncoder(w).Encode(execCtx.Results)
}
