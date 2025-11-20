# Workflow Runner - High-Performance Distributed System

A scalable, high-performance workflow execution engine built with Go, designed for real-time state management and LLM-powered workflows.

For detailed documentation, architecture deep-dives, and design principles, please refer to [GEMINI.md](./GEMINI.md).

## Key Features

- **Visual Workflow Editor**: Drag-and-drop interface for building workflows.
- **Asynchronous Execution**: Non-blocking workflow execution with job queuing via Redis Streams.
- **Real-time Monitoring**: Live status updates via WebSocket connections.
- **LLM Integration**: Built-in support for LLM-powered workflow steps with memory management.
- **Horizontal Scaling**: Worker pools can scale independently based on workload.
- **Fault Tolerance**: Automatic retry mechanisms and error recovery.

## Technology Stack

### Backend
- **Language**: Go 1.21+
- **Framework**: Standard Library (net/http)
- **Database**: PostgreSQL 15+ (with pgvector)
- **Cache/Queue**: Redis 7.0+

### Frontend
- **Framework**: React 19+
- **Editor**: React Flow
- **State**: React Hooks / Context

## Getting Started

### Prerequisites
- Go 1.21+
- Node.js 18+
- Docker & Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourorg/workflow-runner.git
   cd workflow-runner
   ```

2. **Start Infrastructure**
   ```bash
   docker-compose up -d redis postgres
   ```

3. **Backend Setup**
   ```bash
   cd backend
   go mod download
   go run cmd/server/main.go
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Architecture Overview

The system consists of a stateless frontend editor, an API Gateway, a Redis-based Job Queue, and a pool of Workers that execute workflow steps. State is managed in Redis for real-time access and persisted to PostgreSQL for long-term storage.

For a complete architectural breakdown, see [GEMINI.md](./GEMINI.md#architecture).
