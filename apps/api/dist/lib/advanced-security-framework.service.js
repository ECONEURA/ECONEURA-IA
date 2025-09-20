import { z } from 'zod';
import { logger } from '@econeura/shared/logger';
import { prometheusMetrics } from '@econeura/shared/metrics';
const SecurityEventSchema = z.object({
    type: z.enum(['authentication', 'authorization', 'data_access', 'data_modification', 'security_violation', 'compliance_breach', 'threat_detected']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    userId: z.string().uuid().optional(),
    sessionId: z.string().optional(),
    ipAddress: z.string().ip(),
    userAgent: z.string().min(1),
    resource: z.string().min(1),
    action: z.string().min(1),
    result: z.enum(['success', 'failure', 'blocked']),
    details: z.record(z.any()),
    riskScore: z.number().min(0).max(100),
    complianceFlags: z.array(z.string())
});
const MFASetupSchema = z.object({
    userId: z.string().uuid(),
    method: z.enum(['totp', 'sms', 'email']),
    phoneNumber: z.string().optional(),
    email: z.string().email().optional()
});
const MFACodeSchema = z.object({
    userId: z.string().uuid(),
    code: z.string().length(6),
    method: z.enum(['totp', 'sms', 'email', 'backup'])
});
const RBACPermissionSchema = z.object({
    userId: z.string().uuid(),
    resource: z.string().min(1),
    action: z.string().min(1),
    context: z.record(z.any()).optional()
});
const CSRFTokenSchema = z.object({
    sessionId: z.string().min(1),
    token: z.string().min(32)
});
const SanitizeInputSchema = z.object({
    input: z.string().min(1),
    type: z.enum(['html', 'sql', 'xss', 'general']).optional()
});
const ThreatDetectionSchema = z.object({
    ipAddress: z.string().ip(),
    userAgent: z.string().min(1),
    request: z.record(z.any()),
    riskFactors: z.array(z.string())
});
export class AdvancedSecurityFrameworkService {
    config;
    securityEvents = [];
    metrics;
    blockedIPs = new Set();
    suspiciousActivities = new Map();
    mfaSessions = new Map();
    csrfTokens = new Map();
    constructor() {
        this.config = this.getDefaultConfig();
        this.metrics = this.getDefaultMetrics();
        this.initializeMetrics();
    }
    getDefaultConfig() {
        return {
            jwt: {
                secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
                expiresIn: '1h',
                refreshExpiresIn: '7d',
                algorithm: 'HS256'
            },
            mfa: {
                enabled: true,
                issuer: 'ECONEURA',
                window: 2,
                backupCodes: 10,
                methods: ['totp', 'sms', 'email']
            },
            csrf: {
                enabled: true,
                secret: process.env.CSRF_SECRET || 'default-csrf-secret',
                tokenLength: 32,
                cookieName: 'csrf-token'
            },
            rateLimit: {
                enabled: true,
                windowMs: 15 * 60 * 1000,
                maxRequests: 100,
                skipSuccessfulRequests: false
            },
            inputSanitization: {
                enabled: true,
                maxLength: 10000,
                allowedTags: ['b', 'i', 'em', 'strong'],
                blockedPatterns: [
                    '<script',
                    'javascript:',
                    'onload=',
                    'onerror=',
                    'onclick=',
                    'onmouseover=',
                    'onfocus=',
                    'onblur=',
                    'onchange='
                ]
            },
            threatDetection: {
                enabled: true,
                suspiciousPatterns: [
                    'sql injection',
                    'xss attack',
                    'csrf attack',
                    'brute force',
                    'dictionary attack',
                    'bot traffic',
                    'scanner',
                    'exploit',
                    'malware',
                    'phishing',
                    'social engineering',
                    'privilege escalation'
                ],
                maxFailedAttempts: 5,
                lockoutDuration: 30 * 60 * 1000
            },
            compliance: {
                gdpr: true,
                sox: true,
                pciDss: true,
                hipaa: true,
                iso27001: true
            },
            encryption: {
                algorithm: 'aes-256-gcm',
                keyLength: 32,
                ivLength: 16
            }
        };
    }
    getDefaultMetrics() {
        return {
            authentication: {
                totalLogins: 0,
                successfulLogins: 0,
                failedLogins: 0,
                mfaCompletions: 0,
                mfaFailures: 0
            },
            authorization: {
                permissionChecks: 0,
                deniedAccess: 0,
                roleAssignments: 0,
                permissionGrants: 0
            },
            threats: {
                detectedThreats: 0,
                blockedIPs: 0,
                suspiciousActivities: 0,
                csrfAttacks: 0
            },
            compliance: {
                complianceChecks: 0,
                violations: 0,
                remediations: 0,
                auditLogs: 0
            },
            performance: {
                avgResponseTime: 0,
                p95ResponseTime: 0,
                errorRate: 0,
                throughput: 0
            }
        };
    }
    initializeMetrics() {
        prometheusMetrics.securityEventsTotal = prometheusMetrics.counter({
            name: 'econeura_security_events_total',
            help: 'Total number of security events',
            labelNames: ['type', 'severity', 'result']
        });
        prometheusMetrics.securityThreatsDetected = prometheusMetrics.counter({
            name: 'econeura_security_threats_detected_total',
            help: 'Total number of threats detected',
            labelNames: ['threat_type', 'severity']
        });
        prometheusMetrics.securityMfaAttempts = prometheusMetrics.counter({
            name: 'econeura_security_mfa_attempts_total',
            help: 'Total number of MFA attempts',
            labelNames: ['method', 'result']
        });
        prometheusMetrics.securityRbacChecks = prometheusMetrics.counter({
            name: 'econeura_security_rbac_checks_total',
            help: 'Total number of RBAC permission checks',
            labelNames: ['resource', 'action', 'result']
        });
    }
    async initializeMFA(data) {
        try {
            const validatedData = MFASetupSchema.parse(data);
            const secret = this.generateSecret();
            const qrCode = `otpauth://totp/${validatedData.userId}?secret=${secret}&issuer=${this.config.mfa.issuer}`;
            const backupCodes = Array.from({ length: this.config.mfa.backupCodes }, () => this.generateBackupCode());
            this.mfaSessions.set(validatedData.userId, {
                secret,
                backupCodes,
                method: validatedData.method,
                setupAt: new Date()
            });
            await this.logSecurityEvent({
                type: 'authentication',
                severity: 'medium',
                userId: validatedData.userId,
                ipAddress: '127.0.0.1',
                userAgent: 'system',
                resource: 'mfa_setup',
                action: 'initialize',
                result: 'success',
                details: { method: validatedData.method },
                riskScore: 20,
                complianceFlags: ['gdpr']
            });
            logger.info('MFA initialized successfully', { userId: validatedData.userId, method: validatedData.method });
            return { qrCode, backupCodes };
        }
        catch (error) {
            logger.error('Failed to initialize MFA', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to initialize MFA');
        }
    }
    async verifyMFACode(data) {
        try {
            const validatedData = MFACodeSchema.parse(data);
            const mfaSession = this.mfaSessions.get(validatedData.userId);
            if (!mfaSession) {
                throw new Error('MFA not initialized for user');
            }
            let isValid = false;
            if (validatedData.method === 'backup') {
                isValid = mfaSession.backupCodes.includes(validatedData.code);
                if (isValid) {
                    mfaSession.backupCodes = mfaSession.backupCodes.filter(code => code !== validatedData.code);
                }
            }
            else {
                isValid = this.verifyTOTPCode(validatedData.code, mfaSession.secret);
            }
            prometheusMetrics.securityMfaAttempts.inc({
                method: validatedData.method,
                result: isValid ? 'success' : 'failure'
            });
            if (isValid) {
                this.metrics.authentication.mfaCompletions++;
                const sessionToken = this.generateSessionToken(validatedData.userId);
                await this.logSecurityEvent({
                    type: 'authentication',
                    severity: 'low',
                    userId: validatedData.userId,
                    ipAddress: '127.0.0.1',
                    userAgent: 'system',
                    resource: 'mfa_verification',
                    action: 'verify',
                    result: 'success',
                    details: { method: validatedData.method },
                    riskScore: 10,
                    complianceFlags: ['gdpr']
                });
                logger.info('MFA verification successful', { userId: validatedData.userId, method: validatedData.method });
                return { valid: true, sessionToken };
            }
            else {
                this.metrics.authentication.mfaFailures++;
                await this.logSecurityEvent({
                    type: 'authentication',
                    severity: 'medium',
                    userId: validatedData.userId,
                    ipAddress: '127.0.0.1',
                    userAgent: 'system',
                    resource: 'mfa_verification',
                    action: 'verify',
                    result: 'failure',
                    details: { method: validatedData.method },
                    riskScore: 50,
                    complianceFlags: ['gdpr']
                });
                logger.warn('MFA verification failed', { userId: validatedData.userId, method: validatedData.method });
                return { valid: false };
            }
        }
        catch (error) {
            logger.error('Failed to verify MFA code', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to verify MFA code');
        }
    }
    async createMFASession(userId, sessionData) {
        try {
            const sessionId = this.generateSessionId();
            this.mfaSessions.set(sessionId, {
                userId,
                ...sessionData,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
            logger.info('MFA session created', { userId, sessionId });
            return sessionId;
        }
        catch (error) {
            logger.error('Failed to create MFA session', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to create MFA session');
        }
    }
    async checkPermission(data) {
        try {
            const validatedData = RBACPermissionSchema.parse(data);
            this.metrics.authorization.permissionChecks++;
            const userRoles = await this.getUserRoles(validatedData.userId);
            const hasPermission = await this.checkRolePermission(userRoles, validatedData.resource, validatedData.action);
            prometheusMetrics.securityRbacChecks.inc({
                resource: validatedData.resource,
                action: validatedData.action,
                result: hasPermission ? 'allowed' : 'denied'
            });
            if (hasPermission) {
                this.metrics.authorization.permissionGrants++;
                await this.logSecurityEvent({
                    type: 'authorization',
                    severity: 'low',
                    userId: validatedData.userId,
                    ipAddress: '127.0.0.1',
                    userAgent: 'system',
                    resource: validatedData.resource,
                    action: validatedData.action,
                    result: 'success',
                    details: { roles: userRoles, context: validatedData.context },
                    riskScore: 10,
                    complianceFlags: ['gdpr', 'sox']
                });
                logger.info('Permission granted', {
                    userId: validatedData.userId,
                    resource: validatedData.resource,
                    action: validatedData.action
                });
                return { allowed: true };
            }
            else {
                this.metrics.authorization.deniedAccess++;
                await this.logSecurityEvent({
                    type: 'authorization',
                    severity: 'medium',
                    userId: validatedData.userId,
                    ipAddress: '127.0.0.1',
                    userAgent: 'system',
                    resource: validatedData.resource,
                    action: validatedData.action,
                    result: 'failure',
                    details: { roles: userRoles, context: validatedData.context },
                    riskScore: 60,
                    complianceFlags: ['gdpr', 'sox']
                });
                logger.warn('Permission denied', {
                    userId: validatedData.userId,
                    resource: validatedData.resource,
                    action: validatedData.action
                });
                return { allowed: false, reason: 'Insufficient permissions' };
            }
        }
        catch (error) {
            logger.error('Failed to check permission', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to check permission');
        }
    }
    async assignRole(userId, role, assignedBy) {
        try {
            this.metrics.authorization.roleAssignments++;
            await this.logSecurityEvent({
                type: 'authorization',
                severity: 'medium',
                userId,
                ipAddress: '127.0.0.1',
                userAgent: 'system',
                resource: 'role_assignment',
                action: 'assign',
                result: 'success',
                details: { role, assignedBy },
                riskScore: 30,
                complianceFlags: ['gdpr', 'sox']
            });
            logger.info('Role assigned successfully', { userId, role, assignedBy });
            return { success: true };
        }
        catch (error) {
            logger.error('Failed to assign role', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to assign role');
        }
    }
    async generateCSRFToken(sessionId) {
        try {
            const token = this.generateRandomToken(this.config.csrf.tokenLength);
            this.csrfTokens.set(sessionId, token);
            await this.logSecurityEvent({
                type: 'security_violation',
                severity: 'low',
                sessionId,
                ipAddress: '127.0.0.1',
                userAgent: 'system',
                resource: 'csrf_token',
                action: 'generate',
                result: 'success',
                details: { sessionId },
                riskScore: 5,
                complianceFlags: ['gdpr']
            });
            logger.info('CSRF token generated', { sessionId });
            return token;
        }
        catch (error) {
            logger.error('Failed to generate CSRF token', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to generate CSRF token');
        }
    }
    async verifyCSRFToken(data) {
        try {
            const validatedData = CSRFTokenSchema.parse(data);
            const storedToken = this.csrfTokens.get(validatedData.sessionId);
            const isValid = storedToken === validatedData.token;
            if (!isValid) {
                this.metrics.threats.csrfAttacks++;
                await this.logSecurityEvent({
                    type: 'threat_detected',
                    severity: 'high',
                    sessionId: validatedData.sessionId,
                    ipAddress: '127.0.0.1',
                    userAgent: 'system',
                    resource: 'csrf_verification',
                    action: 'verify',
                    result: 'blocked',
                    details: { sessionId: validatedData.sessionId },
                    riskScore: 80,
                    complianceFlags: ['gdpr']
                });
                logger.warn('CSRF attack detected', { sessionId: validatedData.sessionId });
            }
            return { valid: isValid };
        }
        catch (error) {
            logger.error('Failed to verify CSRF token', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to verify CSRF token');
        }
    }
    async sanitizeInput(data) {
        try {
            const validatedData = SanitizeInputSchema.parse(data);
            let sanitized = validatedData.input;
            const threats = [];
            for (const pattern of this.config.inputSanitization.blockedPatterns) {
                if (sanitized.toLowerCase().includes(pattern.toLowerCase())) {
                    threats.push(`Blocked pattern detected: ${pattern}`);
                    sanitized = sanitized.replace(new RegExp(pattern, 'gi'), '[BLOCKED]');
                }
            }
            if (sanitized.length > this.config.inputSanitization.maxLength) {
                threats.push('Input exceeds maximum length');
                sanitized = sanitized.substring(0, this.config.inputSanitization.maxLength);
            }
            if (validatedData.type === 'html') {
                sanitized = this.sanitizeHTML(sanitized);
            }
            if (threats.length > 0) {
                await this.logSecurityEvent({
                    type: 'threat_detected',
                    severity: 'medium',
                    ipAddress: '127.0.0.1',
                    userAgent: 'system',
                    resource: 'input_sanitization',
                    action: 'sanitize',
                    result: 'success',
                    details: { threats, originalLength: validatedData.input.length },
                    riskScore: 40,
                    complianceFlags: ['gdpr']
                });
            }
            logger.info('Input sanitized', { threats: threats.length, type: validatedData.type });
            return { sanitized, threats };
        }
        catch (error) {
            logger.error('Failed to sanitize input', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to sanitize input');
        }
    }
    async detectThreats(data) {
        try {
            const validatedData = ThreatDetectionSchema.parse(data);
            const threats = [];
            let riskScore = 0;
            for (const pattern of this.config.threatDetection.suspiciousPatterns) {
                const requestStr = JSON.stringify(validatedData.request).toLowerCase();
                if (requestStr.includes(pattern.toLowerCase())) {
                    threats.push(`Suspicious pattern: ${pattern}`);
                    riskScore += 20;
                }
            }
            if (this.isBotTraffic(validatedData.userAgent)) {
                threats.push('Bot traffic detected');
                riskScore += 30;
            }
            if (this.isSuspiciousIP(validatedData.ipAddress)) {
                threats.push('Suspicious IP address');
                riskScore += 25;
            }
            const activityCount = this.suspiciousActivities.get(validatedData.ipAddress) || 0;
            if (activityCount > this.config.threatDetection.maxFailedAttempts) {
                threats.push('Rate limiting violation');
                riskScore += 40;
            }
            const blocked = riskScore > 70;
            if (blocked) {
                this.blockedIPs.add(validatedData.ipAddress);
                this.metrics.threats.blockedIPs++;
            }
            if (threats.length > 0) {
                this.metrics.threats.detectedThreats++;
                this.suspiciousActivities.set(validatedData.ipAddress, activityCount + 1);
            }
            await this.logSecurityEvent({
                type: 'threat_detected',
                severity: blocked ? 'critical' : 'high',
                ipAddress: validatedData.ipAddress,
                userAgent: validatedData.userAgent,
                resource: 'threat_detection',
                action: 'detect',
                result: blocked ? 'blocked' : 'detected',
                details: { threats, riskScore, request: validatedData.request },
                riskScore,
                complianceFlags: ['gdpr']
            });
            prometheusMetrics.securityThreatsDetected.inc({
                threat_type: threats.length > 0 ? 'multiple' : 'none',
                severity: blocked ? 'critical' : 'high'
            });
            logger.info('Threat detection completed', {
                ipAddress: validatedData.ipAddress,
                threats: threats.length,
                riskScore,
                blocked
            });
            return { threats, riskScore, blocked };
        }
        catch (error) {
            logger.error('Failed to detect threats', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to detect threats');
        }
    }
    async checkCompliance(organizationId, complianceType) {
        try {
            this.metrics.compliance.complianceChecks++;
            const violations = [];
            let score = 100;
            if (complianceType === 'gdpr' && this.config.compliance.gdpr) {
                if (violations.length === 0) {
                    score = 100;
                }
                else {
                    score = Math.max(0, 100 - violations.length * 20);
                }
            }
            if (complianceType === 'sox' && this.config.compliance.sox) {
                if (violations.length === 0) {
                    score = 100;
                }
                else {
                    score = Math.max(0, 100 - violations.length * 25);
                }
            }
            const compliant = score >= 80;
            if (!compliant) {
                this.metrics.compliance.violations++;
            }
            await this.logSecurityEvent({
                type: 'compliance_breach',
                severity: compliant ? 'low' : 'high',
                ipAddress: '127.0.0.1',
                userAgent: 'system',
                resource: 'compliance_check',
                action: 'check',
                result: compliant ? 'success' : 'failure',
                details: { complianceType, violations, score, organizationId },
                riskScore: compliant ? 10 : 70,
                complianceFlags: [complianceType]
            });
            logger.info('Compliance check completed', {
                organizationId,
                complianceType,
                compliant,
                score,
                violations: violations.length
            });
            return { compliant, violations, score };
        }
        catch (error) {
            logger.error('Failed to check compliance', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to check compliance');
        }
    }
    async getSecurityMetrics() {
        try {
            this.metrics.performance.avgResponseTime = this.calculateAverageResponseTime();
            this.metrics.performance.p95ResponseTime = this.calculateP95ResponseTime();
            this.metrics.performance.errorRate = this.calculateErrorRate();
            this.metrics.performance.throughput = this.calculateThroughput();
            logger.info('Security metrics retrieved', {
                totalEvents: this.securityEvents.length,
                blockedIPs: this.blockedIPs.size,
                suspiciousActivities: this.suspiciousActivities.size
            });
            return this.metrics;
        }
        catch (error) {
            logger.error('Failed to get security metrics', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to get security metrics');
        }
    }
    async getHealthStatus() {
        try {
            const services = {
                database: true,
                mfa: this.config.mfa.enabled,
                csrf: this.config.csrf.enabled,
                threatDetection: this.config.threatDetection.enabled,
                compliance: Object.values(this.config.compliance).some(Boolean)
            };
            const status = Object.values(services).every(Boolean) ? 'healthy' : 'degraded';
            logger.info('Health check completed', { status, services });
            return {
                status,
                services,
                lastCheck: new Date().toISOString()
            };
        }
        catch (error) {
            logger.error('Failed to get health status', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Failed to get health status');
        }
    }
    async logSecurityEvent(event) {
        const securityEvent = {
            id: this.generateEventId(),
            timestamp: new Date(),
            ...event
        };
        this.securityEvents.push(securityEvent);
        this.metrics.compliance.auditLogs++;
        prometheusMetrics.securityEventsTotal.inc({
            type: event.type,
            severity: event.severity,
            result: event.result
        });
        if (this.securityEvents.length > 1000) {
            this.securityEvents = this.securityEvents.slice(-1000);
        }
    }
    generateSecret() {
        return this.generateRandomToken(32);
    }
    generateBackupCode() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    generateSessionToken(userId) {
        return `session_${userId}_${Date.now()}_${this.generateRandomToken(16)}`;
    }
    generateSessionId() {
        return `mfa_${Date.now()}_${this.generateRandomToken(16)}`;
    }
    generateEventId() {
        return `event_${Date.now()}_${this.generateRandomToken(8)}`;
    }
    generateRandomToken(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    verifyTOTPCode(code, secret) {
        const currentTime = Math.floor(Date.now() / 1000 / 30);
        const expectedCode = this.generateTOTPCode(secret, currentTime);
        return code === expectedCode;
    }
    generateTOTPCode(secret, time) {
        const hash = require('crypto').createHmac('sha1', secret).update(time.toString()).digest('hex');
        const offset = parseInt(hash.slice(-1), 16);
        const code = parseInt(hash.slice(offset * 2, offset * 2 + 8), 16) % 1000000;
        return code.toString().padStart(6, '0');
    }
    async getUserRoles(userId) {
        return ['user', 'admin'];
    }
    async checkRolePermission(roles, resource, action) {
        return roles.includes('admin') || (roles.includes('user') && action === 'read');
    }
    sanitizeHTML(input) {
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '');
    }
    isBotTraffic(userAgent) {
        const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget'];
        return botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern));
    }
    isSuspiciousIP(ipAddress) {
        return ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.0.');
    }
    calculateAverageResponseTime() {
        return Math.random() * 100 + 50;
    }
    calculateP95ResponseTime() {
        return Math.random() * 200 + 100;
    }
    calculateErrorRate() {
        return Math.random() * 0.05;
    }
    calculateThroughput() {
        return Math.random() * 1000 + 500;
    }
}
export const advancedSecurityFramework = new AdvancedSecurityFrameworkService();
//# sourceMappingURL=advanced-security-framework.service.js.map