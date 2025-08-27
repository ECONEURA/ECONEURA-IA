export interface Organization {
  org_id: string;
  name: string;
  api_key_hash: string;
  enabled: boolean;
  created_at: Date;
}

export interface Customer {
  id: string;
  org_id: string;
  email: string;
  name: string;
  phone?: string;
  created_at: Date;
}

export interface Invoice {
  id: string;
  org_id: string;
  customer_id: string;
  amount: number;
  due_date: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  created_at: Date;
}

export interface Interaction {
  id: string;
  org_id: string;
  customer_id: string;
  channel: 'email' | 'whatsapp' | 'teams' | 'phone' | 'system';
  payload: Record<string, unknown>;
  ts: Date;
}

export interface AuditEvent {
  id: string;
  org_id: string;
  ts: Date;
  route: string;
  actor: string;
  outcome: 'success' | 'error' | 'warning';
  payload: Record<string, unknown>;
}

export interface OrgLimits {
  org_id: string;
  rps_limit: number;
  burst: number;
  monthly_cost_cap_eur: number;
  max_parallel_jobs: number;
  storage_quota_gb: number;
}

export interface OrgUsageDaily {
  org_id: string;
  day: Date;
  http_requests: number;
  ai_cost_eur: number;
  jobs_enqueued: number;
  jobs_running: number;
}

export interface IdempotencyKey {
  key: string;
  first_seen_at: Date;
  in_progress: boolean;
  last_status: number;
  response_json?: Record<string, unknown>;
  ttl_until: Date;
}

export interface AIRequest {
  taskType: 'draft_email' | 'analyze_invoice' | 'summarize' | 'classify';
  sensitivity: 'public' | 'internal' | 'confidential' | 'pii';
  tokens_est: number;
  languages: string[];
  tools_needed: string[];
  budget_cents: number;
  org_id: string;
  content?: string; // Optional content field for AI processing
}

export interface AIResponse {
  provider_used: 'mistral-edge' | 'openai-cloud' | 'azure-openai';
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_cents: number;
  fallback_used: boolean;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface FlowExecution {
  id: string;
  org_id: string;
  flow_type: 'cobro_proactivo' | 'follow_up' | 'reminder';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input_data: Record<string, unknown>;
  steps_completed: string[];
  created_at: Date;
  updated_at: Date;
  corr_id: string;
}

export interface WebhookPayload {
  source: 'make' | 'zapier' | 'outlook' | 'teams';
  event_type: string;
  timestamp: number;
  signature: string;
  data: Record<string, unknown>;
}

export interface ProblemJson {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  org_id: string;
}