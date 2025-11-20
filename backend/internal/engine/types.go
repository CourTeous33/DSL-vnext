package engine

import (
	"sync"
)

// NodeType represents the type of work a node does
type NodeType string

const (
	NodeTypeTask   NodeType = "TASK"
	NodeTypeStart  NodeType = "START"
	NodeTypeEnd    NodeType = "END"
	NodeTypeLLM    NodeType = "LLM"
	NodeTypeResult NodeType = "RESULT"
)

// Position represents the x and y coordinates of a node
type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// Node represents a single step in the workflow
type Node struct {
	ID       string                 `json:"id"`
	Type     NodeType               `json:"type"`
	Position Position               `json:"position"`
	Data     map[string]interface{} `json:"data"` // React Flow uses 'data' object
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// Message represents data passed between nodes
type Message struct {
	From    string                 `json:"from"`
	To      string                 `json:"to"`
	Content map[string]interface{} `json:"content"`
}

// Edge represents a connection between nodes
type Edge struct {
	ID     string `json:"id"`
	Source string `json:"source"`
	Target string `json:"target"`
}

// Workflow represents the entire graph
type Workflow struct {
	ID     string            `json:"id"`
	Nodes  []Node            `json:"nodes"`
	Edges  []Edge            `json:"edges"`
	Config map[string]string `json:"config,omitempty"`
}

// ExecutionStatus represents the state of a node execution
type ExecutionStatus string

const (
	StatusPending ExecutionStatus = "PENDING"
	StatusRunning ExecutionStatus = "RUNNING"
	StatusSuccess ExecutionStatus = "SUCCESS"
	StatusFailed  ExecutionStatus = "FAILED"
)

// ExecutionContext holds the state of a running workflow
type ExecutionContext struct {
	WorkflowID string
	Status     map[string]ExecutionStatus
	Results    map[string]interface{}
	mu         sync.RWMutex
}

func NewExecutionContext(wfID string) *ExecutionContext {
	return &ExecutionContext{
		WorkflowID: wfID,
		Status:     make(map[string]ExecutionStatus),
		Results:    make(map[string]interface{}),
	}
}
