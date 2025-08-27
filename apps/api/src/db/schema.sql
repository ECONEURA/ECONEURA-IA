-- ECONEURA Database Schema
-- Multi-tenant PostgreSQL schema with partitioning and proper indexing

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Organizations table (master tenant registry)
CREATE TABLE organizations (
    org_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(64) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT org_id_format CHECK (org_id ~ '^[a-zA-Z0-9\-_]+$'),
    CONSTRAINT name_length CHECK (LENGTH(name) >= 1)
);

CREATE INDEX idx_organizations_enabled ON organizations(enabled) WHERE enabled = true;
CREATE INDEX idx_organizations_api_key_hash ON organizations(api_key_hash);

-- Customers table with org scoping
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id VARCHAR(64) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT customer_email_format CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
    CONSTRAINT customer_name_length CHECK (LENGTH(name) >= 1)
);

-- Multi-column index for tenant isolation and performance
CREATE INDEX idx_customers_org_id ON customers(org_id);
CREATE INDEX idx_customers_org_email ON customers(org_id, email);
CREATE UNIQUE INDEX idx_customers_org_email_unique ON customers(org_id, email);

-- Invoices table with org scoping
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id VARCHAR(64) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT invoice_status_valid CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    FOREIGN KEY (org_id, customer_id) REFERENCES customers(org_id, id) ON DELETE CASCADE
);

CREATE INDEX idx_invoices_org_id ON invoices(org_id);
CREATE INDEX idx_invoices_org_customer ON invoices(org_id, customer_id);
CREATE INDEX idx_invoices_org_status ON invoices(org_id, status);
CREATE INDEX idx_invoices_org_due_date ON invoices(org_id, due_date);
CREATE INDEX idx_invoices_overdue ON invoices(org_id, due_date) WHERE status IN ('sent', 'overdue') AND due_date < CURRENT_DATE;

-- Interactions table with org scoping
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id VARCHAR(64) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    customer_id UUID,
    channel VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT interaction_channel_valid CHECK (channel IN ('email', 'whatsapp', 'teams', 'phone', 'system')),
    FOREIGN KEY (org_id, customer_id) REFERENCES customers(org_id, id) ON DELETE SET NULL
);

CREATE INDEX idx_interactions_org_id ON interactions(org_id);
CREATE INDEX idx_interactions_org_customer ON interactions(org_id, customer_id);
CREATE INDEX idx_interactions_org_channel ON interactions(org_id, channel);
CREATE INDEX idx_interactions_org_ts ON interactions(org_id, ts DESC);
CREATE INDEX idx_interactions_payload_gin ON interactions USING GIN (payload);

-- Partitioned audit events table (by month)
CREATE TABLE audit_events (
    id UUID DEFAULT uuid_generate_v4(),
    org_id VARCHAR(64) NOT NULL,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    route VARCHAR(255) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    outcome VARCHAR(20) NOT NULL DEFAULT 'success',
    payload JSONB NOT NULL DEFAULT '{}',
    
    CONSTRAINT audit_outcome_valid CHECK (outcome IN ('success', 'error', 'warning')),
    PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);

-- Create monthly partitions for audit_events (current + 3 months ahead)
CREATE TABLE audit_events_2024_08 PARTITION OF audit_events
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE audit_events_2024_09 PARTITION OF audit_events
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE audit_events_2024_10 PARTITION OF audit_events
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE audit_events_2024_11 PARTITION OF audit_events
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE audit_events_2024_12 PARTITION OF audit_events
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Indexes on partitioned table
CREATE INDEX idx_audit_events_org_ts ON audit_events(org_id, ts DESC);
CREATE INDEX idx_audit_events_route ON audit_events(route);
CREATE INDEX idx_audit_events_outcome ON audit_events(outcome);

-- Organization limits table
CREATE TABLE org_limits (
    org_id VARCHAR(64) PRIMARY KEY REFERENCES organizations(org_id) ON DELETE CASCADE,
    rps_limit INTEGER NOT NULL DEFAULT 100 CHECK (rps_limit > 0),
    burst INTEGER NOT NULL DEFAULT 200 CHECK (burst > 0),
    monthly_cost_cap_eur NUMERIC(8,2) NOT NULL DEFAULT 50.00 CHECK (monthly_cost_cap_eur > 0),
    max_parallel_jobs INTEGER NOT NULL DEFAULT 10 CHECK (max_parallel_jobs > 0),
    storage_quota_gb INTEGER NOT NULL DEFAULT 10 CHECK (storage_quota_gb > 0)
);

-- Organization daily usage tracking (partitioned by month)
CREATE TABLE org_usage_daily (
    org_id VARCHAR(64) NOT NULL,
    day DATE NOT NULL,
    http_requests INTEGER NOT NULL DEFAULT 0,
    ai_cost_eur NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    jobs_enqueued INTEGER NOT NULL DEFAULT 0,
    jobs_running INTEGER NOT NULL DEFAULT 0,
    
    PRIMARY KEY (org_id, day)
);

CREATE INDEX idx_org_usage_daily_day ON org_usage_daily(day DESC);
CREATE INDEX idx_org_usage_daily_org_month ON org_usage_daily(org_id, EXTRACT(YEAR FROM day), EXTRACT(MONTH FROM day));

-- Organization feature flags
CREATE TABLE org_feature_flags (
    org_id VARCHAR(64) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    flag VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    
    PRIMARY KEY (org_id, flag)
);

CREATE INDEX idx_org_feature_flags_flag ON org_feature_flags(flag);

-- Idempotency keys table
CREATE TABLE idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    in_progress BOOLEAN NOT NULL DEFAULT false,
    last_status INTEGER,
    response_json JSONB,
    ttl_until TIMESTAMPTZ NOT NULL,
    
    CONSTRAINT ttl_future CHECK (ttl_until > first_seen_at)
);

CREATE INDEX idx_idempotency_keys_ttl ON idempotency_keys(ttl_until);
CREATE INDEX idx_idempotency_keys_in_progress ON idempotency_keys(in_progress) WHERE in_progress = true;

-- Flow executions table
CREATE TABLE flow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id VARCHAR(64) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    flow_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    input_data JSONB NOT NULL DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    steps_completed TEXT[] DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corr_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    
    CONSTRAINT flow_type_valid CHECK (flow_type IN ('cobro_proactivo', 'follow_up', 'reminder')),
    CONSTRAINT flow_status_valid CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_flow_executions_org_id ON flow_executions(org_id);
CREATE INDEX idx_flow_executions_org_status ON flow_executions(org_id, status);
CREATE INDEX idx_flow_executions_org_type ON flow_executions(org_id, flow_type);
CREATE INDEX idx_flow_executions_corr_id ON flow_executions(corr_id);
CREATE INDEX idx_flow_executions_created_at ON flow_executions(created_at DESC);

-- Job queue table (PostgreSQL-based queue)
CREATE TABLE job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id VARCHAR(64) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    priority INTEGER NOT NULL DEFAULT 0,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lease_until TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT job_priority_valid CHECK (priority >= 0),
    CONSTRAINT job_attempts_valid CHECK (attempts >= 0 AND attempts <= max_attempts)
);

CREATE INDEX idx_job_queue_org_id ON job_queue(org_id);
CREATE INDEX idx_job_queue_available ON job_queue(priority DESC, scheduled_for ASC) 
    WHERE lease_until IS NULL OR lease_until < NOW();
CREATE INDEX idx_job_queue_leased ON job_queue(lease_until) 
    WHERE lease_until IS NOT NULL;
CREATE INDEX idx_job_queue_type ON job_queue(job_type);

-- Integration credentials (encrypted)
CREATE TABLE org_integrations (
    org_id VARCHAR(64) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    config_encrypted TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (org_id, provider),
    CONSTRAINT provider_valid CHECK (provider IN ('graph', 'whatsapp', 'make', 'zapier'))
);

-- Row Level Security (RLS) setup for tenant isolation
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies (will be set by application context)
-- Note: These are examples - actual policies set by app with current_setting()

-- Cleanup function for expired idempotency keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM idempotency_keys WHERE ttl_until < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create audit event partitions
CREATE OR REPLACE FUNCTION create_monthly_audit_partition(partition_date DATE)
RETURNS VOID AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    start_date := DATE_TRUNC('month', partition_date);
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'audit_events_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_events 
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER trigger_org_integrations_updated_at
    BEFORE UPDATE ON org_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_flow_executions_updated_at
    BEFORE UPDATE ON flow_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Overdue invoices view
CREATE VIEW overdue_invoices AS
SELECT i.*, c.name as customer_name, c.email as customer_email
FROM invoices i
JOIN customers c ON i.org_id = c.org_id AND i.customer_id = c.id
WHERE i.status IN ('sent', 'overdue') 
  AND i.due_date < CURRENT_DATE;

-- Monthly AI cost summary
CREATE VIEW monthly_ai_costs AS
SELECT 
    org_id,
    EXTRACT(YEAR FROM day) as year,
    EXTRACT(MONTH FROM day) as month,
    SUM(ai_cost_eur) as total_cost_eur,
    COUNT(*) as days_active
FROM org_usage_daily
WHERE ai_cost_eur > 0
GROUP BY org_id, EXTRACT(YEAR FROM day), EXTRACT(MONTH FROM day);

-- Active flows summary
CREATE VIEW active_flows AS
SELECT 
    org_id,
    flow_type,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_duration_seconds
FROM flow_executions
WHERE status IN ('pending', 'running')
GROUP BY org_id, flow_type, status;

-- Grant necessary permissions (would be handled by migrations in real deployment)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO econeura_api;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO econeura_api;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO econeura_api;