export interface LogContext {
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
    event_type?: string;
    current_cost_eur?: number;
    budget_cap_eur?: number;
    tokens_input?: number;
    tokens_output?: number;
    success?: boolean;
    error_type?: string;
    daily_total_eur?: number;
    monthly_total_eur?: number;
    error_message?: string;
    webhook_url?: string;
}
export interface AILogData extends LogContext {
    provider: 'mistral-edge' | 'openai-cloud' | 'azure-openai' | 'graph' | 'whatsapp';
    latency_ms: number;
    tokens_in: number;
    tokens_out: number;
    cost_cents: number;
    fallback_used: boolean;
}
export interface FlowLogData extends LogContext {
    flow_type: string;
    flow_id: string;
    step: string;
    status: 'started' | 'completed' | 'failed' | 'skipped';
}
export interface WebhookLogData extends LogContext {
    source: string;
    event_type: string;
    signature_valid: boolean;
    idempotent: boolean;
}
declare class EcoNeuraLogger {
    private logger;
    constructor();
    info(msg: string, context?: LogContext | any): void;
    warn(msg: string, context?: LogContext | any): void;
    error(msg: string, error?: Error, context?: LogContext | any): void;
    debug(msg: string, context?: LogContext | any): void;
    logAIRequest(msg: string, data: AILogData): void;
    logFlowExecution(msg: string, data: FlowLogData): void;
    logWebhookReceived(msg: string, data: WebhookLogData): void;
    logAPIRequest(msg: string, context: {
        method: string;
        path: string;
        status_code: number;
        latency_ms: number;
        org_id?: string;
        x_request_id?: string;
        user_agent?: string;
    }): void;
    logSecurityEvent(msg: string, context: {
        event_type: 'auth_failure' | 'rate_limit' | 'invalid_signature' | 'tenant_violation';
        ip_address?: string;
        org_id?: string;
        x_request_id?: string;
        details?: Record<string, unknown>;
    }): void;
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
        x_request_id?: string;
    }): void;
    child(context: LogContext): EcoNeuraLogger;
}
export declare const logger: EcoNeuraLogger;
export declare function createRequestLogger(corr_id: string, x_request_id: string, org_id?: string): EcoNeuraLogger;
export declare function extractTraceId(traceparent?: string): string | undefined;
export declare function formatLogData(data: Record<string, unknown>): Record<string, unknown>;
export {};
//# sourceMappingURL=index.d.ts.map