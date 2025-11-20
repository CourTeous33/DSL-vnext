# Workflow Runner - High-Performance Distributed System

A scalable, high-performance workflow execution engine built with Go, designed for real-time state management and LLM-powered workflows.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [System Components](#system-components)
- [Performance Optimizations](#performance-optimizations)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Development Guide](#development-guide)
- [Monitoring & Observability](#monitoring--observability)
- [Deployment](#deployment)

## Overview

The Workflow Runner is a distributed system designed to execute complex, multi-step workflows with real-time state tracking and LLM integration. The system prioritizes performance, scalability, and reliability through careful architectural decisions and Go's concurrency primitives.

### Design Principles

1. **Stateless Frontend**: The editor maintains no state, delegating all execution to the backend
2. **Asynchronous Execution**: Workflows execute asynchronously via worker pools for optimal throughput
3. **Real-time Updates**: WebSocket connections provide instant status updates to clients
4. **Horizontal Scalability**: Worker pools can scale independently based on workload
5. **Data Separation**: Hot state in Redis, cold storage in database for optimal performance

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Frontend (React/Vue) - Stateless Workflow Editor      │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer (Go)                        │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │   API Gateway    │  │  WebSocket Hub   │                     │
│  │   (HTTP/REST)    │  │  (Real-time)     │                     │
│  └──────────────────┘  └──────────────────┘                     │
│           │                     │                                │
│           │                     │                                │
│  ┌────────▼─────────────────────▼────────┐                      │
│  │         Job Queue Manager              │                      │
│  │    (Redis Streams/Pub-Sub)             │                      │
│  └────────┬───────────────────────────────┘                      │
│           │                                                       │
│           │                                                       │
│  ┌────────▼─────────────────────────────────────────┐           │
│  │            Worker Pool                            │           │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │           │
│  │  │ Worker 1 │  │ Worker 2 │  │ Worker N │       │           │
│  │  └──────────┘  └──────────┘  └──────────┘       │           │
│  └───────┬──────────────┬───────────────┬───────────┘           │
│          │              │               │                        │
│  ┌───────▼──────┐  ┌───▼──────┐  ┌────▼─────────┐              │
│  │ State Mgr    │  │ Data Mgr │  │  LLM Handler │              │
│  └──────────────┘  └──────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────┘
              │              │               │
              ▼              ▼               ▼
┌──────────────────┐  ┌─────────────────────────────┐
│      Redis       │  │        Database             │
│  ┌────────────┐  │  │  ┌──────────────────────┐  │
│  │ Job Queue  │  │  │  │ Workflow Results     │  │
│  │ State Data │  │  │  │ LLM Memories         │  │
│  │ Cache      │  │  │  │ Execution History    │  │
│  └────────────┘  │  │  └──────────────────────┘  │
└──────────────────┘  └─────────────────────────────┘
```

### Data Flow

1. **Workflow Submission**
   - Frontend sends workflow definition to API Gateway
   - API validates and generates unique Job ID
   - Job pushed to Redis Streams queue
   - Returns Job ID immediately to client

2. **Workflow Execution**
   - Worker pulls job from queue
   - Executes workflow steps sequentially or in parallel
   - Updates state in Redis after each step
   - Publishes progress updates via Redis Pub/Sub
   - Stores final results in database

3. **Real-time Updates**
   - WebSocket Hub subscribes to Redis Pub/Sub channels
   - Broadcasts state changes to connected clients
   - Clients receive updates without polling

4. **LLM Integration**
   - Workers invoke LLM with workflow context
   - Retrieves relevant memories from database (vector search)
   - Stores new memories/embeddings for future use

## Key Features

### Core Capabilities

- **Visual Workflow Editor**: Drag-and-drop interface for building workflows
- **Asynchronous Execution**: Non-blocking workflow execution with job queuing
- **Real-time Monitoring**: Live status updates via WebSocket connections
- **LLM Integration**: Built-in support for LLM-powered workflow steps
- **Memory Management**: Persistent storage and retrieval of LLM context
- **Horizontal Scaling**: Add workers dynamically based on load
- **Fault Tolerance**: Automatic retry mechanisms and error recovery

### Performance Features

- **Connection Pooling**: Reused connections to Redis and database
- **Batch Processing**: Grouped database writes for reduced overhead
- **In-Memory Caching**: Multi-tier caching strategy (L1: Go, L2: Redis, L3: DB)
- **Redis Pipelining**: Batched Redis commands to minimize round trips
- **Goroutine Pools**: Bounded concurrency to prevent resource exhaustion
- **Optimized Serialization**: Fast JSON parsing with `jsoniter` or `easyjson`

## System Components

### 1. Frontend (Stateless Editor)

**Technology**: React/Vue.js with a visual workflow builder

**Responsibilities**:
- Render workflow editor interface
- Send workflow definitions to backend
- Subscribe to WebSocket for real-time updates
- Display execution status and results
- No local state persistence

**Key Libraries**:
- React Flow / Vue Flow for visual editing
- Socket.io-client for WebSocket communication
- Axios for HTTP requests

### 2. API Gateway

**Technology**: Go with Gin or Echo framework

**Responsibilities**:
- Handle HTTP REST endpoints
- Validate incoming workflow definitions
- Generate and return Job IDs
- Route status/result queries
- Manage WebSocket connections

**Endpoints**:
```
POST   /api/v1/workflows          # Submit new workflow
GET    /api/v1/workflows/:id      # Get workflow status
GET    /api/v1/workflows/:id/result # Get workflow result
DELETE /api/v1/workflows/:id      # Cancel workflow
WS     /api/v1/ws                 # WebSocket connection
```

### 3. Job Queue Manager

**Technology**: Redis Streams with Consumer Groups

**Responsibilities**:
- Queue incoming workflow jobs
- Distribute jobs to available workers
- Implement retry logic for failed jobs
- Track job lifecycle and priorities

**Redis Data Structures**:
- Redis Streams for job queue
- Redis Pub/Sub for real-time updates
- Sorted Sets for priority queues

### 4. Worker Pool

**Technology**: Go goroutines with worker pool pattern

**Responsibilities**:
- Pull jobs from Redis queue
- Execute workflow steps
- Update state in Redis
- Handle errors and retries
- Store results in database

**Configuration**:
```go
type WorkerPoolConfig struct {
    NumWorkers      int           // Number of concurrent workers
    MaxRetries      int           // Max retry attempts per job
    RetryBackoff    time.Duration // Exponential backoff duration
    JobTimeout      time.Duration // Max execution time per job
}
```

### 5. State Manager

**Technology**: Redis with Go-Redis client

**Responsibilities**:
- Store workflow execution state
- Track progress and current step
- Cache frequently accessed data
- Manage TTLs for state cleanup

**State Schema**:
```json
{
  "job_id": "uuid",
  "status": "pending|running|completed|failed",
  "current_step": 3,
  "total_steps": 10,
  "progress": 30,
  "started_at": "2025-11-19T10:00:00Z",
  "updated_at": "2025-11-19T10:05:00Z",
  "error": null,
  "metadata": {}
}
```

### 6. Data Manager

**Technology**: PostgreSQL/MySQL with GORM or sqlx

**Responsibilities**:
- Store workflow execution results
- Persist execution history
- Manage database connections
- Batch write operations

**Schema Design**:
```sql
-- Workflow Results
CREATE TABLE workflow_results (
    id UUID PRIMARY KEY,
    job_id UUID UNIQUE NOT NULL,
    workflow_definition JSONB,
    result JSONB,
    status VARCHAR(20),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Execution History
CREATE TABLE execution_history (
    id BIGSERIAL PRIMARY KEY,
    job_id UUID NOT NULL,
    step_number INTEGER,
    step_name VARCHAR(255),
    status VARCHAR(20),
    result JSONB,
    error TEXT,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_workflow_results_job_id ON workflow_results(job_id);
CREATE INDEX idx_workflow_results_status ON workflow_results(status);
CREATE INDEX idx_execution_history_job_id ON execution_history(job_id);
```

### 7. LLM Handler

**Technology**: Go with OpenAI/Anthropic SDK

**Responsibilities**:
- Interface with LLM APIs
- Manage prompt construction
- Store and retrieve memories
- Handle token limits and costs

**Memory Storage** (PostgreSQL with pgvector):
```sql
-- LLM Memories with vector embeddings
CREATE EXTENSION vector;

CREATE TABLE llm_memories (
    id BIGSERIAL PRIMARY KEY,
    job_id UUID,
    content TEXT,
    embedding vector(1536), -- OpenAI embedding dimension
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX idx_llm_memories_embedding ON llm_memories 
USING ivfflat (embedding vector_cosine_ops);
```

## Performance Optimizations

### 1. Worker Pool Pattern

```go
type WorkerPool struct {
    workers    int
    jobQueue   chan Job
    resultCh   chan Result
    wg         sync.WaitGroup
}

func (wp *WorkerPool) Start() {
    for i := 0; i < wp.workers; i++ {
        wp.wg.Add(1)
        go wp.worker(i)
    }
}

func (wp *WorkerPool) worker(id int) {
    defer wp.wg.Done()
    for job := range wp.jobQueue {
        result := job.Execute()
        wp.resultCh <- result
    }
}
```

**Benefits**:
- Controlled concurrency (prevents goroutine explosion)
- Efficient resource utilization
- Graceful shutdown capabilities

### 2. Redis Connection Pooling

```go
import "github.com/go-redis/redis/v8"

redisClient := redis.NewClient(&redis.Options{
    Addr:         "localhost:6379",
    PoolSize:     100,              // Max connections
    MinIdleConns: 10,               // Min idle connections
    MaxConnAge:   time.Hour,        // Recycle connections
})
```

### 3. Database Connection Pooling

```go
import "database/sql"

db.SetMaxOpenConns(50)           // Max open connections
db.SetMaxIdleConns(25)           // Max idle connections
db.SetConnMaxLifetime(time.Hour) // Connection lifetime
```

### 4. Batch Write Operations

```go
type BatchWriter struct {
    buffer   []Result
    size     int
    interval time.Duration
}

func (bw *BatchWriter) Flush() error {
    if len(bw.buffer) == 0 {
        return nil
    }
    
    // Batch insert using GORM or sqlx
    err := db.CreateInBatches(bw.buffer, 100).Error
    bw.buffer = bw.buffer[:0]
    return err
}
```

### 5. Multi-Tier Caching

```go
// L1: In-memory cache (100ms avg latency)
var memCache = sync.Map{}

// L2: Redis cache (1-5ms avg latency)
func GetWithCache(key string) (interface{}, error) {
    // Check L1
    if val, ok := memCache.Load(key); ok {
        return val, nil
    }
    
    // Check L2
    val, err := redisClient.Get(ctx, key).Result()
    if err == nil {
        memCache.Store(key, val)
        return val, nil
    }
    
    // L3: Database (10-50ms avg latency)
    val, err = db.Query(key)
    if err == nil {
        redisClient.Set(ctx, key, val, 10*time.Minute)
        memCache.Store(key, val)
    }
    return val, err
}
```

### 6. Redis Pipelining

```go
pipe := redisClient.Pipeline()

pipe.HSet(ctx, "job:123", "status", "running")
pipe.HSet(ctx, "job:123", "progress", 50)
pipe.Publish(ctx, "job:123", "update")

// Execute all commands in one round trip
_, err := pipe.Exec(ctx)
```

### 7. Optimized JSON Serialization

```go
import jsoniter "github.com/json-iterator/go"

var json = jsoniter.ConfigCompatibleWithStandardLibrary

// 2-3x faster than encoding/json
data, err := json.Marshal(obj)
```

## Technology Stack

### Backend
- **Language**: Go 1.21+
- **Web Framework**: Gin or Echo
- **WebSocket**: Gorilla WebSocket
- **Redis Client**: go-redis/redis/v8
- **Database ORM**: GORM or sqlx
- **JSON**: jsoniter (fast JSON serialization)
- **Testing**: testify, gomock

### Frontend
- **Framework**: React 18+ or Vue 3+
- **Workflow Editor**: React Flow or Vue Flow
- **State Management**: Redux Toolkit or Pinia
- **WebSocket**: Socket.io-client
- **HTTP Client**: Axios
- **UI Library**: Ant Design or Vuetify

### Infrastructure
- **Cache/Queue**: Redis 7.0+ (with Redis Streams)
- **Database**: PostgreSQL 15+ with pgvector extension
- **Message Broker**: Redis Pub/Sub
- **Container**: Docker & Docker Compose
- **Orchestration**: Kubernetes (optional)

### Monitoring
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry + Jaeger
- **Logging**: Zap (structured logging)
- **Profiling**: pprof (Go profiler)

## Getting Started

### Prerequisites

- Go 1.21 or higher
- Redis 7.0+
- PostgreSQL 15+ with pgvector
- Node.js 18+ (for frontend)
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourorg/workflow-runner.git
cd workflow-runner
```

2. **Install backend dependencies**
```bash
cd backend
go mod download
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start infrastructure with Docker Compose**
```bash
docker-compose up -d redis postgres
```

6. **Run database migrations**
```bash
cd backend
go run cmd/migrate/main.go up
```

7. **Start the backend**
```bash
go run cmd/server/main.go
```

8. **Start the frontend**
```bash
cd frontend
npm run dev
```

### Configuration

**Backend Configuration** (`config.yaml`):
```yaml
server:
  port: 8080
  read_timeout: 30s
  write_timeout: 30s

redis:
  host: localhost
  port: 6379
  pool_size: 100
  min_idle_conns: 10

database:
  host: localhost
  port: 5432
  name: workflow_db
  user: postgres
  password: postgres
  max_open_conns: 50
  max_idle_conns: 25

worker_pool:
  num_workers: 10
  max_retries: 3
  job_timeout: 5m

llm:
  provider: openai
  api_key: ${OPENAI_API_KEY}
  model: gpt-4-turbo
  max_tokens: 4000
```

## API Documentation

### Submit Workflow

**Endpoint**: `POST /api/v1/workflows`

**Request Body**:
```json
{
  "name": "Data Processing Pipeline",
  "steps": [
    {
      "id": "step1",
      "type": "http_request",
      "config": {
        "url": "https://api.example.com/data",
        "method": "GET"
      }
    },
    {
      "id": "step2",
      "type": "llm_process",
      "config": {
        "prompt": "Analyze the following data: {{step1.output}}",
        "model": "gpt-4"
      }
    },
    {
      "id": "step3",
      "type": "store_result",
      "config": {
        "destination": "database"
      }
    }
  ]
}
```

**Response**:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "created_at": "2025-11-19T10:00:00Z"
}
```

### Get Workflow Status

**Endpoint**: `GET /api/v1/workflows/:id`

**Response**:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "current_step": 2,
  "total_steps": 3,
  "progress": 66,
  "started_at": "2025-11-19T10:00:01Z",
  "updated_at": "2025-11-19T10:00:45Z"
}
```

### WebSocket Connection

**Endpoint**: `WS /api/v1/ws`

**Message Format**:
```json
{
  "type": "subscribe",
  "job_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Updates Received**:
```json
{
  "type": "status_update",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "progress": 75,
  "current_step": "step2",
  "timestamp": "2025-11-19T10:01:00Z"
}
```

## Development Guide

### Project Structure

```
workflow-runner/
├── backend/
│   ├── cmd/
│   │   ├── server/          # API server entry point
│   │   ├── worker/          # Worker pool entry point
│   │   └── migrate/         # Database migrations
│   ├── internal/
│   │   ├── api/             # HTTP handlers
│   │   ├── worker/          # Worker pool implementation
│   │   ├── queue/           # Redis queue manager
│   │   ├── state/           # State manager
│   │   ├── database/        # Database operations
│   │   ├── llm/             # LLM integration
│   │   ├── websocket/       # WebSocket hub
│   │   └── models/          # Data models
│   ├── pkg/
│   │   ├── cache/           # Caching utilities
│   │   └── logger/          # Logging utilities
│   ├── config/              # Configuration files
│   └── migrations/          # SQL migrations
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API clients
│   │   ├── store/           # State management
│   │   └── utils/           # Utilities
│   └── public/
├── docker-compose.yml
├── Dockerfile
└── README.md
```

### Running Tests

**Backend**:
```bash
cd backend
go test ./... -v -cover
```

**Frontend**:
```bash
cd frontend
npm test
```

### Code Style

Follow standard Go conventions:
- Use `gofmt` for formatting
- Follow [Effective Go](https://golang.org/doc/effective_go.html)
- Write tests for all public functions
- Document exported functions and types

## Monitoring & Observability

### Metrics

Key metrics to track using Prometheus:

- **Throughput**: Workflows executed per second
- **Latency**: P50, P95, P99 execution times
- **Queue Depth**: Number of pending jobs
- **Worker Utilization**: Active workers / total workers
- **Error Rate**: Failed workflows / total workflows
- **Cache Hit Rate**: L1, L2, L3 cache performance
- **Database Connections**: Active/idle connection pool stats

### Logging

Structured logging with Zap:

```go
logger.Info("workflow_started",
    zap.String("job_id", jobID),
    zap.String("workflow_name", name),
    zap.Int("total_steps", steps),
)
```

### Profiling

Enable pprof for performance analysis:

```go
import _ "net/http/pprof"

go func() {
    http.ListenAndServe("localhost:6060", nil)
}()
```

Access profiles at:
- CPU: `http://localhost:6060/debug/pprof/profile`
- Memory: `http://localhost:6060/debug/pprof/heap`
- Goroutines: `http://localhost:6060/debug/pprof/goroutine`

## Deployment

### Docker Deployment

Build and run with Docker:

```bash
# Build backend
docker build -t workflow-runner-backend ./backend

# Build frontend
docker build -t workflow-runner-frontend ./frontend

# Run with Docker Compose
docker-compose up -d
```

### Kubernetes Deployment

Deploy to Kubernetes:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

**Horizontal Pod Autoscaling**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: workflow-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: workflow-worker
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Production Checklist

- [ ] Enable TLS/HTTPS for all endpoints
- [ ] Configure database backups
- [ ] Set up Redis persistence (AOF or RDB)
- [ ] Configure log aggregation (ELK, Loki)
- [ ] Set up monitoring dashboards
- [ ] Enable rate limiting on API endpoints
- [ ] Configure worker autoscaling
- [ ] Set up alerting (PagerDuty, Slack)
- [ ] Document disaster recovery procedures
- [ ] Perform load testing

## Performance Benchmarks

Expected performance characteristics:

| Metric | Value |
|--------|-------|
| Workflow Submission Latency | < 10ms (P95) |
| Queue Processing Rate | 1000+ jobs/sec |
| Worker Execution Overhead | < 5ms per job |
| Redis State Update | < 2ms (P95) |
| Database Write Latency | < 20ms (P95, batched) |
| WebSocket Update Latency | < 50ms (P95) |
| Memory per Worker | ~10-20MB |
| Max Concurrent Workflows | 10,000+ |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:
- GitHub Issues: https://github.com/yourorg/workflow-runner/issues
- Documentation: https://docs.workflow-runner.io
- Email: support@workflow-runner.io

---

Built with ❤️ using Go and modern cloud-native technologies.