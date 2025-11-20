package engine

import (
	"fmt"
	"time"
)

type Engine struct {
}

func NewEngine() *Engine {
	return &Engine{}
}

func (e *Engine) Run(wf Workflow) {
	fmt.Printf("Starting execution of workflow: %s\n", wf.ID)

	// Build adjacency list and in-degree map
	adj := make(map[string][]string)
	inDegree := make(map[string]int)
	nodes := make(map[string]Node)

	for _, node := range wf.Nodes {
		nodes[node.ID] = node
		inDegree[node.ID] = 0
	}

	for _, edge := range wf.Edges {
		adj[edge.Source] = append(adj[edge.Source], edge.Target)
		inDegree[edge.Target]++
	}

	// Channel to signal node completion
	// We send the ID of the completed node
	done := make(chan string)

	// Find initial nodes (in-degree 0)
	var activeNodes int
	for id, deg := range inDegree {
		if deg == 0 {
			go e.executeNode(nodes[id], done)
			activeNodes++
		}
	}

	// Event loop
	for activeNodes > 0 {
		completedNodeID := <-done
		activeNodes--

		// Check children
		for _, childID := range adj[completedNodeID] {
			inDegree[childID]--
			if inDegree[childID] == 0 {
				go e.executeNode(nodes[childID], done)
				activeNodes++
			}
		}
	}

	fmt.Printf("Workflow %s execution completed.\n", wf.ID)
}

func (e *Engine) executeNode(node Node, done chan<- string) {
	fmt.Printf("Executing node: %v (%s)\n", node.Data["label"], node.Type)

	// Simulate work
	time.Sleep(1 * time.Second)

	fmt.Printf("Node finished: %v\n", node.Data["label"])
	done <- node.ID
}
