package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"workflow-platform/internal/api"
	"workflow-platform/internal/config"
	"workflow-platform/internal/db"
	"workflow-platform/internal/engine"
	"workflow-platform/internal/engine/nodes"
	"workflow-platform/internal/llm"
	"workflow-platform/internal/queue"
)

func main() {
	// Load Configuration
	cfg := config.Load()

	// Connect to Database
	database, err := db.Connect(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Connect to Redis
	redisClient, err := queue.NewRedisClient(cfg.Redis)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Client.Close()

	// Initialize Handlers
	wfHandler := api.NewWorkflowHandler(database)

	// Initialize LLM Client
	llmClient := llm.NewOpenAIClient(cfg.LLM.APIKey, cfg.LLM.Model)

	http.HandleFunc("/api/execute", enableCors(handleExecute(llmClient)))
	http.HandleFunc("/api/workflows", enableCors(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			wfHandler.SaveWorkflow(w, r)
		} else if r.Method == http.MethodGet {
			if r.URL.Query().Get("id") != "" {
				wfHandler.GetWorkflow(w, r)
			} else {
				wfHandler.ListWorkflows(w, r)
			}
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	fmt.Printf("Starting Workflow Platform Backend on :%s...\n", cfg.Server.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Server.Port, nil))
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

func handleExecute(llmClient llm.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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

		// Determine which LLM client to use
		currentLLMClient := llmClient
		if apiKey, ok := wf.Config["openai_api_key"]; ok && apiKey != "" {
			fmt.Println("Using API key from frontend request")
			currentLLMClient = llm.NewOpenAIClient(apiKey, "gpt-4") // Default to gpt-4 or read from config
		}

		// Define Vertex Factory
		factory := func(nodeType engine.NodeType) (engine.Vertex, error) {
			switch nodeType {
			case engine.NodeTypeLLM:
				return &nodes.LLMVertex{Client: currentLLMClient}, nil
			case engine.NodeTypeResult:
				return &nodes.ResultVertex{}, nil
			case engine.NodeTypeStart:
				return &nodes.LLMVertex{Client: currentLLMClient}, nil
			case engine.NodeTypeTask:
				return &nodes.LLMVertex{Client: currentLLMClient}, nil
			default:
				return nil, fmt.Errorf("unknown node type: %s", nodeType)
			}
		}

		// Run BSP Engine Synchronously for now (Migration in progress)
		if err := engine.ExecuteBSP(wf, execCtx, factory); err != nil {
			fmt.Printf("Workflow execution failed: %v\n", err)
			http.Error(w, fmt.Sprintf("Workflow execution failed: %v", err), http.StatusInternalServerError)
			return
		}

		fmt.Println("Workflow execution completed successfully.")

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(execCtx.Results)
	}
}
