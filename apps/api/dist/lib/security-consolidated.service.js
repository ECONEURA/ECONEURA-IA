import crypto from 'crypto';

import { structuredLogger } from './structured-logger.js';
import { getRedisService } from './redis.service.js';
export class SecurityConsolidatedService {
    config;
    complianceConfig;
    securityEvents = new Map();
    accessControls = new Map();
    permissions = new Map();
    roles = new Map();
    securityPolicies = new Map();
    vulnerabilities = new Map();
    vulnerabilityScans = new Map();
    complianceRequirements = new Map();
    complianceAssessments = new Map();
    complianceFindings = new Map();
    securityTests = new Map();
    blockedIPs = new Set();
    suspiciousIPs = new Map();
    constructor(securityConfig = {}, complianceConfig = {}) {
        this.config = {
            threatDetection: true,
            realTimeMonitoring: true,
            autoIncidentResponse: true,
            vulnerabilityScanning: true,
            accessControl: true,
            auditLogging: true,
            encryption: true,
            mfa: true,
            sessionManagement: true,
            rateLimiting: true,
            maxLoginAttempts: 5,
            lockoutDuration: 900,
            suspiciousActivityThreshold: 10,
            dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY || 'default-key-change-in-production',
            auditLogRetention: 90,
            ...securityConfig
        };
        this.complianceConfig = {
            gdpr: true,
            sox: true,
            hipaa: true,
            pciDss: true,
            iso27001: true,
            soc2: true,
            nist: true,
            cis: true,
            autoAssessment: true,
            reporting: true,
            ...complianceConfig
        };
        this.startSecurityMonitoring();
    }
    async createSecurityEvent(request, organizationId, userId) {
        const securityEvent = {
            id: this.generateId(),
            type: request.type,
            severity: request.severity,
            timestamp: new Date(),
            userId,
            organizationId,
            source: request.source,
            details: request.details,
            riskScore: this.calculateRiskScore(request),
            status: 'detected',
            category: request.category,
            subcategory: request.subcategory,
            tags: request.tags,
            metadata: request.metadata,
            ipAddress: request.ipAddress,
            userAgent: request.userAgent,
            sessionId: request.sessionId,
            resource: request.resource,
            action: request.action,
            result: request.result,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.securityEvents.set(securityEvent.id, securityEvent);
        if (this.config.realTimeMonitoring) {
            await this.processSecurityEvent(securityEvent);
        }
        await this.recordSecurityEvent(securityEvent);
        structuredLogger.info('Security event created', {
            eventId: securityEvent.id,
            type: securityEvent.type,
            severity: securityEvent.severity,
            organizationId,
            requestId: ''
        });
        return securityEvent;
    }
    async getSecurityEvent(eventId) {
        return this.securityEvents.get(eventId) || null;
    }
    async getSecurityEvents(organizationId, filters) {
        let events = Array.from(this.securityEvents.values())
            .filter(e => e.organizationId === organizationId);
        if (filters) {
            if (filters.type) {
                events = events.filter(e => e.type === filters.type);
            }
            if (filters.severity) {
                events = events.filter(e => e.severity === filters.severity);
            }
            if (filters.status) {
                events = events.filter(e => e.status === filters.status);
            }
            if (filters.category) {
                events = events.filter(e => e.category === filters.category);
            }
            if (filters.userId) {
                events = events.filter(e => e.userId === filters.userId);
            }
            if (filters.dateFrom) {
                events = events.filter(e => e.timestamp >= filters.dateFrom);
            }
            if (filters.dateTo) {
                events = events.filter(e => e.timestamp <= filters.dateTo);
            }
        }
        return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async updateSecurityEventStatus(eventId, status) {
        const event = this.securityEvents.get(eventId);
        if (!event)
            return null;
        const updatedEvent = {
            ...event,
            status,
            updatedAt: new Date()
        };
        this.securityEvents.set(eventId, updatedEvent);
        structuredLogger.info('Security event status updated', {
            eventId,
            status,
            requestId: ''
        });
        return updatedEvent;
    }
    async processSecurityEvent(event) {
        event.riskScore = await this.analyzeRiskScore(event);
        await this.evaluateSecurityPolicies(event);
        if (this.config.autoIncidentResponse && event.severity === 'critical') {
            await this.triggerIncidentResponse(event);
        }
        await this.sendSecurityAlert(event);
    }
    calculateRiskScore(request) {
        let score = 0;
        switch (request.severity) {
            case 'low':
                score = 25;
                break;
            case 'medium':
                score = 50;
                break;
            case 'high':
                score = 75;
                break;
            case 'critical':
                score = 100;
                break;
        }
        switch (request.type) {
            case 'threat':
                score += 20;
                break;
            case 'data_access':
                score += 15;
                break;
            case 'system_change':
                score += 10;
                break;
            case 'authentication':
                score += 5;
                break;
        }
        if (request.result === 'denied' || request.result === 'failure') {
            score += 15;
        }
        return Math.min(100, score);
    }
    async analyzeRiskScore(event) {
        let score = event.riskScore;
        const recentEvents = await this.getRecentEvents(event.organizationId, event.userId, 24);
        const similarEvents = recentEvents.filter(e => e.type === event.type &&
            e.category === event.category &&
            e.id !== event.id);
        if (similarEvents.length > 5) {
            score += 20;
        }
        if (event.ipAddress && await this.isSuspiciousIP(event.ipAddress)) {
            score += 25;
        }
        if (this.isUnusualTime(event.timestamp)) {
            score += 10;
        }
        return Math.min(100, score);
    }
    async recordLoginAttempt(email, ipAddress, userAgent, success) {
        try {
            const key = `login_attempts:${email}:${ipAddress}`;
            const redis = getRedisService();
            if (success) {
                await redis.del(key);
                await this.createSecurityEvent({
                    type: 'authentication',
                    severity: 'low',
                    source: 'auth_service',
                    details: { email, success: true },
                    category: 'authentication',
                    subcategory: 'login_success',
                    tags: ['authentication', 'success'],
                    metadata: { email },
                    ipAddress,
                    userAgent,
                    action: 'login',
                    result: 'success'
                }, 'system');
            }
            else {
                const attempts = await redis.incr(key);
                await redis.expire(key, this.config.lockoutDuration);
                if (attempts >= this.config.maxLoginAttempts) {
                    await this.blockIP(ipAddress, 'Too many failed login attempts');
                    await this.createSecurityEvent({
                        type: 'authentication',
                        severity: 'high',
                        source: 'auth_service',
                        details: { email, attempts, blocked: true },
                        category: 'authentication',
                        subcategory: 'login_failure',
                        tags: ['authentication', 'failure', 'blocked'],
                        metadata: { email, attempts },
                        ipAddress,
                        userAgent,
                        action: 'login',
                        result: 'denied'
                    }, 'system');
                }
                else {
                    await this.createSecurityEvent({
                        type: 'authentication',
                        severity: 'medium',
                        source: 'auth_service',
                        details: { email, attempts },
                        category: 'authentication',
                        subcategory: 'login_failure',
                        tags: ['authentication', 'failure'],
                        metadata: { email, attempts },
                        ipAddress,
                        userAgent,
                        action: 'login',
                        result: 'denied'
                    }, 'system');
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
                await this.createSecurityEvent({
                    type: 'threat',
                    severity: 'high',
                    source: 'activity_monitor',
                    details: { action, count, ...details },
                    category: 'suspicious_activity',
                    subcategory: 'high_frequency',
                    tags: ['suspicious', 'activity'],
                    metadata: { userId, action, count },
                    ipAddress,
                    userAgent,
                    action,
                    result: 'detected'
                }, organizationId, userId);
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
    async createComplianceRequirement(request, organizationId) {
        const requirement = {
            id: this.generateId(),
            standard: request.standard,
            requirement: request.requirement,
            description: request.description,
            category: request.category,
            subcategory: request.subcategory,
            priority: request.priority,
            status: 'not_assessed',
            evidence: [],
            controls: [],
            lastAssessed: new Date(),
            nextAssessment: this.calculateNextAssessment(request.standard),
            organizationId,
            tags: request.tags,
            metadata: request.metadata,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.complianceRequirements.set(requirement.id, requirement);
        if (this.complianceConfig.autoAssessment) {
            await this.performAutoAssessment(requirement);
        }
        structuredLogger.info('Compliance requirement created', {
            requirementId: requirement.id,
            standard: requirement.standard,
            organizationId,
            requestId: ''
        });
        return requirement;
    }
    async getComplianceRequirement(requirementId) {
        return this.complianceRequirements.get(requirementId) || null;
    }
    async getComplianceRequirements(organizationId, filters) {
        let requirements = Array.from(this.complianceRequirements.values())
            .filter(r => r.organizationId === organizationId);
        if (filters) {
            if (filters.standard) {
                requirements = requirements.filter(r => r.standard === filters.standard);
            }
            if (filters.status) {
                requirements = requirements.filter(r => r.status === filters.status);
            }
            if (filters.category) {
                requirements = requirements.filter(r => r.category === filters.category);
            }
            if (filters.priority) {
                requirements = requirements.filter(r => r.priority === filters.priority);
            }
        }
        return requirements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async createVulnerability(vulnerability) {
        const newVulnerability = {
            id: this.generateId(),
            ...vulnerability,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.vulnerabilities.set(newVulnerability.id, newVulnerability);
        structuredLogger.info('Vulnerability created', {
            vulnerabilityId: newVulnerability.id,
            severity: newVulnerability.severity,
            organizationId: newVulnerability.organizationId,
            requestId: ''
        });
        return newVulnerability;
    }
    async getVulnerabilities(organizationId, filters) {
        let vulnerabilities = Array.from(this.vulnerabilities.values())
            .filter(v => v.organizationId === organizationId);
        if (filters) {
            if (filters.severity) {
                vulnerabilities = vulnerabilities.filter(v => v.severity === filters.severity);
            }
            if (filters.status) {
                vulnerabilities = vulnerabilities.filter(v => v.status === filters.status);
            }
            if (filters.affectedSystem) {
                vulnerabilities = vulnerabilities.filter(v => v.affectedSystems.includes(filters.affectedSystem));
            }
        }
        return vulnerabilities.sort((a, b) => b.discoveredAt.getTime() - a.discoveredAt.getTime());
    }
    async createSecurityTest(test) {
        const newTest = {
            id: this.generateId(),
            ...test,
            status: 'pending',
            results: [],
            createdAt: new Date()
        };
        this.securityTests.set(newTest.id, newTest);
        structuredLogger.info('Security test created', {
            testId: newTest.id,
            name: newTest.name,
            type: newTest.type,
            requestId: ''
        });
        return newTest;
    }
    async executeSecurityTest(testId) {
        const test = this.securityTests.get(testId);
        if (!test)
            throw new Error(`Security test ${testId} not found`);
        const updatedTest = {
            ...test,
            status: 'running',
            updatedAt: new Date()
        };
        this.securityTests.set(testId, updatedTest);
        setTimeout(async () => {
            await this.completeSecurityTest(testId);
        }, 10000);
        return updatedTest;
    }
    async completeSecurityTest(testId) {
        const test = this.securityTests.get(testId);
        if (!test)
            return;
        const mockResults = [
            {
                id: this.generateId(),
                testId,
                severity: 'medium',
                category: 'authentication',
                description: 'Weak password policy detected',
                recommendation: 'Implement stronger password requirements',
                evidence: ['password_policy_audit.log'],
                status: 'open'
            },
            {
                id: this.generateId(),
                testId,
                severity: 'low',
                category: 'configuration',
                description: 'Default configuration detected',
                recommendation: 'Update default configurations',
                evidence: ['config_audit.log'],
                status: 'open'
            }
        ];
        const completedTest = {
            ...test,
            status: 'completed',
            results: mockResults,
            completedAt: new Date(),
            updatedAt: new Date()
        };
        this.securityTests.set(testId, completedTest);
        structuredLogger.info('Security test completed', {
            testId,
            resultsCount: mockResults.length,
            requestId: ''
        });
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
            if (securityEvent.severity === 'critical') {
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
    generateId() {
        return `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async getRecentEvents(organizationId, userId, hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return Array.from(this.securityEvents.values())
            .filter(e => e.organizationId === organizationId &&
            e.timestamp >= cutoff &&
            (!userId || e.userId === userId));
    }
    async isSuspiciousIP(ipAddress) {
        const suspiciousIPs = ['192.168.1.100', '10.0.0.50', '172.16.0.25'];
        return suspiciousIPs.includes(ipAddress);
    }
    isUnusualTime(timestamp) {
        const hour = timestamp.getHours();
        return hour < 6 || hour > 22;
    }
    async evaluateSecurityPolicies(event) {
        const policies = Array.from(this.securityPolicies.values())
            .filter(p => p.organizationId === event.organizationId && p.status === 'active');
        for (const policy of policies) {
            for (const rule of policy.rules) {
                if (this.evaluatePolicyRule(rule, event)) {
                    await this.executePolicyAction(rule, event);
                }
            }
        }
    }
    evaluatePolicyRule(rule, event) {
        try {
            return eval(rule.condition.replace('event', JSON.stringify(event)));
        }
        catch {
            return false;
        }
    }
    async executePolicyAction(rule, event) {
        switch (rule.action) {
            case 'alert':
                await this.sendSecurityAlert(event, `Policy violation: ${rule.name}`);
                break;
            case 'log':
                break;
            case 'quarantine':
                if (event.userId) {
                    await this.quarantineUser(event.userId, event.organizationId);
                }
                break;
        }
    }
    async triggerIncidentResponse(event) {
    }
    async sendSecurityAlert(event, message) {
        const alertMessage = message || `Security event detected: ${event.type} - ${event.severity} severity`;
    }
    async quarantineUser(userId, organizationId) {
    }
    calculateNextAssessment(standard) {
        const now = new Date();
        const nextAssessment = new Date(now);
        switch (standard) {
            case 'GDPR':
                nextAssessment.setMonth(nextAssessment.getMonth() + 6);
                break;
            case 'SOX':
                nextAssessment.setMonth(nextAssessment.getMonth() + 3);
                break;
            case 'HIPAA':
                nextAssessment.setMonth(nextAssessment.getMonth() + 12);
                break;
            case 'PCI-DSS':
                nextAssessment.setMonth(nextAssessment.getMonth() + 3);
                break;
            case 'ISO27001':
                nextAssessment.setMonth(nextAssessment.getMonth() + 12);
                break;
            default:
                nextAssessment.setMonth(nextAssessment.getMonth() + 6);
        }
        return nextAssessment;
    }
    async performAutoAssessment(requirement) {
        let status = 'not_assessed';
        if (requirement.evidence.length > 0 && requirement.controls.length > 0) {
            const implementedControls = requirement.controls.filter(c => c.status === 'implemented').length;
            const totalControls = requirement.controls.length;
            if (implementedControls === totalControls) {
                status = 'compliant';
            }
            else if (implementedControls > totalControls * 0.5) {
                status = 'partially_compliant';
            }
            else {
                status = 'non_compliant';
            }
        }
        const updatedRequirement = {
            ...requirement,
            status,
            lastAssessed: new Date(),
            updatedAt: new Date()
        };
        this.complianceRequirements.set(requirement.id, updatedRequirement);
    }
    getLogLevel(severity) {
        switch (severity) {
            case 'low': return 'info';
            case 'medium': return 'warn';
            case 'high': return 'error';
            case 'critical': return 'error';
            default: return 'info';
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
    async getServiceStats() {
        return {
            security: {
                totalEvents: this.securityEvents.size,
                totalVulnerabilities: this.vulnerabilities.size,
                totalPolicies: this.securityPolicies.size,
                totalAccessControls: this.accessControls.size,
                config: this.config
            },
            compliance: {
                totalRequirements: this.complianceRequirements.size,
                totalAssessments: this.complianceAssessments.size,
                totalFindings: this.complianceFindings.size,
                config: this.complianceConfig
            },
            testing: {
                totalTests: this.securityTests.size
            }
        };
    }
    updateConfig(securityConfig, complianceConfig) {
        if (securityConfig) {
            this.config = { ...this.config, ...securityConfig };
        }
        if (complianceConfig) {
            this.complianceConfig = { ...this.complianceConfig, ...complianceConfig };
        }
        structuredLogger.info('Security consolidated service config updated', {
            securityConfig: this.config,
            complianceConfig: this.complianceConfig,
            requestId: ''
        });
    }
    getConfig() {
        return {
            security: { ...this.config },
            compliance: { ...this.complianceConfig }
        };
    }
}
export const securityConsolidated = new SecurityConsolidatedService();
//# sourceMappingURL=security-consolidated.service.js.map