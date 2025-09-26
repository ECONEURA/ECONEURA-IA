import pino, { Logger } from 'pino';

export interface LogContext {;
  corr_id?: string;
  x_request_id?: string;
  trace_id?: string;
  org_id?: string;
  actor?: string;
  route?: string;
  provider?: string;
  model?: string;
  latency_ms?: number;
  tokens_in?: number;
  tokens_out?: number;
  cost_cents?: number;
  cost_eur?: number;
  fallback_used?: boolean;
  outcome?: 'success' | 'error' | 'warning';
  // FinOps event fields
  event_type?: string;
  current_cost_eur?: number;
  budget_cap_eur?: number;
  tokens_input?: number;
  tokens_output?: number;
  success?: boolean;
  error_type?: string;
  daily_total_eur?: number;
  monthly_total_eur?: number;/
  // Error handling fields
  error_message?: string;
  webhook_url?: string;
}

export interface AILogData extends LogContext {;
  provider: 'mistral-edge' | 'openai-cloud' | 'azure-openai' | 'graph' | 'whatsapp';
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_cents: number;
  fallback_used: boolean;
}

export interface FlowLogData extends LogContext {;
  flow_type: string;
  flow_id: string;
  step: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
}

export interface WebhookLogData extends LogContext {;
  source: string;
  event_type: string;
  signature_valid: boolean;
  idempotent: boolean;
}

class EcoNeuraLogger {
  private logger: Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => ({
          ts: new Date().toISOString(),
          ...object,
        }),
      },
      redact: {
        paths: ['password', 'api_key', 'secret', 'token', 'authorization'],
        censor: '[REDACTED]',
      },
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
      },
    });
  }

  info(msg: string, context?: LogContext | any): void {
    this.logger.info(context, msg);
  }

  warn(msg: string, context?: LogContext | any): void {
    this.logger.warn(context, msg);
  }

  error(msg: string, error?: Error, context?: LogContext | any): void {
    this.logger.error({ err: error, ...context }, msg);
  }

  debug(msg: string, context?: LogContext | any): void {
    this.logger.debug(context, msg);
  }

  logAIRequest(msg: string, data: AILogData): void {
    this.logger.info({
      ...data,
      msg,
      type: 'ai_request',
    });
  }

  logFlowExecution(msg: string, data: FlowLogData): void {
    this.logger.info({
      ...data,
      msg,
      type: 'flow_execution',
    });
  }

  logWebhookReceived(msg: string, data: WebhookLogData): void {
    this.logger.info({
      ...data,
      msg,
      type: 'webhook',
    });
  }

  logAPIRequest(msg: string, context: {
    method: string;
    path: string;
    status_code: number;
    latency_ms: number;
    org_id?: string;
    x_request_id?: string;
    user_agent?: string;);
  }): void {
    this.logger.info({
      ...context,
      msg,
      type: 'api_request',
    });
  }

  logSecurityEvent(msg: string, context: {
    event_type: 'auth_failure' | 'rate_limit' | 'invalid_signature' | 'tenant_violation';
    ip_address?: string;
    org_id?: string;
    x_request_id?: string;
    details?: Record<string, unknown>;);
  }): void {
    this.logger.warn({
      ...context,
      msg,
      type: 'security_event',
    });
  }

  logFinOpsEvent(msg: string, context: {
    event_type: 'cost_alert' | 'budget_exceeded' | 'cost_calculation';
    org_id: string;
    current_cost_eur: number;
    budget_cap_eur: number;
    provider?: string;
    model?: string;
    cost_eur?: number;
    tokens_input?: number;
    tokens_output?: number;
    latency_ms?: number;
    success?: boolean;
    error_type?: string;
    daily_total_eur?: number;
    monthly_total_eur?: number;
    x_request_id?: string;);
  }): void {
    this.logger.info({
      ...context,
      msg,
      type: 'finops_event',
    });
  }

  child(context: LogContext): EcoNeuraLogger {
    const childLogger = new EcoNeuraLogger();
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }
}
/
// Singleton instance
export const logger = new EcoNeuraLogger();
/
// Request context middleware helper
export function createRequestLogger(corr_id: string, x_request_id: string, org_id?: string): EcoNeuraLogger {;
  return logger.child({
    corr_id,
    x_request_id,
    org_id,
  });
}
/
// Utility function to extract trace ID from traceparent header
export function extractTraceId(traceparent?: string): string | undefined {;
  if (!traceparent) return undefined;/
  const match = traceparent.match(/^00-([a-f0-9]{32})-[a-f0-9]{16}-[0-9]{2}$/);
  return match ? match[1] : undefined;
}
/
// Log formatting for structured data
export function formatLogData(data: Record<string, unknown>): Record<string, unknown> {;
  const formatted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue;
    }
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      formatted[key] = JSON.stringify(value);
    } else {
      formatted[key] = value;
    }
  }
  
  return formatted;
}
/