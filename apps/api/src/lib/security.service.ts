// ============================================================================
// SECURITY SERVICE - Servicio de seguridad avanzada
// ============================================================================

import crypto from 'crypto';

import { structuredLogger } from './structured-logger.js';
import { getRedisService } from './redis.service.js';

// ========================================================================
// INTERFACES
// ========================================================================

export interface SecurityEvent {
  id: string;
  type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY' | 'DATA_BREACH' | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  details: any;
  timestamp: Date;
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  suspiciousActivityThreshold: number;
  dataEncryptionKey: string;
  auditLogRetention: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  details: any;
  timestamp: Date;
}

// ========================================================================
// SECURITY SERVICE
// ========================================================================

export class SecurityService {
  private config: SecurityConfig;
  private blockedIPs: Set<string> = new Set();
  private suspiciousIPs: Map<string, number> = new Map();

  constructor() {
    this.config = {
      maxLoginAttempts: 5,
      lockoutDuration: 900, // 15 minutes
      suspiciousActivityThreshold: 10,
      dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY || 'default-key-change-in-production',
      auditLogRetention: 90 // days
    };

    this.startSecurityMonitoring();
  }

  // ========================================================================
  // AUTENTICACIÓN Y AUTORIZACIÓN
  // ========================================================================

  async recordLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean
  ): Promise<void> {
    try {
      const key = `login_attempts:${email}:${ipAddress}`;
      const redis = getRedisService();

      if (success) {
        // Limpiar intentos fallidos en caso de éxito
        await redis.del(key);
        await this.recordSecurityEvent({
          type: 'AUTH_FAILURE',
          severity: 'LOW',
          ipAddress,
          userAgent,
          details: { email, success: true }
        });
      } else {
        // Incrementar intentos fallidos
        const attempts = await redis.incr(key);
        await redis.expire(key, this.config.lockoutDuration);

        if (attempts >= this.config.maxLoginAttempts) {
          await this.blockIP(ipAddress, 'Too many failed login attempts');
          await this.recordSecurityEvent({
            type: 'AUTH_FAILURE',
            severity: 'HIGH',
            ipAddress,
            userAgent,
            details: { email, attempts, blocked: true }
          });
        } else {
          await this.recordSecurityEvent({
            type: 'AUTH_FAILURE',
            severity: 'MEDIUM',
            ipAddress,
            userAgent,
            details: { email, attempts }
          });
        }
      }
    } catch (error) {
      structuredLogger.error('Login attempt recording error', error as Error, { email, ipAddress });
    }
  }

  async isIPBlocked(ipAddress: string): Promise<boolean> {
    try {
      const redis = getRedisService();
      const blocked = await redis.get(`blocked_ip:${ipAddress}`);
      return blocked !== null;
    } catch (error) {
      structuredLogger.error('IP block check error', error as Error, { ipAddress });
      return false;
    }
  }

  async blockIP(ipAddress: string, reason: string): Promise<void> {
    try {
      const redis = getRedisService();
      await redis.setex(`blocked_ip:${ipAddress}`, this.config.lockoutDuration, reason);
      this.blockedIPs.add(ipAddress);

      structuredLogger.warn('IP blocked', { ipAddress, reason });
    } catch (error) {
      structuredLogger.error('IP block error', error as Error, { ipAddress, reason });
    }
  }

  async unblockIP(ipAddress: string): Promise<void> {
    try {
      const redis = getRedisService();
      await redis.del(`blocked_ip:${ipAddress}`);
      this.blockedIPs.delete(ipAddress);

      structuredLogger.info('IP unblocked', { ipAddress });
    } catch (error) {
      structuredLogger.error('IP unblock error', error as Error, { ipAddress });
    }
  }

  // ========================================================================
  // DETECCIÓN DE ACTIVIDAD SOSPECHOSA
  // ========================================================================

  async detectSuspiciousActivity(
    userId: string,
    organizationId: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    details: any
  ): Promise<boolean> {
    try {
      const key = `suspicious_activity:${userId}:${ipAddress}`;
      const redis = getRedisService();

      // Incrementar contador de actividad
      const count = await redis.incr(key);
      await redis.expire(key, 3600); // 1 hora

      if (count >= this.config.suspiciousActivityThreshold) {
        await this.recordSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          userId,
          organizationId,
          ipAddress,
          userAgent,
          details: { action, count, ...details }
        });

        return true;
      }

      return false;
    } catch (error) {
      structuredLogger.error('Suspicious activity detection error', error as Error, { userId, action });
      return false;
    }
  }

  // ========================================================================
  // ENCRIPTACIÓN DE DATOS
  // ========================================================================

  encryptData(data: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.config.dataEncryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      cipher.setAAD(Buffer.from('econeura', 'utf8'));

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      structuredLogger.error('Data encryption error', error as Error);
      throw new Error('Failed to encrypt data');
    }
  }

  decryptData(encryptedData: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.config.dataEncryptionKey, 'salt', 32);
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from('econeura', 'utf8'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      structuredLogger.error('Data decryption error', error as Error);
      throw new Error('Failed to decrypt data');
    }
  }

  // ========================================================================
  // AUDITORÍA Y LOGGING
  // ========================================================================

  async recordAuditLog(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const log: AuditLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        ...auditLog
      };

      const redis = getRedisService();
      await redis.lpush('audit_logs', JSON.stringify(log));
      await redis.ltrim('audit_logs', 0, 10000); // Mantener solo los últimos 10,000 logs

      structuredLogger.info('Audit log recorded', log);
    } catch (error) {
      structuredLogger.error('Audit log recording error', error as Error, auditLog);
    }
  }

  async recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        ...event
      };

      const redis = getRedisService();
      await redis.lpush('security_events', JSON.stringify(securityEvent));
      await redis.ltrim('security_events', 0, 5000); // Mantener solo los últimos 5,000 eventos

      // Log según severidad
      const logLevel = this.getLogLevel(securityEvent.severity);
      structuredLogger[logLevel]('Security event recorded', securityEvent);

      // Alertar en caso de eventos críticos
      if (securityEvent.severity === 'CRITICAL') {
        await this.sendSecurityAlert(securityEvent);
      }
    } catch (error) {
      structuredLogger.error('Security event recording error', error as Error, event);
    }
  }

  // ========================================================================
  // VALIDACIÓN DE ENTRADA
  // ========================================================================

  validateInput(data: any, schema: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Validación básica de tipos
      for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} is required`);
          continue;
        }

        if (value !== undefined && value !== null) {
          // Validar tipo
          if (rules.type && typeof value !== rules.type) {
            errors.push(`${field} must be of type ${rules.type}`);
          }

          // Validar longitud
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`${field} must be at least ${rules.minLength} characters long`);
          }

          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`${field} cannot exceed ${rules.maxLength} characters`);
          }

          // Validar patrón
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(`${field} format is invalid`);
          }

          // Validar rango
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`${field} must be at least ${rules.min}`);
          }

          if (rules.max !== undefined && value > rules.max) {
            errors.push(`${field} cannot exceed ${rules.max}`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      structuredLogger.error('Input validation error', error as Error, { data, schema });
      return {
        isValid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remover tags HTML básicos
      .replace(/javascript:/gi, '') // Remover javascript: URLs
      .replace(/on\w+=/gi, ''); // Remover event handlers
  }

  // ========================================================================
  // UTILIDADES
  // ========================================================================

  private getLogLevel(severity: string): 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'LOW': return 'info';
      case 'MEDIUM': return 'warn';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'info';
    }
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // Aquí se implementaría el envío de alertas (email, Slack, etc.)
      structuredLogger.error('SECURITY ALERT', event);
      
      // Ejemplo de implementación con webhook
      // await fetch(process.env.SECURITY_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      structuredLogger.error('Security alert sending error', error as Error, event);
    }
  }

  private startSecurityMonitoring(): void {
    // Limpiar IPs bloqueadas expiradas cada hora
    setInterval(() => {
      this.cleanupExpiredBlocks();
    }, 3600000); // 1 hora

    // Limpiar logs antiguos diariamente
    setInterval(() => {
      this.cleanupOldLogs();
    }, 86400000); // 24 horas
  }

  private async cleanupExpiredBlocks(): Promise<void> {
    try {
      const redis = getRedisService();
      const keys = await redis.keys('blocked_ip:*');
      
      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl === -1) { // Sin expiración
          await redis.del(key);
        }
      }
    } catch (error) {
      structuredLogger.error('Cleanup expired blocks error', error as Error);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const redis = getRedisService();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.auditLogRetention);

      // Limpiar audit logs antiguos
      const auditLogs = await redis.lrange('audit_logs', 0, -1);
      const filteredAuditLogs = auditLogs.filter(log => {
        const logData = JSON.parse(log);
        return new Date(logData.timestamp) > cutoffDate;
      });

      if (filteredAuditLogs.length !== auditLogs.length) {
        await redis.del('audit_logs');
        if (filteredAuditLogs.length > 0) {
          await redis.lpush('audit_logs', ...filteredAuditLogs);
        }
      }

      // Limpiar security events antiguos
      const securityEvents = await redis.lrange('security_events', 0, -1);
      const filteredSecurityEvents = securityEvents.filter(event => {
        const eventData = JSON.parse(event);
        return new Date(eventData.timestamp) > cutoffDate;
      });

      if (filteredSecurityEvents.length !== securityEvents.length) {
        await redis.del('security_events');
        if (filteredSecurityEvents.length > 0) {
          await redis.lpush('security_events', ...filteredSecurityEvents);
        }
      }
    } catch (error) {
      structuredLogger.error('Cleanup old logs error', error as Error);
    }
  }

  // ========================================================================
 // MÉTODOS DE CONFIGURACIÓN
  // ========================================================================

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('Security config updated', newConfig);
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}

// ========================================================================
// INSTANCIA SINGLETON
// ========================================================================

export const securityService = new SecurityService();

