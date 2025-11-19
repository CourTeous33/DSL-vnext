package engine

import (
	"fmt"
)

// Context provides access to the runtime environment for a vertex
type Context struct {
	Step      int
	NodeID    string
	Workflow  *Workflow
	Execution *ExecutionContext
	Outbox    []Message
}

// SendMessage queues a message to be sent to another vertex in the next superstep
func (c *Context) SendMessage(to string, content map[string]interface{}) {
	c.Outbox = append(c.Outbox, Message{
		From:    c.NodeID,
		To:      to,
		Content: content,
	})
}

// Vertex defines the interface that all node types must implement
type Vertex interface {
	// Compute is called in each superstep.
	// messages: Messages sent to this vertex in the previous superstep.
	// Returns error if execution fails.
	Compute(ctx *Context, messages []Message) error
}

// VertexFactory creates Vertex instances based on NodeType
type VertexFactory func(nodeType NodeType) (Vertex, error)

// ExecuteBSP runs the workflow using the Bulk Synchronous Parallel model
func ExecuteBSP(wf Workflow, execCtx *ExecutionContext, factory VertexFactory) error {
	fmt.Printf("Starting BSP execution for workflow: %s\n", wf.ID)

	// 1. Initialize Vertices
	vertices := make(map[string]Vertex)
	for _, node := range wf.Nodes {
		v, err := factory(node.Type)
		if err != nil {
			return fmt.Errorf("failed to create vertex for node %s: %w", node.ID, err)
		}
		vertices[node.ID] = v
	}

	// 2. Initialize Messages (Step 0: Start nodes receive a trigger message)
	// We treat nodes with 0 in-degree as "Start" nodes implicitly, or look for specific types.
	// For BSP, we can just send an initial empty message to all nodes or specific start nodes.
	// Let's send an initial message to nodes with NodeTypeStart.
	inbox := make(map[string][]Message)
	for _, node := range wf.Nodes {
		if node.Type == NodeTypeStart {
			inbox[node.ID] = append(inbox[node.ID], Message{
				From:    "system",
				To:      node.ID,
				Content: map[string]interface{}{"type": "trigger"},
			})
		}
	}

	step := 0
	maxSteps := 100 // Safety limit

	for step < maxSteps {
		activeVertices := 0
		nextInbox := make(map[string][]Message)

		fmt.Printf("--- Superstep %d ---\n", step)

		// 3. Compute Phase
		for id, vertex := range vertices {
			msgs := inbox[id]

			// Optimization: Only compute if there are messages or it's the first step for some
			// In pure Pregel, vertices can "vote to halt". Here, we'll simplify:
			// If no messages, skip (unless it's a source node in step 0, handled above).
			if len(msgs) == 0 {
				continue
			}

			ctx := &Context{
				Step:      step,
				NodeID:    id,
				Workflow:  &wf,
				Execution: execCtx,
				Outbox:    make([]Message, 0),
			}

			activeVertices++
			if err := vertex.Compute(ctx, msgs); err != nil {
				return fmt.Errorf("error in superstep %d at node %s: %w", step, id, err)
			}

			// 4. Communication Phase (Route messages)
			for _, msg := range ctx.Outbox {
				nextInbox[msg.To] = append(nextInbox[msg.To], msg)
			}
		}

		if activeVertices == 0 {
			fmt.Println("No active vertices. Execution finished.")
			break
		}

		inbox = nextInbox
		step++
	}

	if step >= maxSteps {
		return fmt.Errorf("execution exceeded max steps (%d)", maxSteps)
	}

	return nil
}
