package nodes

import (
	"fmt"
	"time"

	"workflow-platform/internal/engine"
)

// LLMVertex simulates an LLM invocation
type LLMVertex struct{}

func (v *LLMVertex) Compute(ctx *engine.Context, messages []engine.Message) error {
	// 1. Check if we have inputs (either from trigger or previous nodes)
	// For simplicity, if it's step 0, we run. If > 0, we run if we have messages.

	fmt.Printf("[LLMVertex %s] Computing at step %d. Messages: %d\n", ctx.NodeID, ctx.Step, len(messages))

	// Simulate processing inputs to form a prompt
	var inputData string
	for _, msg := range messages {
		if val, ok := msg.Content["result"]; ok {
			inputData += fmt.Sprintf("%v ", val)
		}
	}

	// Retrieve prompt from node data
	var prompt string
	for _, node := range ctx.Workflow.Nodes {
		if node.ID == ctx.NodeID {
			fmt.Printf("[LLMVertex %s] Node Data: %+v\n", ctx.NodeID, node.Data)
			if p, ok := node.Data["prompt"].(string); ok {
				prompt = p
				fmt.Printf("[LLMVertex %s] Found prompt: %s\n", ctx.NodeID, prompt)
			} else {
				fmt.Printf("[LLMVertex %s] Prompt not found or not a string. Type: %T\n", ctx.NodeID, node.Data["prompt"])
			}
			break
		}
	}

	// Simulate LLM call
	time.Sleep(500 * time.Millisecond)

	// Combine prompt and inputs
	fullInput := prompt
	if inputData != "" {
		fullInput = fmt.Sprintf("%s\nContext: %s", prompt, inputData)
	}

	result := fmt.Sprintf("LLM Response to: '%s'", fullInput)
	if fullInput == "" {
		result = "LLM Response (No prompt or input)"
	}

	// Simulate error if prompt is "error"
	if inputData == "error " || inputData == "error" { // inputData has a trailing space from the loop
		return fmt.Errorf("simulated LLM failure")
	}

	// Store result in ExecutionContext for frontend debugging
	ctx.Execution.Results[ctx.NodeID] = map[string]interface{}{
		"result":       result,
		"debug_prompt": prompt,
		"timestamp":    time.Now().Format(time.RFC3339),
	}

	// Send result to all children
	// We need to find outgoing edges from this node
	for _, edge := range ctx.Workflow.Edges {
		if edge.Source == ctx.NodeID {
			ctx.SendMessage(edge.Target, map[string]interface{}{
				"result": result,
			})
		}
	}

	return nil
}

// ResultVertex displays/stores the result
type ResultVertex struct{}

func (v *ResultVertex) Compute(ctx *engine.Context, messages []engine.Message) error {
	fmt.Printf("[ResultVertex %s] Received results: %d\n", ctx.NodeID, len(messages))

	for _, msg := range messages {
		fmt.Printf("  -> From %s: %v\n", msg.From, msg.Content)
		// Store in ExecutionContext
		ctx.Execution.Results[ctx.NodeID] = msg.Content
	}

	return nil
}
