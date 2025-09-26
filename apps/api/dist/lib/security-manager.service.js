import crypto from 'crypto';

import { structuredLogger } from './structured-logger.js';
class SecurityManagerService {
    config;
    securityEvents = [];
    rateLimitStore = new Map();
    blockedIPs = new Set();
    suspiciousIPs = new Map();
    securityStats;
    constructor() {
        this.config = this.initializeConfig();
        this.securityStats = this.initializeStats();
        this.startCleanupInterval();
        this.startSecurityMonitoring();
        structuredLogger.info('Security Manager Service initialized', {
            config: {
                jwt: { enabled: true, expiry: this.config.jwt.accessTokenExpiry },
                rateLimiting: { enabled: true, window: this.config.rateLimiting.windowMs },
                csrf: { enabled: this.config.csrf.enabled },
                sanitization: { enabled: this.config.sanitization.enabled }
            }
        });
    }
    initializeConfig() {
        return {
            jwt: {
                secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
                refreshSecret: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex'),
                accessTokenExpiry: 15 * 60,
                refreshTokenExpiry: 7 * 24 * 60 * 60,
                issuer: 'econeura-api',
                audience: 'econeura-client'
            },
            rateLimiting: {
                windowMs: 15 * 60 * 1000,
                maxRequests: 100,
                skipSuccessfulRequests: false,
                skipFailedRequests: false,
                keyGenerator: (req) => req.ip || 'unknown'
            },
            csrf: {
                enabled: true,
                secret: process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex'),
                tokenLength: 32,
                cookieName: '_csrf',
                headerName: 'x-csrf-token'
            },
            sanitization: {
                enabled: true,
                allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
                allowedAttributes: {
                    'a': ['href', 'title'],
                    'img': ['src', 'alt', 'title']
                },
                maxLength: 10000
            },
            encryption: {
                algorithm: 'aes-256-gcm',
                keyLength: 32,
                ivLength: 16
            },
            session: {
                secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
                maxAge: 24 * 60 * 60 * 1000,
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'strict'
            }
        };
    }
    initializeStats() {
        return {
            total: 0,
            byType: {},
            bySeverity: {},
            bySource: {},
            last24Hours: 0,
            lastHour: 0,
            blocked: 0,
            rateLimited: 0
        };
    }
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupOldData();
            this.updateSecurityStats();
        }, 60 * 60 * 1000);
    }
    startSecurityMonitoring() {
        setInterval(() => {
            this.analyzeSecurityThreats();
            this.updateBlockedIPs();
        }, 5 * 60 * 1000);
    }
    generateTokens(payload) {
        const now = Math.floor(Date.now() / 1000);
        const accessTokenPayload = {
            ...payload,
            iat: now,
            exp: now + this.config.jwt.accessTokenExpiry,
            iss: this.config.jwt.issuer,
            aud: this.config.jwt.audience,
            type: 'access'
        };
        const refreshTokenPayload = {
            ...payload,
            iat: now,
            exp: now + this.config.jwt.refreshTokenExpiry,
            iss: this.config.jwt.issuer,
            aud: this.config.jwt.audience,
            type: 'refresh'
        };
        const accessToken = this.signJWT(accessTokenPayload, this.config.jwt.secret);
        const refreshToken = this.signJWT(refreshTokenPayload, this.config.jwt.refreshSecret);
        return { accessToken, refreshToken };
    }
    verifyToken(token, type = 'access') {
        try {
            const secret = type === 'access' ? this.config.jwt.secret : this.config.jwt.refreshSecret;
            const payload = this.verifyJWT(token, secret);
            if (payload.type !== type) {
                throw new Error('Invalid token type');
            }
            return payload;
        }
        catch (error) {
            this.recordSecurityEvent({
                type: 'authentication',
                severity: 'medium',
                source: { ip: 'unknown', userAgent: 'unknown' },
                details: { reason: 'Invalid token', metadata: { error: error.message } },
                blocked: false,
                action: 'logged'
            });
            throw error;
        }
    }
    signJWT(payload, secret) {
        const header = { alg: 'HS256', typ: 'JWT' };
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = crypto
            .createHmac('sha256', secret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64url');
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }
    verifyJWT(token, secret) {
        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) {
            throw new Error('Invalid token format');
        }
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${header}.${payload}`)
            .digest('base64url');
        if (signature !== expectedSignature) {
            throw new Error('Invalid signature');
        }
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
        if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('Token expired');
        }
        return decodedPayload;
    }
    checkRateLimit(key, maxRequests) {
        const limit = maxRequests || this.config.rateLimiting.maxRequests;
        const now = Date.now();
        const windowStart = now - this.config.rateLimiting.windowMs;
        let rateLimitInfo = this.rateLimitStore.get(key);
        if (!rateLimitInfo || rateLimitInfo.resetTime < now) {
            rateLimitInfo = {
                key,
                count: 0,
                resetTime: now + this.config.rateLimiting.windowMs,
                blocked: false
            };
        }
        if (rateLimitInfo.blocked && rateLimitInfo.resetTime > now) {
            this.recordSecurityEvent({
                type: 'rate_limit',
                severity: 'medium',
                source: { ip: key, userAgent: 'unknown' },
                details: { reason: 'Rate limit exceeded', metadata: { count: rateLimitInfo.count, limit } },
                blocked: true,
                action: 'rate_limited'
            });
            return {
                allowed: false,
                remaining: 0,
                resetTime: rateLimitInfo.resetTime
            };
        }
        rateLimitInfo.count++;
        this.rateLimitStore.set(key, rateLimitInfo);
        if (rateLimitInfo.count > limit) {
            rateLimitInfo.blocked = true;
            this.recordSecurityEvent({
                type: 'rate_limit',
                severity: 'high',
                source: { ip: key, userAgent: 'unknown' },
                details: { reason: 'Rate limit exceeded', metadata: { count: rateLimitInfo.count, limit } },
                blocked: true,
                action: 'blocked'
            });
            return {
                allowed: false,
                remaining: 0,
                resetTime: rateLimitInfo.resetTime
            };
        }
        return {
            allowed: true,
            remaining: Math.max(0, limit - rateLimitInfo.count),
            resetTime: rateLimitInfo.resetTime
        };
    }
    generateCSRFToken() {
        return crypto.randomBytes(this.config.csrf.tokenLength).toString('hex');
    }
    verifyCSRFToken(token, sessionToken) {
        if (!this.config.csrf.enabled)
            return true;
        if (!token || !sessionToken) {
            this.recordSecurityEvent({
                type: 'csrf',
                severity: 'high',
                source: { ip: 'unknown', userAgent: 'unknown' },
                details: { reason: 'Missing CSRF token' },
                blocked: true,
                action: 'blocked'
            });
            return false;
        }
        const isValid = crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(sessionToken, 'hex'));
        if (!isValid) {
            this.recordSecurityEvent({
                type: 'csrf',
                severity: 'high',
                source: { ip: 'unknown', userAgent: 'unknown' },
                details: { reason: 'Invalid CSRF token' },
                blocked: true,
                action: 'blocked'
            });
        }
        return isValid;
    }
    sanitizeInput(input) {
        if (!this.config.sanitization.enabled)
            return input;
        if (input.length > this.config.sanitization.maxLength) {
            this.recordSecurityEvent({
                type: 'xss',
                severity: 'medium',
                source: { ip: 'unknown', userAgent: 'unknown' },
                details: { reason: 'Input too long', metadata: { length: input.length, maxLength: this.config.sanitization.maxLength } },
                blocked: false,
                action: 'logged'
            });
            return input.substring(0, this.config.sanitization.maxLength);
        }
        const sanitized = input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/<iframe\b[^>]*>/gi, '')
            .replace(/<object\b[^>]*>/gi, '')
            .replace(/<embed\b[^>]*>/gi, '');
        const injectionPatterns = [
            /union\s+select/i,
            /drop\s+table/i,
            /delete\s+from/i,
            /insert\s+into/i,
            /update\s+set/i,
            /exec\s*\(/i,
            /eval\s*\(/i
        ];
        for (const pattern of injectionPatterns) {
            if (pattern.test(sanitized)) {
                this.recordSecurityEvent({
                    type: 'injection',
                    severity: 'critical',
                    source: { ip: 'unknown', userAgent: 'unknown' },
                    details: { reason: 'SQL injection attempt detected', metadata: { pattern: pattern.source } },
                    blocked: true,
                    action: 'blocked'
                });
                return '';
            }
        }
        return sanitized;
    }
    encrypt(text) {
        const iv = crypto.randomBytes(this.config.encryption.ivLength);
        const cipher = crypto.createCipher(this.config.encryption.algorithm, this.config.jwt.secret);
        cipher.setAAD(Buffer.from('econeura'));
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex')
        };
    }
    decrypt(encrypted, iv, tag) {
        const decipher = crypto.createDecipher(this.config.encryption.algorithm, this.config.jwt.secret);
        decipher.setAAD(Buffer.from('econeura'));
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    recordSecurityEvent(event) {
        const securityEvent = {
            id: `sec_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
            ...event,
            timestamp: new Date().toISOString()
        };
        this.securityEvents.push(securityEvent);
        this.securityStats.total++;
        this.securityStats.byType[event.type] = (this.securityStats.byType[event.type] || 0) + 1;
        this.securityStats.bySeverity[event.severity] = (this.securityStats.bySeverity[event.severity] || 0) + 1;
        this.securityStats.bySource[event.source.ip] = (this.securityStats.bySource[event.source.ip] || 0) + 1;
        if (event.blocked) {
            this.securityStats.blocked++;
        }
        if (event.action === 'rate_limited') {
            this.securityStats.rateLimited++;
        }
        const logLevel = this.getLogLevelForSeverity(event.severity);
        structuredLogger[logLevel]('Security event recorded', {
            eventId: securityEvent.id,
            type: event.type,
            severity: event.severity,
            source: event.source,
            details: event.details,
            blocked: event.blocked,
            action: event.action
        });
        if (event.severity === 'critical' && event.blocked) {
            this.blockedIPs.add(event.source.ip);
            structuredLogger.error('IP blocked due to critical security event', {
                ip: event.source.ip,
                eventType: event.type,
                reason: event.details.reason
            });
        }
    }
    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }
    blockIP(ip, reason) {
        this.blockedIPs.add(ip);
        this.recordSecurityEvent({
            type: 'authorization',
            severity: 'high',
            source: { ip, userAgent: 'system' },
            details: { reason: `IP blocked: ${reason}` },
            blocked: true,
            action: 'blocked'
        });
    }
    unblockIP(ip) {
        this.blockedIPs.delete(ip);
        structuredLogger.info('IP unblocked', { ip });
    }
    analyzeSecurityThreats() {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        for (const [ip, info] of this.suspiciousIPs) {
            if (info.lastSeen < oneHourAgo) {
                this.suspiciousIPs.delete(ip);
            }
            else if (info.count > 10) {
                this.blockIP(ip, 'Suspicious activity detected');
                this.suspiciousIPs.delete(ip);
            }
        }
        const recentEvents = this.securityEvents.filter(event => new Date(event.timestamp).getTime() > oneHourAgo);
        const criticalEvents = recentEvents.filter(event => event.severity === 'critical');
        if (criticalEvents.length > 5) {
            structuredLogger.error('High number of critical security events detected', {
                count: criticalEvents.length,
                timeWindow: '1 hour'
            });
        }
    }
    updateBlockedIPs() {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    }
    cleanupOldData() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.securityEvents = this.securityEvents.filter(event => new Date(event.timestamp) > oneDayAgo);
    }
    updateSecurityStats() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        this.securityStats.lastHour = this.securityEvents.filter(event => new Date(event.timestamp) > oneHourAgo).length;
        this.securityStats.last24Hours = this.securityEvents.filter(event => new Date(event.timestamp) > oneDayAgo).length;
    }
    getLogLevelForSeverity(severity) {
        switch (severity) {
            case 'critical':
            case 'high':
                return 'error';
            case 'medium':
                return 'warn';
            case 'low':
                return 'info';
            default:
                return 'warn';
        }
    }
    getSecurityStats() {
        return { ...this.securityStats };
    }
    getSecurityEvents(limit = 100) {
        return this.securityEvents.slice(-limit);
    }
    getBlockedIPs() {
        return Array.from(this.blockedIPs);
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('Security config updated', { newConfig });
    }
}
export const securityManagerService = new SecurityManagerService();
//# sourceMappingURL=security-manager.service.js.map