package llm

import (
	"context"
	"fmt"

	openai "github.com/sashabaranov/go-openai"
)

// Client defines the interface for LLM interactions
type Client interface {
	Generate(ctx context.Context, prompt string) (string, error)
}

// OpenAIClient implements Client for OpenAI
type OpenAIClient struct {
	client *openai.Client
	model  string
}

// NewOpenAIClient creates a new OpenAI client
func NewOpenAIClient(apiKey string, model string) *OpenAIClient {
	return &OpenAIClient{
		client: openai.NewClient(apiKey),
		model:  model,
	}
}

// Generate generates text based on the prompt
func (c *OpenAIClient) Generate(ctx context.Context, prompt string) (string, error) {
	resp, err := c.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: c.model,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
		},
	)

	if err != nil {
		return "", fmt.Errorf("OpenAI API error: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no choices returned from OpenAI")
	}

	return resp.Choices[0].Message.Content, nil
}

// MockClient for testing or when no API key is provided
type MockClient struct{}

func (c *MockClient) Generate(ctx context.Context, prompt string) (string, error) {
	return fmt.Sprintf("[MOCK] Response to: %s", prompt), nil
}
