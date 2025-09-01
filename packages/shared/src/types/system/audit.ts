import { TenantEntity } from '../models/base';

/**
 * Audit event types
 */
export type AuditEventType = 
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'api.request'
  | 'data.created'
  | 'data.updated'
  | 'data.deleted'
  | 'settings.changed'
  | 'permission.granted'
  | 'permission.revoked';

/**
 * Audit event severity
 */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Audit event outcome
 */
export type AuditOutcome = 'success' | 'failure' | 'error' | 'denied';

/**
 * Audit context
 */
export interface AuditContext {
  ip?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  session?: string;
  correlationId?: string;
}

/**
 * Audit event interface
 */
export interface AuditEvent extends TenantEntity {
  eventType: AuditEventType;
  severity: AuditSeverity;
  outcome: AuditOutcome;
  actor: {
    id: string;
    type: 'user' | 'system' | 'api';
    name: string;
  };
  target: {
    id?: string;
    type: string;
    name: string;
  };
  context: AuditContext;
  metadata: Record<string, unknown>;
  description: string;
}
