import crypto from 'crypto';

import { structuredLogger } from './structured-logger.js';
import { getRedisService } from './redis.service.js';
export class SecurityService {
    config;
    blockedIPs = new Set();
    suspiciousIPs = new Map();
    constructor() {
        this.config = {
            maxLoginAttempts: 5,
            lockoutDuration: 900,
            suspiciousActivityThreshold: 10,
            dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY || 'default-key-change-in-production',
            auditLogRetention: 90
        };
        this.startSecurityMonitoring();
    }
    async recordLoginAttempt(email, ipAddress, userAgent, success) {
        try {
            const key = `login_attempts:${email}:${ipAddress}`;
            const redis = getRedisService();
            if (success) {
                await redis.del(key);
                await this.recordSecurityEvent({
                    type: 'AUTH_FAILURE',
                    severity: 'LOW',
                    ipAddress,
                    userAgent,
                    details: { email, success: true }
                });
            }
            else {
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
                }
                else {
                    await this.recordSecurityEvent({
                        type: 'AUTH_FAILURE',
                        severity: 'MEDIUM',
                        ipAddress,
                        userAgent,
                        details: { email, attempts }
                    });
                }
            }
        }
        catch (error) {
            structuredLogger.error('Login attempt recording error', error, { email, ipAddress });
        }
    }
    async isIPBlocked(ipAddress) {
        try {
            const redis = getRedisService();
            const blocked = await redis.get(`blocked_ip:${ipAddress}`);
            return blocked !== null;
        }
        catch (error) {
            structuredLogger.error('IP block check error', error, { ipAddress });
            return false;
        }
    }
    async blockIP(ipAddress, reason) {
        try {
            const redis = getRedisService();
            await redis.setex(`blocked_ip:${ipAddress}`, this.config.lockoutDuration, reason);
            this.blockedIPs.add(ipAddress);
            structuredLogger.warn('IP blocked', { ipAddress, reason });
        }
        catch (error) {
            structuredLogger.error('IP block error', error, { ipAddress, reason });
        }
    }
    async unblockIP(ipAddress) {
        try {
            const redis = getRedisService();
            await redis.del(`blocked_ip:${ipAddress}`);
            this.blockedIPs.delete(ipAddress);
            structuredLogger.info('IP unblocked', { ipAddress });
        }
        catch (error) {
            structuredLogger.error('IP unblock error', error, { ipAddress });
        }
    }
    async detectSuspiciousActivity(userId, organizationId, action, ipAddress, userAgent, details) {
        try {
            const key = `suspicious_activity:${userId}:${ipAddress}`;
            const redis = getRedisService();
            const count = await redis.incr(key);
            await redis.expire(key, 3600);
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
        }
        catch (error) {
            structuredLogger.error('Suspicious activity detection error', error, { userId, action });
            return false;
        }
    }
    encryptData(data) {
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
        }
        catch (error) {
            structuredLogger.error('Data encryption error', error);
            throw new Error('Failed to encrypt data');
        }
    }
    decryptData(encryptedData) {
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
        }
        catch (error) {
            structuredLogger.error('Data decryption error', error);
            throw new Error('Failed to decrypt data');
        }
    }
    async recordAuditLog(auditLog) {
        try {
            const log = {
                id: crypto.randomUUID(),
                timestamp: new Date(),
                ...auditLog
            };
            const redis = getRedisService();
            await redis.lpush('audit_logs', JSON.stringify(log));
            await redis.ltrim('audit_logs', 0, 10000);
            structuredLogger.info('Audit log recorded', log);
        }
        catch (error) {
            structuredLogger.error('Audit log recording error', error, auditLog);
        }
    }
    async recordSecurityEvent(event) {
        try {
            const securityEvent = {
                id: crypto.randomUUID(),
                timestamp: new Date(),
                ...event
            };
            const redis = getRedisService();
            await redis.lpush('security_events', JSON.stringify(securityEvent));
            await redis.ltrim('security_events', 0, 5000);
            const logLevel = this.getLogLevel(securityEvent.severity);
            structuredLogger[logLevel]('Security event recorded', securityEvent);
            if (securityEvent.severity === 'CRITICAL') {
                await this.sendSecurityAlert(securityEvent);
            }
        }
        catch (error) {
            structuredLogger.error('Security event recording error', error, event);
        }
    }
    validateInput(data, schema) {
        const errors = [];
        try {
            for (const [field, rules] of Object.entries(schema)) {
                const value = data[field];
                if (rules.required && (value === undefined || value === null || value === '')) {
                    errors.push(`${field} is required`);
                    continue;
                }
                if (value !== undefined && value !== null) {
                    if (rules.type && typeof value !== rules.type) {
                        errors.push(`${field} must be of type ${rules.type}`);
                    }
                    if (rules.minLength && value.length < rules.minLength) {
                        errors.push(`${field} must be at least ${rules.minLength} characters long`);
                    }
                    if (rules.maxLength && value.length > rules.maxLength) {
                        errors.push(`${field} cannot exceed ${rules.maxLength} characters`);
                    }
                    if (rules.pattern && !rules.pattern.test(value)) {
                        errors.push(`${field} format is invalid`);
                    }
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
        }
        catch (error) {
            structuredLogger.error('Input validation error', error, { data, schema });
            return {
                isValid: false,
                errors: ['Validation error occurred']
            };
        }
    }
    sanitizeInput(input) {
        return input
            .trim()
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
    }
    getLogLevel(severity) {
        switch (severity) {
            case 'LOW': return 'info';
            case 'MEDIUM': return 'warn';
            case 'HIGH': return 'error';
            case 'CRITICAL': return 'error';
            default: return 'info';
        }
    }
    async sendSecurityAlert(event) {
        try {
            structuredLogger.error('SECURITY ALERT', event);
        }
        catch (error) {
            structuredLogger.error('Security alert sending error', error, event);
        }
    }
    startSecurityMonitoring() {
        setInterval(() => {
            this.cleanupExpiredBlocks();
        }, 3600000);
        setInterval(() => {
            this.cleanupOldLogs();
        }, 86400000);
    }
    async cleanupExpiredBlocks() {
        try {
            const redis = getRedisService();
            const keys = await redis.keys('blocked_ip:*');
            for (const key of keys) {
                const ttl = await redis.ttl(key);
                if (ttl === -1) {
                    await redis.del(key);
                }
            }
        }
        catch (error) {
            structuredLogger.error('Cleanup expired blocks error', error);
        }
    }
    async cleanupOldLogs() {
        try {
            const redis = getRedisService();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.config.auditLogRetention);
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
        }
        catch (error) {
            structuredLogger.error('Cleanup old logs error', error);
        }
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('Security config updated', newConfig);
    }
    getConfig() {
        return { ...this.config };
    }
}
export const securityService = new SecurityService();
//# sourceMappingURL=security.service.js.map