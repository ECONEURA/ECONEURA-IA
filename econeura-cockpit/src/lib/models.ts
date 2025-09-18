// Tipos, FSM y contratos de datos - ECONEURA Cockpit
import { DeptKey } from './palette.js';

export type AgentStatus = 'idle' | 'running' | 'hitl_wait' | 'completed' | 'warning' | 'failed' | 'paused';

export interface LlmMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RunOrder {
  tenantId: string;
  dept: DeptKey;
  agentKey: string;
  trigger: 'manual' | 'schedule' | 'rule';
  payload: {
    params?: Record<string, unknown>;
    hitl?: boolean;
  };
  idempotencyKey: string;
  requestedBy: {
    userId: string;
    role: string;
  };
  legalBasis: 'contract' | 'consent' | 'legitimate_interest';
  dataClass: ('none' | 'pii' | 'finance' | 'security')[];
  ts: string;
}

export interface AgentEvent {
  tenantId: string;
  dept: DeptKey;
  agentKey: string;
  status: 'RUNNING' | 'HITL_WAIT' | 'COMPLETED' | 'WARNING' | 'FAILED';
  progress?: number;
  summary?: string;
  artifacts?: {
    type: 'csv' | 'json' | 'pdf';
    name: string;
    uri: string;
  }[];
  idempotencyKey: string;
  eventId: string;
  ts: string;
}

export interface ActivityEvent {
  ts: string;
  dept: DeptKey;
  kind: 'ok' | 'warn' | 'err' | 'info';
  msg: string;
  key?: string;
}

export interface UsageStats {
  tokens: number;
  cost: number;
  requests: number;
  lastUpdated: string;
}

export interface AgentConfig {
  key: string;
  name: string;
  description: string;
  dept: DeptKey;
  status: AgentStatus;
  usage?: UsageStats;
  lastRun?: string;
  nextRun?: string;
}

