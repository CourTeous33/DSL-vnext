-- Workflow Results
CREATE TABLE IF NOT EXISTS workflow_results (
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
CREATE TABLE IF NOT EXISTS execution_history (
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
CREATE INDEX IF NOT EXISTS idx_workflow_results_job_id ON workflow_results(job_id);
CREATE INDEX IF NOT EXISTS idx_workflow_results_status ON workflow_results(status);
CREATE INDEX IF NOT EXISTS idx_execution_history_job_id ON execution_history(job_id);

-- LLM Memories (Placeholder for pgvector, requires extension installation which might need a custom image or manual setup)
-- For now, we'll create the table without the vector column to avoid startup errors if the extension isn't present in standard alpine image
CREATE TABLE IF NOT EXISTS llm_memories (
    id BIGSERIAL PRIMARY KEY,
    job_id UUID,
    content TEXT,
    -- embedding vector(1536), -- Commented out until pgvector is set up
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
