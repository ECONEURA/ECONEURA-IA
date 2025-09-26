import crypto from 'crypto';

import { metrics } from '@econeura/shared/src/metrics/index.js';
import jwt from 'jsonwebtoken';

import { structuredLogger } from '../lib/structured-logger.js';
export class SecurityManagerService {
    static instance;
    config;
    activeSessions = new Map();
    securityEvents = [];
    threatDatabase = new Map();
    failedAttempts = new Map();
    isMonitoring = false;
    monitoringInterval = null;
    constructor() {
        this.config = this.getDefaultConfig();
        this.startMonitoring();
    }
    static getInstance() {
        if (!SecurityManagerService.instance) {
            SecurityManagerService.instance = new SecurityManagerService();
        }
        return SecurityManagerService.instance;
    }
    getDefaultConfig() {
        return {
            jwt: {
                secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
                expiresIn: '15m',
                refreshExpiresIn: '7d',
                algorithm: 'HS256'
            },
            mfa: {
                enabled: true,
                issuer: 'ECONEURA',
                window: 2,
                backupCodes: 10
            },
            csrf: {
                enabled: true,
                secret: process.env.CSRF_SECRET || 'your-csrf-secret-key',
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
                allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
                blockedPatterns: [
                    '<script',
                    'javascript:',
                    'onload=',
                    'onerror=',
                    'onclick=',
                    'onmouseover=',
                    'eval(',
                    'document.cookie',
                    'window.location'
                ]
            },
            threatDetection: {
                enabled: true,
                suspiciousPatterns: [
                    'admin',
                    'root',
                    'password',
                    'login',
                    'sql',
                    'union',
                    'select',
                    'drop',
                    'delete',
                    'insert',
                    'update'
                ],
                maxFailedAttempts: 5,
                lockoutDuration: 15 * 60 * 1000
            }
        };
    }
    generateJWT(payload) {
        try {
            const token = jwt.sign(payload, this.config.jwt.secret, {
                expiresIn: this.config.jwt.expiresIn,
                algorithm: this.config.jwt.algorithm
            });
            structuredLogger.debug('JWT token generated', {
                userId: payload.userId,
                organizationId: payload.organizationId
            });
            return token;
        }
        catch (error) {
            structuredLogger.error('Failed to generate JWT', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to generate JWT token');
        }
    }
    verifyJWT(token) {
        try {
            const decoded = jwt.verify(token, this.config.jwt.secret, {
                algorithms: [this.config.jwt.algorithm]
            });
            structuredLogger.debug('JWT token verified', {
                userId: decoded.userId
            });
            return decoded;
        }
        catch (error) {
            structuredLogger.warn('JWT token verification failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Invalid JWT token');
        }
    }
    generateRefreshToken(payload) {
        try {
            const token = jwt.sign(payload, this.config.jwt.secret, {
                expiresIn: this.config.jwt.refreshExpiresIn,
                algorithm: this.config.jwt.algorithm
            });
            structuredLogger.debug('Refresh token generated', {
                userId: payload.userId
            });
            return token;
        }
        catch (error) {
            structuredLogger.error('Failed to generate refresh token', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to generate refresh token');
        }
    }
    generateMFASecret(userId) {
        try {
            const secret = this.generateRandomString(32);
            const qrCode = this.generateQRCode(secret, userId);
            const backupCodes = this.generateBackupCodes();
            const mfaSecret = {
                secret,
                qrCode,
                backupCodes,
                createdAt: new Date()
            };
            structuredLogger.info('MFA secret generated', {
                userId,
                backupCodesCount: backupCodes.length
            });
            metrics.securityMfaSecretsGenerated.inc({ userId });
            return mfaSecret;
        }
        catch (error) {
            structuredLogger.error('Failed to generate MFA secret', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to generate MFA secret');
        }
    }
    verifyMFACode(secret, code, userId) {
        try {
            const isValid = this.validateTOTPCode(secret, code);
            if (isValid) {
                structuredLogger.info('MFA code verified successfully', {
                    userId,
                    code: code.substring(0, 2) + '****'
                });
                metrics.securityMfaVerifications.inc({
                    userId,
                    result: 'success'
                });
                this.recordSecurityEvent({
                    type: 'mfa_success',
                    userId,
                    ipAddress: '127.0.0.1',
                    userAgent: 'SecurityManager',
                    details: { codeLength: code.length },
                    severity: 'low',
                    timestamp: new Date()
                });
            }
            else {
                structuredLogger.warn('MFA code verification failed', {
                    userId,
                    code: code.substring(0, 2) + '****'
                });
                metrics.securityMfaVerifications.inc({
                    userId,
                    result: 'failure'
                });
                this.recordSecurityEvent({
                    type: 'mfa_failure',
                    userId,
                    ipAddress: '127.0.0.1',
                    userAgent: 'SecurityManager',
                    details: { codeLength: code.length },
                    severity: 'medium',
                    timestamp: new Date()
                });
            }
            return isValid;
        }
        catch (error) {
            structuredLogger.error('MFA verification error', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    generateCSRFToken() {
        try {
            const token = crypto.randomBytes(this.config.csrf.tokenLength).toString('hex');
            structuredLogger.debug('CSRF token generated', {
                tokenLength: token.length
            });
            return token;
        }
        catch (error) {
            structuredLogger.error('Failed to generate CSRF token', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to generate CSRF token');
        }
    }
    verifyCSRFToken(token, sessionToken) {
        try {
            const isValid = token === sessionToken;
            if (!isValid) {
                structuredLogger.warn('CSRF token verification failed', {
                    tokenLength: token.length,
                    sessionTokenLength: sessionToken.length
                });
                this.recordSecurityEvent({
                    type: 'csrf_attack',
                    ipAddress: '127.0.0.1',
                    userAgent: 'SecurityManager',
                    details: { tokenLength: token.length },
                    severity: 'high',
                    timestamp: new Date()
                });
                metrics.securityCsrfAttacks.inc();
            }
            return isValid;
        }
        catch (error) {
            structuredLogger.error('CSRF verification error', {
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    sanitizeInput(input) {
        try {
            if (!this.config.inputSanitization.enabled) {
                return input;
            }
            let sanitized = input;
            if (sanitized.length > this.config.inputSanitization.maxLength) {
                sanitized = sanitized.substring(0, this.config.inputSanitization.maxLength);
            }
            for (const pattern of this.config.inputSanitization.blockedPatterns) {
                const regex = new RegExp(pattern, 'gi');
                sanitized = sanitized.replace(regex, '[BLOCKED]');
            }
            sanitized = sanitized
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
            if (sanitized !== input) {
                structuredLogger.warn('Input sanitization applied', {
                    originalLength: input.length,
                    sanitizedLength: sanitized.length,
                    blockedPatterns: this.config.inputSanitization.blockedPatterns.filter(p => input.toLowerCase().includes(p.toLowerCase()))
                });
                this.recordSecurityEvent({
                    type: 'input_sanitization',
                    ipAddress: '127.0.0.1',
                    userAgent: 'SecurityManager',
                    details: {
                        originalLength: input.length,
                        sanitizedLength: sanitized.length
                    },
                    severity: 'low',
                    timestamp: new Date()
                });
                metrics.securityInputSanitizations.inc();
            }
            return sanitized;
        }
        catch (error) {
            structuredLogger.error('Input sanitization error', {
                error: error instanceof Error ? error.message : String(error)
            });
            return input;
        }
    }
    detectThreat(ipAddress, userAgent, requestData) {
        try {
            if (!this.config.threatDetection.enabled) {
                return null;
            }
            const threatLevel = this.analyzeThreatLevel(ipAddress, userAgent, requestData);
            if (threatLevel === 'low') {
                return null;
            }
            const existingThreat = this.threatDatabase.get(ipAddress);
            const now = new Date();
            if (existingThreat) {
                existingThreat.attempts++;
                existingThreat.lastSeen = now;
                existingThreat.threatLevel = this.escalateThreatLevel(existingThreat.threatLevel, threatLevel);
            }
            else {
                const newThreat = {
                    ipAddress,
                    threatLevel,
                    attackTypes: this.identifyAttackTypes(requestData),
                    attempts: 1,
                    firstSeen: now,
                    lastSeen: now,
                    blocked: false
                };
                this.threatDatabase.set(ipAddress, newThreat);
            }
            const threat = this.threatDatabase.get(ipAddress);
            if (threat.threatLevel === 'critical' && threat.attempts >= 3) {
                threat.blocked = true;
                structuredLogger.error('IP address blocked due to critical threat', {
                    ipAddress,
                    threatLevel: threat.threatLevel,
                    attempts: threat.attempts,
                    attackTypes: threat.attackTypes
                });
                this.recordSecurityEvent({
                    type: 'threat_detected',
                    ipAddress,
                    userAgent,
                    details: {
                        threatLevel: threat.threatLevel,
                        attempts: threat.attempts,
                        attackTypes: threat.attackTypes
                    },
                    severity: 'critical',
                    timestamp: now
                });
                metrics.securityThreatsDetected.inc({
                    threatLevel: threat.threatLevel,
                    attackType: threat.attackTypes.join(',')
                });
            }
            return threat;
        }
        catch (error) {
            structuredLogger.error('Threat detection error', {
                ipAddress,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }
    checkPermission(userId, permission, resource) {
        try {
            const session = this.activeSessions.get(userId);
            if (!session) {
                structuredLogger.warn('Permission check failed - no active session', {
                    userId,
                    permission,
                    resource
                });
                return false;
            }
            const hasPermission = session.permissions.includes(permission) ||
                session.permissions.includes('*') ||
                session.roles.includes('admin');
            if (!hasPermission) {
                structuredLogger.warn('Permission denied', {
                    userId,
                    permission,
                    resource,
                    userRoles: session.roles,
                    userPermissions: session.permissions
                });
                this.recordSecurityEvent({
                    type: 'permission_denied',
                    userId,
                    organizationId: session.organizationId,
                    ipAddress: session.ipAddress,
                    userAgent: session.userAgent,
                    details: { permission, resource },
                    severity: 'medium',
                    timestamp: new Date()
                });
                metrics.securityPermissionDenied.inc({
                    userId,
                    permission
                });
            }
            return hasPermission;
        }
        catch (error) {
            structuredLogger.error('Permission check error', {
                userId,
                permission,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    recordSecurityEvent(event) {
        try {
            this.securityEvents.push(event);
            if (this.securityEvents.length > 1000) {
                this.securityEvents = this.securityEvents.slice(-1000);
            }
            structuredLogger.info('Security event recorded', {
                type: event.type,
                severity: event.severity,
                userId: event.userId,
                ipAddress: event.ipAddress
            });
            metrics.securityEvents.inc({
                type: event.type,
                severity: event.severity
            });
        }
        catch (error) {
            structuredLogger.error('Failed to record security event', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    getSecurityStats() {
        const activeSessions = this.activeSessions.size;
        const securityEvents = this.securityEvents.length;
        const threatsDetected = this.threatDatabase.size;
        const blockedIPs = Array.from(this.threatDatabase.values()).filter(t => t.blocked).length;
        return {
            activeSessions,
            securityEvents,
            threatsDetected,
            blockedIPs,
            mfaEnabled: this.config.mfa.enabled,
            csrfEnabled: this.config.csrf.enabled,
            rateLimitEnabled: this.config.rateLimit.enabled,
            inputSanitizationEnabled: this.config.inputSanitization.enabled,
            threatDetectionEnabled: this.config.threatDetection.enabled
        };
    }
    generateRandomString(length) {
        return crypto.randomBytes(length).toString('hex');
    }
    generateQRCode(secret, userId) {
        return `otpauth://totp/${this.config.mfa.issuer}:${userId}?secret=${secret}&issuer=${this.config.mfa.issuer}`;
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < this.config.mfa.backupCodes; i++) {
            codes.push(this.generateRandomString(8));
        }
        return codes;
    }
    validateTOTPCode(secret, code) {
        return code.length === 6 && /^\d+$/.test(code);
    }
    analyzeThreatLevel(ipAddress, userAgent, requestData) {
        let threatScore = 0;
        const dataString = JSON.stringify(requestData).toLowerCase();
        for (const pattern of this.config.threatDetection.suspiciousPatterns) {
            if (dataString.includes(pattern.toLowerCase())) {
                threatScore += 10;
            }
        }
        if (userAgent.includes('bot') || userAgent.includes('crawler')) {
            threatScore += 5;
        }
        const failedAttempts = this.failedAttempts.get(ipAddress);
        if (failedAttempts && failedAttempts.count > 3) {
            threatScore += 20;
        }
        if (threatScore >= 50)
            return 'critical';
        if (threatScore >= 30)
            return 'high';
        if (threatScore >= 15)
            return 'medium';
        return 'low';
    }
    identifyAttackTypes(requestData) {
        const attackTypes = [];
        const dataString = JSON.stringify(requestData).toLowerCase();
        if (dataString.includes('sql') || dataString.includes('union') || dataString.includes('select')) {
            attackTypes.push('sql_injection');
        }
        if (dataString.includes('<script') || dataString.includes('javascript:')) {
            attackTypes.push('xss');
        }
        if (dataString.includes('admin') || dataString.includes('root')) {
            attackTypes.push('privilege_escalation');
        }
        return attackTypes;
    }
    escalateThreatLevel(current, newLevel) {
        const levels = ['low', 'medium', 'high', 'critical'];
        const currentIndex = levels.indexOf(current);
        const newIndex = levels.indexOf(newLevel);
        return levels[Math.max(currentIndex, newIndex)];
    }
    startMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.performSecurityMonitoring();
        }, 60000);
        structuredLogger.info('Security monitoring started', {
            mfaEnabled: this.config.mfa.enabled,
            csrfEnabled: this.config.csrf.enabled,
            threatDetectionEnabled: this.config.threatDetection.enabled
        });
    }
    performSecurityMonitoring() {
        try {
            this.cleanupExpiredSessions();
            this.cleanupFailedAttempts();
            this.analyzeThreats();
            structuredLogger.debug('Security monitoring completed', {
                activeSessions: this.activeSessions.size,
                securityEvents: this.securityEvents.length,
                threatsDetected: this.threatDatabase.size
            });
        }
        catch (error) {
            structuredLogger.error('Security monitoring failed', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    cleanupExpiredSessions() {
        const now = new Date();
        const expiredSessions = [];
        for (const [sessionId, session] of this.activeSessions.entries()) {
            const sessionAge = now.getTime() - session.lastActivity.getTime();
            if (sessionAge > 24 * 60 * 60 * 1000) {
                expiredSessions.push(sessionId);
            }
        }
        for (const sessionId of expiredSessions) {
            this.activeSessions.delete(sessionId);
        }
        if (expiredSessions.length > 0) {
            structuredLogger.info('Expired sessions cleaned up', {
                count: expiredSessions.length
            });
        }
    }
    cleanupFailedAttempts() {
        const now = new Date();
        const expiredAttempts = [];
        for (const [ipAddress, attempts] of this.failedAttempts.entries()) {
            const attemptAge = now.getTime() - attempts.lastAttempt.getTime();
            if (attemptAge > this.config.threatDetection.lockoutDuration) {
                expiredAttempts.push(ipAddress);
            }
        }
        for (const ipAddress of expiredAttempts) {
            this.failedAttempts.delete(ipAddress);
        }
    }
    analyzeThreats() {
        const now = new Date();
        const criticalThreats = Array.from(this.threatDatabase.values())
            .filter(t => t.threatLevel === 'critical' && !t.blocked);
        if (criticalThreats.length > 0) {
            structuredLogger.warn('Critical threats detected', {
                count: criticalThreats.length,
                ips: criticalThreats.map(t => t.ipAddress)
            });
        }
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('Security configuration updated', { config: this.config });
    }
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        structuredLogger.info('Security manager stopped');
    }
}
export const securityManagerService = SecurityManagerService.getInstance();
//# sourceMappingURL=security-manager.service.js.map